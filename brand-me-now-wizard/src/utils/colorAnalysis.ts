// Color analysis and validation utilities
// Helps ensure generated logos adhere to the selected palette

import { colorMap } from './colorUtils';

export type RGB = { r:number; g:number; b:number };
export type Analysis = {
  width:number;
  height:number;
  samples:number;
  average: RGB;
  primaryProportion?: number; // optional proportion of pixels close to primary
  onPaletteProportion?: number; // proportion of sampled pixels close to any palette color
};

export function hexToRgb(hex:string): RGB {
  const h = String(hex).replace('#','').trim();
  const n = h.length === 3 ? h.split('').map(ch => ch+ch).join('') : h;
  const v = parseInt(n, 16);
  return { r: (v>>16)&255, g: (v>>8)&255, b: v&255 };
}

export function rgbToHex({r,g,b}:RGB): string {
  const to = (n:number)=> n.toString(16).padStart(2,'0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function colorDistance(a:RGB, b:RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr*dr + dg*dg + db*db);
}

export function colorDistanceHex(aHex:string, bHex:string): number {
  return colorDistance(hexToRgb(aHex), hexToRgb(bHex));
}

// Determine dominant (primary) color from palette; prefer a known hex mapping if color name provided
export function dominantPaletteColor(palette:string[]): string | null {
  if (!palette || palette.length === 0) return null;
  const primary = palette[0];
  const mapped = colorMap[String(primary).toLowerCase()];
  if (mapped) return mapped;
  // If user provided a hex value, accept it
  if (/^#?[0-9a-fA-F]{6}$/.test(primary)) return primary.startsWith('#') ? primary : `#${primary}`;
  return null;
}

// Analyze an image by URL: fetch as blob, draw onto canvas, sample pixels on a grid
export async function analyzeImageFromUrl(url:string, opts?:{ sampleStep?: number; primaryHex?:string; paletteHexes?: string[]; whiteLuma?: number; alphaMin?: number }): Promise<Analysis> {
  const sampleStep = Math.max(4, Math.min(32, (opts?.sampleStep ?? 12)));
  const blob = await fetch(url, { mode: 'cors' }).then(r => {
    if (!r.ok) throw new Error(`Image fetch failed: ${r.status}`);
    return r.blob();
  });
  const objUrl = URL.createObjectURL(blob);
  const img = await loadImage(objUrl);
  const width = img.width;
  const height = img.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unsupported');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0,0,width,height).data;

  let rSum=0,gSum=0,bSum=0, count=0;
  let primaryClose=0;
  let paletteClose=0;
  const primaryHex = opts?.primaryHex || null;
  const primaryRgb = primaryHex ? hexToRgb(primaryHex) : null;
  const threshold = 85; // stricter color distance threshold to count as close to primary/palette
  const paletteHexes = (opts?.paletteHexes || []).map(h => h?.startsWith('#') ? h : `#${h}`).filter(h => /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(h));
  const paletteRgbs: RGB[] = paletteHexes.map(hexToRgb);
  const whiteLuma = opts?.whiteLuma ?? 0.92;
  const alphaMin = opts?.alphaMin ?? 10; // ignore near-transparent
  for (let y=0; y<height; y+=sampleStep) {
    for (let x=0; x<width; x+=sampleStep) {
      const idx = (y*width + x)*4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const a = data[idx+3];
      // Skip near-white background and near-transparent pixels
      const luma = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
      if (a < alphaMin || luma > whiteLuma) {
        continue;
      }
      rSum += r; gSum += g; bSum += b; count++;
      if (primaryRgb) {
        const d = colorDistance({r,g,b}, primaryRgb);
        if (d <= threshold) primaryClose++;
      }
      if (paletteRgbs.length) {
        let nearest = Infinity;
        for (const prgb of paletteRgbs) {
          const d = colorDistance({r,g,b}, prgb);
          if (d < nearest) nearest = d;
          if (nearest <= threshold) break;
        }
        if (nearest <= threshold) paletteClose++;
      }
    }
  }
  URL.revokeObjectURL(objUrl);
  // Fallback: if all pixels were skipped (e.g., fully white background), compute average without skipping
  if (count === 0) {
    for (let y=0; y<height; y+=sampleStep) {
      for (let x=0; x<width; x+=sampleStep) {
        const idx = (y*width + x)*4;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        rSum += r; gSum += g; bSum += b; count++;
        if (primaryRgb) {
          const d = colorDistance({r,g,b}, primaryRgb);
          if (d <= threshold) primaryClose++;
        }
        if (paletteRgbs.length) {
          let nearest = Infinity;
          for (const prgb of paletteRgbs) {
            const d = colorDistance({r,g,b}, prgb);
            if (d < nearest) nearest = d;
            if (nearest <= threshold) break;
          }
          if (nearest <= threshold) paletteClose++;
        }
      }
    }
  }
  const avg: RGB = { r: Math.round(rSum/count || 0), g: Math.round(gSum/count || 0), b: Math.round(bSum/count || 0) };
  const analysis: Analysis = { width, height, samples: count, average: avg };
  if (primaryRgb) analysis.primaryProportion = primaryClose / count;
  if (paletteRgbs.length) analysis.onPaletteProportion = paletteClose / count;
  return analysis;
}

export function comparePaletteWithImage(palette:string[], analysis: Analysis): { passed:boolean; primaryMatchScore:number } {
  const primaryHex = dominantPaletteColor(palette);
  if (!primaryHex) return { passed:false, primaryMatchScore:0 };
  const avgHex = rgbToHex(analysis.average);
  const distanceAvg = colorDistanceHex(primaryHex, avgHex);
  const primaryProportion = analysis.primaryProportion ?? 0;
  const onPaletteProportion = analysis.onPaletteProportion ?? 0;
  // Heuristic: ensure most pixels are on-palette and a meaningful fraction are near primary, OR the average is close to primary
  const avgClose = distanceAvg < 85;
  const onPaletteOk = onPaletteProportion >= 0.8;
  const primaryOk = primaryProportion >= 0.3;
  const passed = (onPaletteOk && primaryOk) || avgClose;
  const score = (avgClose ? 0.1 : 0) + (Math.min(1, onPaletteProportion) * 0.4) + (Math.min(1, primaryProportion) * 0.5);
  return { passed, primaryMatchScore: score };
}

function loadImage(src:string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Image load error'));
    img.src = src;
  });
}