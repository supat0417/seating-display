import { normTable } from './floorplan';

export interface Guest {
  name: string;
  table: string;
  seat: string;
}

export interface SeatRosterRow {
  seat: string;
  name: string;
  empty: boolean;
}

function seatSortCompare(a: Guest, b: Guest): number {
  const an = parseFloat(a.seat);
  const bn = parseFloat(b.seat);
  if (!isNaN(an) && !isNaN(bn)) return an - bn;
  return String(a.seat).localeCompare(String(b.seat));
}

export function guestsForTable(guests: Guest[], tableLabel: string): Guest[] {
  return guests.filter((g) => normTable(g.table) === normTable(tableLabel)).sort(seatSortCompare);
}

export function seatRosterForTable(guests: Guest[], table: { label: string; capacity: number }): SeatRosterRow[] {
  const assigned = guestsForTable(guests, table.label);
  const capacity = table.capacity || 0;
  if (capacity <= 0) return assigned.map((g) => ({ seat: g.seat, name: g.name, empty: false }));

  const bySeat: Record<string, Guest[]> = {};
  assigned.forEach((g) => {
    const key = String(g.seat || '').trim();
    if (!bySeat[key]) bySeat[key] = [];
    bySeat[key].push(g);
  });

  const rows: SeatRosterRow[] = [];
  const usedKeys = new Set<string>();
  for (let s = 1; s <= capacity; s++) {
    const key = String(s);
    usedKeys.add(key);
    if (bySeat[key] && bySeat[key].length) {
      bySeat[key].forEach((g) => rows.push({ seat: key, name: g.name, empty: false }));
    } else {
      rows.push({ seat: key, name: '', empty: true });
    }
  }
  assigned.forEach((g) => {
    const key = String(g.seat || '').trim();
    if (!usedKeys.has(key)) rows.push({ seat: g.seat, name: g.name, empty: false });
  });
  return rows;
}
