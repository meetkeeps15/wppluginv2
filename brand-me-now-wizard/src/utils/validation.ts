// Validation routines to enforce Icon Style, Typography, and Colors

import { BrandLogoSpec, ComplianceMetric, ComplianceReport, LogoValidationResult, defaultMinContrastAA } from "./logoSpec";
import { analyzeSVG, isColorInPalette } from "./svgUtils";

// Placeholder contrast computation (WCAG requires luminance-based ratio). For simplicity, we check presence of background vs text colors.
function approximateContrast(hexA: string, hexB: string): number {
  // Convert hex to luminance
  const toLum = (hex: string) => {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const c = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const L1 = toLum(hexA);
  const L2 = toLum(hexB);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function validateSVG(svgString: string, spec: BrandLogoSpec): LogoValidationResult {
  const analysis = analyzeSVG(svgString);
  const metrics: ComplianceMetric[] = [];
  const failedChecks: string[] = [];

  // Colors: ensure all used colors belong to the palette within tolerance
  const allColorsCompliant = (analysis.colorsUsed || []).every((c) => isColorInPalette(c, spec.colors.palette, spec.colors.tolerance));
  metrics.push({ name: "palette_compliance", value: allColorsCompliant ? 1 : 0, pass: allColorsCompliant });
  if (!allColorsCompliant) failedChecks.push("colors.palette");

  // Contrast: text vs background (approximate)
  if (spec.colors.background && analysis.textNodes.length > 0) {
    // Heuristic: use first non-background color from colorsUsed as text color
    const textColorHex = (analysis.colorsUsed || []).find((c) => c !== spec.colors.background);
    if (textColorHex) {
      const ratio = approximateContrast(textColorHex, spec.colors.background);
      const pass = ratio >= (spec.colors.minContrastAA ?? defaultMinContrastAA);
      metrics.push({ name: "contrast_ratio", value: Number(ratio.toFixed(2)), pass, details: `against ${spec.colors.background}` });
      if (!pass) failedChecks.push("colors.contrast");
    }
  }

  // Icon style: path complexity limit and symmetry heuristic
  if (spec.icon.constraints?.complexityMaxPaths !== undefined) {
    const withinLimit = (analysis.pathCount || 0) <= spec.icon.constraints.complexityMaxPaths;
    metrics.push({ name: "icon_complexity_paths", value: analysis.pathCount, pass: withinLimit, details: `max ${spec.icon.constraints.complexityMaxPaths}` });
    if (!withinLimit) failedChecks.push("icon.complexityMaxPaths");
  }
  if (spec.icon.constraints?.symmetry && analysis.balanceIndex !== undefined) {
    // Horizontal symmetry heuristic: balanceIndex ~0.5 if symmetric
    const delta = Math.abs((analysis.balanceIndex ?? 0.5) - 0.5);
    const pass = delta <= 0.15; // 15% tolerance
    metrics.push({ name: "icon_symmetry_horizontal", value: Number((1 - delta).toFixed(2)), pass, details: `delta ${Number(delta.toFixed(2))}` });
    if (!pass) failedChecks.push("icon.symmetry");
  }

  // Typography: font family must be allowed; letter spacing and weight ranges
  const fontsOk = analysis.textNodes.every((t) => {
    if (!t.fontFamily) return true; // skip if not specified
    const allowed = spec.typography.fontFamily.map((f) => f.toLowerCase());
    const fallbacks = (spec.typography.allowedFallbacks || []).map((f) => f.toLowerCase());
    const ff = t.fontFamily.toLowerCase();
    return allowed.includes(ff) || fallbacks.includes(ff);
  });
  metrics.push({ name: "typography_font_family", value: fontsOk ? 1 : 0, pass: fontsOk });
  if (!fontsOk) failedChecks.push("typography.fontFamily");

  if (spec.typography.letterSpacingRange) {
    const [min, max] = spec.typography.letterSpacingRange;
    const lsOk = analysis.textNodes.every((t) => t.letterSpacing === undefined || (t.letterSpacing >= min && t.letterSpacing <= max));
    metrics.push({ name: "typography_letter_spacing", value: lsOk ? 1 : 0, pass: lsOk, details: `${min}..${max} em` });
    if (!lsOk) failedChecks.push("typography.letterSpacingRange");
  }

  if (spec.typography.weightRange) {
    const [wmin, wmax] = spec.typography.weightRange;
    const weightOk = analysis.textNodes.every((t) => t.fontWeight === undefined || (t.fontWeight >= wmin && t.fontWeight <= wmax));
    metrics.push({ name: "typography_weight", value: weightOk ? 1 : 0, pass: weightOk, details: `${wmin}..${wmax}` });
    if (!weightOk) failedChecks.push("typography.weightRange");
  }

  // Overall compliance
  const compliant = failedChecks.length === 0;
  const report: ComplianceReport = {
    compliant,
    failedChecks,
    metrics,
    usageGuidelines: compliant
      ? [
          "Use the provided SVG for print and digital to preserve crisp edges.",
          "Maintain the specified color palette; do not introduce tints without approval.",
          "Observe minimum size rules to ensure legibility of typography.",
        ]
      : ["Revise generation with stricter prompts or adjust parameters to meet failed checks."],
  };

  return { report };
}