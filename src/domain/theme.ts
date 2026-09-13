// Theme system — ported 1:1 from seating-display.html's applyDisplayTheme/THEMES/resolveTheme.
// Deliberately a SEPARATE implementation from the setup tool's theme.ts (not shared): the
// custom-theme navy-source derivation here is intentionally asymmetric vs preset themes,
// documented in the original source and preserved verbatim below.

export interface ThemePreset {
  id: string;
  colors: [string, string, string, string];
}

export interface CustomThemeColors {
  c60: string;
  c25: string;
  c10: string;
  c5: string;
}

export const THEMES: ThemePreset[] = [
  { id: 'rose', colors: ['#f9eaea', '#fbdcdd', '#f3c6c9', '#bbaad1'] },
  { id: 'sage', colors: ['#e9f2de', '#92ae89', '#577864', '#37454f'] },
  { id: 'plum', colors: ['#6b3f69', '#8b5e8a', '#a87ca0', '#e0c3c5'] },
  { id: 'amber', colors: ['#ebac3b', '#3b6491', '#1f3a5a', '#4a7a8c'] },
];

export function getPreset(id: string): ThemePreset | null {
  return THEMES.find((x) => x.id === id) || null;
}

export function isHexColor(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
}

export type ThemeInput = string | { id: 'custom'; colors: [string, string, string, string] } | null | undefined;
export type ResolvedTheme = (ThemePreset & { custom?: false }) | { id: 'custom'; custom: true; colors: [string, string, string, string] };

/** Accepts either a known preset id, or a valid custom `{id:'custom',colors:[4 hex]}` object;
 * anything else (unknown id, malformed object) resolves to null (falls back to CSS defaults). */
export function resolveTheme(themeInput: ThemeInput): ResolvedTheme | null {
  if (!themeInput) return null;
  if (typeof themeInput === 'object') {
    if (themeInput.id === 'custom' && Array.isArray(themeInput.colors) && themeInput.colors.length === 4 && themeInput.colors.every(isHexColor)) {
      return { id: 'custom', custom: true, colors: themeInput.colors };
    }
    return null;
  }
  const preset = getPreset(themeInput);
  return preset ? { ...preset, custom: false } : null;
}

function themeHexToRgb(hex: string) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function themeRgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
export function themeMix(hexA: string, hexB: string, t: number): string {
  const a = themeHexToRgb(hexA), b = themeHexToRgb(hexB);
  return themeRgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}
function themeLighten(hex: string, amt: number): string { return themeMix(hex, '#ffffff', amt); }
function themeDarken(hex: string, amt: number): string { return themeMix(hex, '#000000', amt); }
function themeRgbTriplet(hex: string): string { const c = themeHexToRgb(hex); return `${c.r},${c.g},${c.b}`; }
function themeLuminance(hex: string): number { const c = themeHexToRgb(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }

interface ThemeShades { light: string; soft: string; mid: string; deep: string }
function themeShades(theme: ResolvedTheme): ThemeShades {
  if (theme.custom) return { light: theme.colors[0], soft: theme.colors[1], mid: theme.colors[2], deep: theme.colors[3] };
  const sorted = [...theme.colors].sort((a, b) => themeLuminance(b) - themeLuminance(a));
  return { light: sorted[0], soft: sorted[1], mid: sorted[2], deep: sorted[3] };
}
function themeAdjustLuminance(hex: string, target: number): string {
  const lum = themeLuminance(hex);
  if (lum <= 0.01) return themeLighten(hex, Math.max(0, Math.min(1, target / 255)));
  if (lum > target) return themeDarken(hex, Math.max(0, Math.min(1, 1 - target / lum)));
  if (lum < target) return themeLighten(hex, Math.max(0, Math.min(1, (target - lum) / (255 - lum))));
  return hex;
}
/** Like themeAdjustLuminance, but only pushes the color when it falls outside [min, max] —
 * within the band, the source's own luminance passes through untouched. Used for the page
 * backdrop so different team themes actually look different, instead of every theme being
 * force-flattened to one exact luminance. */
function themeClampLuminance(hex: string, min: number, max: number): string {
  const lum = themeLuminance(hex);
  if (lum < min) return themeAdjustLuminance(hex, min);
  if (lum > max) return themeAdjustLuminance(hex, max);
  return hex;
}

export const DISPLAY_THEME_VARS = [
  '--navy', '--navy-deep', '--navy-card', '--navy-card-rgb', '--navy-glow',
  '--paper', '--paper-soft', '--gold', '--gold-bright', '--gold-deep', '--gold-soft', '--gold-rgb',
  '--cream', '--slate', '--slate-rgb',
] as const;
export type DisplayThemeTokens = Record<(typeof DISPLAY_THEME_VARS)[number], string>;

/** Pure port of applyDisplayTheme's color math. The asymmetry between custom and preset
 * navy-source selection is deliberate (see original source comments): for custom themes the
 * page-wide dark backdrop reads as the 60% dominant swatch (s.light) darkened; presets keep
 * using their curated darkest swatch (s.deep) — do not "fix" this into symmetry.
 *
 * The backdrop's luminance is clamped to [42, 95] rather than pinned to one exact value: a
 * naturally dark navySource (e.g. amber's deep navy swatch) is barely touched, while a naturally
 * light one (e.g. rose, which has no dark swatch at all) settles near the bright end of the band.
 * This keeps every theme legible under the cream/gold text while still letting brightness vary
 * by team, instead of every theme collapsing onto the same near-black backdrop. --navy-deep is
 * derived as a fixed proportion of the resolved navy (not clamped independently) so the
 * navy → navy-deep gradient keeps its depth at every point in the band. */
export function computeDisplayThemeTokens(theme: ResolvedTheme): DisplayThemeTokens {
  const s = themeShades(theme);
  const navySource = theme.custom ? s.light : s.deep;
  const navy = themeClampLuminance(navySource, 42, 95);
  const navyDeep = themeAdjustLuminance(navy, themeLuminance(navy) * (24 / 42));
  const navyCard = themeAdjustLuminance(s.deep, 62);
  const gold = themeAdjustLuminance(s.mid, 185);
  const goldBright = themeAdjustLuminance(s.mid, 215);
  const goldDeep = themeAdjustLuminance(s.mid, 132);
  const slate = themeAdjustLuminance(s.soft, 144);
  return {
    '--navy': navy,
    '--navy-deep': navyDeep,
    '--navy-card': navyCard,
    '--navy-card-rgb': themeRgbTriplet(navyCard),
    '--navy-glow': themeMix(navy, gold, 0.22),
    '--paper': themeMix('#fbf8f2', s.light, 0.34),
    '--paper-soft': themeMix('#f2ece0', s.light, 0.42),
    '--gold': gold,
    '--gold-bright': goldBright,
    '--gold-deep': goldDeep,
    '--gold-soft': `rgba(${themeRgbTriplet(gold)},0.18)`,
    '--gold-rgb': themeRgbTriplet(gold),
    '--cream': themeMix('#f3ede0', s.light, 0.18),
    '--slate': slate,
    '--slate-rgb': themeRgbTriplet(slate),
  };
}
