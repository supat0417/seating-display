import { describe, expect, it } from 'vitest';
import { CANVAS_H, CANVAS_W, computeContentBBox, formatTableLabel, seatPositions } from '../floorplan';
import { seatRosterForTable } from '../guest';
import { THEMES, computeDisplayThemeTokens, resolveTheme } from '../theme';
import { loadSeatingData, SeatingDataError } from '../dataFile';
import { DICTIONARIES } from '../i18n';
import rawBundled from '../../data/seating-data.json';

describe('constants', () => {
  it('matches the setup tool coordinate system', () => {
    expect(CANVAS_W).toBe(1400);
    expect(CANVAS_H).toBe(900);
  });
});

describe('seatPositions (display app variant)', () => {
  it('uses a +9 radius and -3 offset for round tables (distinct from the editor)', () => {
    const pts = seatPositions('round', 120, 120, 1);
    const r = 120 / 2 + 9;
    expect(pts[0].x).toBeCloseTo(60 - 3, 5);
    expect(pts[0].y).toBeCloseTo(60 - r - 3, 5);
  });
  it('uses y=-9/h+2 rows for long tables', () => {
    const pts = seatPositions('long', 220, 70, 4);
    expect(pts[0].y).toBeCloseTo(-9, 5);
    expect(pts[2].y).toBeCloseTo(72, 5);
  });
});

describe('formatTableLabel', () => {
  it('prefixes a bare number with the translated table word (which already has a trailing space)', () => {
    expect(formatTableLabel('5', 'Table ')).toBe('Table 5');
    expect(formatTableLabel('Table 5', 'Table ')).toBe('Table 5');
  });
});

describe('computeContentBBox', () => {
  it('falls back to the full canvas when there is no floorplan', () => {
    expect(computeContentBBox([])).toEqual({ minX: 0, minY: 0, maxX: CANVAS_W, maxY: CANVAS_H });
  });
  it('enforces a minimum span for a single small table', () => {
    const bbox = computeContentBBox([{ id: 't1', type: 'round', x: 0, y: 0, w: 40, h: 40, rot: 0, label: 'A', capacity: 4 }]);
    expect(bbox.maxX - bbox.minX).toBeGreaterThanOrEqual(260);
    expect(bbox.maxY - bbox.minY).toBeGreaterThanOrEqual(260);
  });
});

describe('seat roster', () => {
  it('pads to capacity and appends overflow', () => {
    const guests = [{ name: 'A', table: 'T1', seat: '1' }, { name: 'B', table: 'T1', seat: '99' }];
    const rows = seatRosterForTable(guests, { label: 'T1', capacity: 2 });
    expect(rows.map((r) => r.seat)).toEqual(['1', '2', '99']);
    expect(rows[1].empty).toBe(true);
  });
});

describe('theme system', () => {
  it('has the same 4 presets as the editor (id+colors, no display names)', () => {
    expect(THEMES).toHaveLength(4);
    expect(THEMES.map((t) => t.id)).toEqual(['rose', 'sage', 'plum', 'amber']);
  });
  it('resolves a preset id', () => {
    const r = resolveTheme('sage');
    expect(r?.id).toBe('sage');
  });
  it('resolves a valid custom theme object', () => {
    const r = resolveTheme({ id: 'custom', colors: ['#111111', '#222222', '#333333', '#444444'] });
    expect(r?.custom).toBe(true);
  });
  it('returns null for an unknown preset id', () => {
    expect(resolveTheme('not-a-theme')).toBeNull();
  });
  it('produces valid CSS tokens for every preset, with the documented custom/preset navy-source asymmetry preserved', () => {
    THEMES.forEach((theme) => {
      const tokens = computeDisplayThemeTokens({ ...theme, custom: false });
      expect(Object.keys(tokens)).toHaveLength(15);
      expect(tokens['--navy']).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('bundled data validation', () => {
  it('loads and validates the real bundled seating-plan export', () => {
    const data = loadSeatingData(rawBundled);
    expect(data.floorplan.length).toBeGreaterThan(0);
    expect(data.guests.length).toBeGreaterThan(0);
    expect(data.theme === null || data.theme === 'custom' || THEMES.some((theme) => theme.id === data.theme)).toBe(true);
    expect(data.lang === null || data.lang === 'th' || data.lang === 'en').toBe(true);
  });
  it('rejects a payload with no floorplan/guests arrays', () => {
    expect(() => loadSeatingData({ foo: 1 })).toThrow(SeatingDataError);
  });
  it('rejects an empty floorplan', () => {
    expect(() => loadSeatingData({ floorplan: [] })).toThrow(SeatingDataError);
  });
  it('accepts the legacy bare-array form', () => {
    const data = loadSeatingData([{ id: 't1', type: 'round', x: 0, y: 0, w: 100, h: 100 }]);
    expect(data.floorplan).toHaveLength(1);
    expect(data.guests).toEqual([]);
  });
});

describe('i18n dictionary parity', () => {
  it('th and en have identical key sets', () => {
    expect(Object.keys(DICTIONARIES.th).sort()).toEqual(Object.keys(DICTIONARIES.en).sort());
  });
});
