// Lightweight SVG parsing and analysis utilities to support validation
// Note: We avoid heavy dependencies; these helpers work in the browser runtime

import { defaultColorTolerance } from "./logoSpec";

export interface SvgAnalysis {
  viewBox?: { x: number; y: number; width: number; height: number };
  colorsUsed: string[]; // unique colors (hex or rgb string)
  textNodes: Array<{ text: string; fontFamily?: string; fontWeight?: number; letterSpacing?: number }>;
  pathCount: number;
  // Simple balance heuristic: distribution of elements across left vs right halves
  balanceIndex?: number; // 0 (left heavy) .. 1 (right heavy), ~0.5 balanced
}

// Normalize hex color (e.g., #ABC -> #AABBCC)
export function normalizeHex(hex: string): string {
  const h = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(h)) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
}

// Extract inline style color from a fill/stroke attribute
function extractColor(value: string | null): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (v === "none") return undefined;
  // Accept hex, rgb(), and named colors (convert named to lowercase for comparison)
  if (v.startsWith("#")) return normalizeHex(v);
  if (v.startsWith("rgb")) return v.toLowerCase();
  // Fallback to named color string
  return v.toLowerCase();
}

// Parse an SVG string to DOM and compute basic stats
export function analyzeSVG(svgString: string): SvgAnalysis {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svg = doc.documentElement;

  const viewBoxAttr = svg.getAttribute("viewBox");
  let viewBox: SvgAnalysis["viewBox"]; 
  if (viewBoxAttr) {
    const parts = viewBoxAttr.split(/\s+/).map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
      viewBox = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }

  const colorsSet = new Set<string>();
  let pathCount = 0;
  const textNodes: SvgAnalysis["textNodes"] = [];

  // Track element positions for balance heuristic
  let leftCount = 0;
  let rightCount = 0;

  const elems = svg.querySelectorAll("path, rect, circle, ellipse, polygon, polyline, text");
  elems.forEach((el) => {
    const fill = extractColor(el.getAttribute("fill"));
    const stroke = extractColor(el.getAttribute("stroke"));
    if (fill) colorsSet.add(fill);
    if (stroke) colorsSet.add(stroke);

    if (el.tagName.toLowerCase() === "path") pathCount += 1;

    if (el.tagName.toLowerCase() === "text") {
      const t = el.textContent || "";
      // Read fontFamily via style or attribute
      const style = (el.getAttribute("style") || "").toLowerCase();
      const ffAttr = el.getAttribute("font-family") || undefined;
      const weightAttr = el.getAttribute("font-weight") || undefined;
      const lsAttr = el.getAttribute("letter-spacing") || undefined;

      const fontFamily = ffAttr || (style.match(/font-family:\s*([^;]+)/)?.[1]?.trim());
      const fontWeight = weightAttr ? Number(weightAttr) : undefined;
      const letterSpacing = lsAttr ? Number(lsAttr) : undefined;

      textNodes.push({ text: t, fontFamily: fontFamily || undefined, fontWeight, letterSpacing });
    }

    // Simple position heuristic from x attribute
    const xAttr = el.getAttribute("x");
    if (viewBox && xAttr) {
      const x = Number(xAttr);
      if (!isNaN(x)) {
        const mid = viewBox.x + viewBox.width / 2;
        if (x < mid) leftCount += 1;
        else rightCount += 1;
      }
    }
  });

  let balanceIndex: number | undefined;
  if (leftCount + rightCount > 0) {
    balanceIndex = rightCount / (leftCount + rightCount); // ~0.5 balanced
  }

  return {
    viewBox,
    colorsUsed: Array.from(colorsSet),
    textNodes,
    pathCount,
    balanceIndex,
  };
}

// Compare two hex colors with simple RGB channel distance
export function rgbDistance(hexA: string, hexB: string): number {
  const a = normalizeHex(hexA).replace("#", "");
  const b = normalizeHex(hexB).replace("#", "");
  if (a.length !== 6 || b.length !== 6) return Infinity;
  const ra = parseInt(a.substring(0, 2), 16);
  const ga = parseInt(a.substring(2, 4), 16);
  const ba = parseInt(a.substring(4, 6), 16);
  const rb = parseInt(b.substring(0, 2), 16);
  const gb = parseInt(b.substring(2, 4), 16);
  const bb = parseInt(b.substring(4, 6), 16);
  return Math.abs(ra - rb) + Math.abs(ga - gb) + Math.abs(ba - bb);
}

// Check if a color is within a palette under tolerance
export function isColorInPalette(color: string, palette: string[], tolerance = defaultColorTolerance): boolean {
  const hex = normalizeHex(color);
  if (!hex.startsWith("#")) return palette.map(normalizeHex).includes(hex);
  return palette.some((p) => rgbDistance(hex, normalizeHex(p)) <= tolerance);
}