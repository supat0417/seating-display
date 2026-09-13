// Validates the bundled seating-data JSON at module-load time — ported from
// seating-display.html's parseImportedPayload, repurposed as a one-time build-time/load-time
// sanity check now that data is statically bundled rather than user-imported at runtime.
import type { FloorplanObject } from './floorplan';
import type { Guest } from './guest';
import { resolveTheme, type ThemeInput } from './theme';
import type { Lang } from './i18n';

export interface SeatingData {
  floorplan: FloorplanObject[];
  guests: Guest[];
  theme: ThemeInput;
  lang: Lang | null;
  logo: string | null;
}

export class SeatingDataError extends Error {}

export function loadSeatingData(raw: unknown): SeatingData {
  const isBareArray = Array.isArray(raw);
  const obj = isBareArray ? null : (raw as Record<string, unknown>);
  const fpArr = isBareArray ? (raw as unknown[]) : (obj?.floorplan as unknown[] | undefined);
  const gArr = isBareArray ? null : (obj?.guests as unknown[] | undefined);

  if (!Array.isArray(fpArr) && !Array.isArray(gArr)) {
    throw new SeatingDataError('Bundled seating data has no floorplan or guests array.');
  }
  if (Array.isArray(fpArr)) {
    const valid = fpArr.every(
      (o) => o && typeof o === 'object' && (o as any).id && typeof (o as any).x === 'number' && typeof (o as any).y === 'number' && typeof (o as any).w === 'number' && typeof (o as any).h === 'number'
    );
    if (!valid) throw new SeatingDataError('Bundled seating data has an invalid floorplan shape.');
  }
  if (Array.isArray(gArr)) {
    const valid = gArr.every((g) => g && typeof g === 'object');
    if (!valid) throw new SeatingDataError('Bundled seating data has an invalid guests shape.');
  }

  const floorplan: FloorplanObject[] = (fpArr || []).map((o) => {
    const r = o as any;
    return {
      id: String(r.id),
      type: r.type,
      x: Number(r.x) || 0,
      y: Number(r.y) || 0,
      w: Number(r.w) || 100,
      h: Number(r.h) || 100,
      rot: Number(r.rot) || 0,
      label: r.label || '',
      capacity: Math.max(0, Number(r.capacity) || 0),
    };
  });
  const guests: Guest[] = (gArr || []).map((g) => {
    const r = g as any;
    return { name: String(r.name || ''), table: String(r.table || ''), seat: String(r.seat || '') };
  });
  const theme: ThemeInput = !isBareArray && obj && resolveTheme(obj.theme as ThemeInput) ? (obj.theme as ThemeInput) : null;
  const lang: Lang | null = !isBareArray && obj && (obj.lang === 'th' || obj.lang === 'en') ? (obj.lang as Lang) : null;
  const logo: string | null = !isBareArray && obj && typeof obj.logo === 'string' && /^data:image\//.test(obj.logo) ? obj.logo : null;

  if (floorplan.length === 0) {
    throw new SeatingDataError('Bundled seating data has no floorplan objects.');
  }

  return { floorplan, guests, theme, lang, logo };
}
