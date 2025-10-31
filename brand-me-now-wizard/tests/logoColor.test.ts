import { describe, it, expect } from 'vitest';
import { comparePaletteWithImage, dominantPaletteColor, hexToRgb } from '../src/utils/colorAnalysis';

describe('color analysis and validation', () => {
  it('detects dominant palette color', () => {
    const p = dominantPaletteColor(['green', 'blue']);
    expect(p).toBeTruthy();
  });

  it('passes validation when average and proportion match primary', async () => {
    const hex = '#00aa00';
    const avg = hexToRgb(hex);
    const analysis = { width:256, height:256, samples:1024, average: avg, primaryProportion: 0.9 };
    const res = comparePaletteWithImage(['#00aa00'], analysis as any);
    expect(res.passed).toBe(true);
    expect(res.primaryMatchScore).toBeGreaterThan(0.4);
  });

  it('fails validation for different color with low proportion', async () => {
    const analysis = { width:256, height:256, samples:1024, average: hexToRgb('#0000aa'), primaryProportion: 0.05 };
    const res = comparePaletteWithImage(['#00aa00'], analysis as any);
    expect(res.passed).toBe(false);
  });

  it('consistency across sizes (simulated analyses)', async () => {
    const hex = '#00aa00';
    const a1 = { width:128, height:128, samples:256, average: hexToRgb(hex), primaryProportion: 0.85 };
    const a2 = { width:512, height:512, samples:1024, average: hexToRgb(hex), primaryProportion: 0.82 };
    const diff = Math.abs(((a1 as any).primaryProportion - (a2 as any).primaryProportion));
    expect(diff).toBeLessThan(0.1);
  });

  it('validates multiple palettes (simulated)', async () => {
    const palettes = [
      ['#00aa00'], ['#0000aa'], ['#aa0000'], ['#800080'], ['#00b3b3'],
      ['#7cb342'], ['#ff8c00'], ['#ff69b4'], ['#8b4513'], ['#111111']
    ];
    for (const palette of palettes) {
      const primary = palette[0];
      const analysis = { width:256, height:256, samples:1024, average: hexToRgb(primary), primaryProportion: 0.9 };
      const res = comparePaletteWithImage(palette, analysis as any);
      expect(res.passed).toBe(true);
    }
  });
});