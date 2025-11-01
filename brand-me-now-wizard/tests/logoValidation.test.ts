import { describe, it, expect } from 'vitest';
import { BrandLogoSpec } from '../src/utils/logoSpec';
import { validateSVG } from '../src/utils/validation';

const sampleCompliantSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect x="20" y="20" width="60" height="60" fill="#111111" />
  <rect x="120" y="20" width="60" height="60" fill="#111111" />
  <text x="100" y="150" text-anchor="middle" fill="#C8B377" font-family="Montserrat" font-weight="600" letter-spacing="0.02">BRAND</text>
  <rect x="0" y="0" width="0" height="0" fill="#FFFFFF" />
</svg>`;

const sampleNonCompliantSVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <path d="M10 10 H 190 V 190 H 10 Z" fill="#ff00ff" />
  <text x="50" y="150" fill="#00ff00" font-family="Comic Sans MS" font-weight="200" letter-spacing="0.3">brand</text>
</svg>`;

const spec: BrandLogoSpec = {
  icon: {
    style: 'geometric',
    constraints: { symmetry: 'horizontal', complexityMaxPaths: 50 }
  },
  typography: {
    fontFamily: ['Montserrat', 'Inter'],
    allowedFallbacks: ['Arial', 'Helvetica'],
    letterSpacingRange: [0, 0.1],
    weightRange: [500, 800],
    alignment: 'center'
  },
  colors: {
    palette: ['#111111', '#C8B377', '#FFFFFF'],
    tolerance: 8,
    background: '#FFFFFF',
    minContrastAA: 4.5
  }
};

describe('Logo validation', () => {
  it('passes for compliant SVG following spec', () => {
    const result = validateSVG(sampleCompliantSVG, spec);
    expect(result.report.compliant).toBe(true);
    // Palette compliance
    const paletteMetric = result.report.metrics.find(m => m.name === 'palette_compliance');
    expect(paletteMetric?.pass).toBe(true);
  });

  it('fails for non-compliant SVG violating palette and typography', () => {
    const result = validateSVG(sampleNonCompliantSVG, spec);
    expect(result.report.compliant).toBe(false);
    expect(result.report.failedChecks).toContain('colors.palette');
    expect(result.report.failedChecks).toContain('typography.fontFamily');
  });
});