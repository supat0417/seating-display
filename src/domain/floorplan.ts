// Shared coordinate system with the seating-plan setup tool (same CANVAS_W/H, same flat
// FloorplanObject shape) — but this app's own seatPositions dot-radius/offset/spacing
// constants, ported verbatim from seating-display.html (intentionally not byte-identical to
// the setup tool's version: 6px seat dots here vs 7px there).

export type ObjectType = 'round' | 'long' | 'stage' | 'door';

export interface FloorplanObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  label: string;
  capacity: number;
}

export const CANVAS_W = 1400;
export const CANVAS_H = 900;
export const ZOOM_MIN = 0.35;
export const ZOOM_MAX = 3.5;

export function normTable(s: string | null | undefined): string {
  return String(s || '').trim().toLowerCase();
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** seatPositions(type,w,h,capacity) ported verbatim from seating-display.html:
 * round -> radius min(w,h)/2+9, start angle -90deg; long -> two rows, x-spacing (w-14)/+7. */
export function seatPositions(type: ObjectType, w: number, h: number, capacity: number): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  if (capacity <= 0) return pts;
  if (type === 'round') {
    const r = Math.min(w, h) / 2 + 9;
    for (let i = 0; i < capacity; i++) {
      const ang = (i / capacity) * Math.PI * 2 - Math.PI / 2;
      pts.push({ x: w / 2 + r * Math.cos(ang) - 3, y: h / 2 + r * Math.sin(ang) - 3 });
    }
  } else if (type === 'long') {
    const perSide = Math.ceil(capacity / 2);
    for (let i = 0; i < capacity; i++) {
      const side = i < perSide ? 0 : 1;
      const idx = side === 0 ? i : i - perSide;
      const count = side === 0 ? perSide : capacity - perSide;
      const x = count > 1 ? (idx / (count - 1)) * (w - 14) + 7 : w / 2;
      const y = side === 0 ? -9 : h + 2;
      pts.push({ x: x - 3, y });
    }
  }
  return pts;
}

export function formatTableLabel(table: string, tableWordPrefix: string): string {
  const s = String(table || '').trim();
  const lower = s.toLowerCase();
  if (lower.startsWith('โต๊ะ') || lower.startsWith('table')) return s;
  return `${tableWordPrefix}${s}`;
}

/** Rotation-aware tight bounding box around actual table geometry (not the whole 1400x900
 * canvas), padded, with a minimum span so a tiny/lone layout doesn't get zoomed absurdly. */
export function computeContentBBox(floorplan: FloorplanObject[]): { minX: number; minY: number; maxX: number; maxY: number } {
  const PAD = 40;
  const MIN_SPAN = 260;
  if (!floorplan.length) return { minX: 0, minY: 0, maxX: CANVAS_W, maxY: CANVAS_H };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  floorplan.forEach((o) => {
    const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    const rad = ((o.rot || 0) * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const hw = o.w / 2, hh = o.h / 2;
    ([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]] as const).forEach(([dx, dy]) => {
      const rx = cx + dx * cos - dy * sin;
      const ry = cy + dx * sin + dy * cos;
      if (rx < minX) minX = rx;
      if (rx > maxX) maxX = rx;
      if (ry < minY) minY = ry;
      if (ry > maxY) maxY = ry;
    });
  });
  minX -= PAD; minY -= PAD; maxX += PAD; maxY += PAD;
  if (maxX - minX < MIN_SPAN) {
    const c = (minX + maxX) / 2;
    minX = c - MIN_SPAN / 2;
    maxX = c + MIN_SPAN / 2;
  }
  if (maxY - minY < MIN_SPAN) {
    const c = (minY + maxY) / 2;
    minY = c - MIN_SPAN / 2;
    maxY = c + MIN_SPAN / 2;
  }
  return { minX, minY, maxX, maxY };
}
