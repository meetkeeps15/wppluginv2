// Brand logo specification schema and types
// This defines the constraints for Icon Style, Typography, and Colors

export type Symmetry = "none" | "horizontal" | "vertical" | "radial";

export interface IconStyleSpec {
  // High-level style descriptor, can be custom as well
  style:
    | "minimal"
    | "geometric"
    | "monogram"
    | "emblem"
    | "abstract"
    | string;
  constraints?: {
    symmetry?: Symmetry;
    // Stroke width in px for shape outlines (if applicable)
    strokeWidthPx?: number;
    // Corner radius for rounded shapes (if applicable)
    cornerRadiusPx?: number;
    // Complexity limit as number of vector paths allowed
    complexityMaxPaths?: number;
  };
}

export interface TypographySpec {
  // Allowed font families (primary first). The renderer must use one of these
  fontFamily: string[];
  // Case to enforce for brand text
  fontCase?: "upper" | "lower" | "title" | "mixed";
  // Letter spacing tolerance range (em)
  letterSpacingRange?: [number, number];
  // Numeric font weight range (100–900)
  weightRange?: [number, number];
  // Alignment rule
  alignment?: "left" | "center" | "right";
  // Minimum x‑height ratio (for legibility), optional
  minXHeightRatio?: number;
  // Optional fallback fonts when primary is unavailable
  allowedFallbacks?: string[];
}

export interface ColorsSpec {
  // Palette of brand colors to use exactly (hex)
  palette: string[];
  // Tolerance in deltaE or RGB distance (simple RGB distance for heuristics)
  tolerance?: number; // default 8 (on 0–255 channel distance)
  // Preferred background color
  background?: string;
  // Minimum contrast ratio (WCAG AA ~4.5 for text), optional
  minContrastAA?: number;
}

export interface BrandLogoSpec {
  icon: IconStyleSpec;
  typography: TypographySpec;
  colors: ColorsSpec;
}

// Validation metrics and report
export interface ComplianceMetric {
  name: string;
  value: number;
  pass: boolean;
  details?: string;
}

export interface ComplianceReport {
  compliant: boolean;
  failedChecks: string[];
  metrics: ComplianceMetric[];
  usageGuidelines?: string[];
  notes?: string;
}

export interface LogoValidationResult {
  report: ComplianceReport;
  // Optional normalized SVG the UI can render after cleanup/fixes
  normalizedSVG?: string;
}

// Utility: default tolerances
export const defaultColorTolerance = 8; // simple RGB channel distance
export const defaultMinContrastAA = 4.5;