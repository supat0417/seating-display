import type { Dictionary } from './types';

const en: Dictionary = {
  docTitle: 'seating display',
  heroTitle: 'Find Your Seat',
  heroDesc: 'Type your name below, then tap the result to see your table on the floor plan',
  searchPlaceholder: 'Type your full name...',
  chipsLabel: 'Or pick a table directly',
  legRound: 'Round table',
  legLong: 'Long table',
  legStage: 'Stage',
  legDoor: 'Door',
  planTitle: 'Seating Plan',
  hintTag: 'Drag to pan · scroll to zoom',
  zoomInTitle: 'Zoom in',
  zoomOutTitle: 'Zoom out',
  homeTitle: 'Reset view',
  gpCloseLabel: 'Close',
  gpBackBtn: '◆ Back to overview',
  tableWordPrefix: 'Table ',
  seatsSuffix: (n) => `${n} seat${n === 1 ? '' : 's'}`,
  seatInline: (seat) => `Seat ${seat}`,
  capacityFraction: (a, b) => `${a} / ${b} seats`,
  emptySeatLabel: 'Empty',
  noGuestForTable: 'No guests assigned to this table yet',
  searchEmpty: 'No matching name found. Please check the spelling and try again',
  toastTableNotFound: (table) => `Could not find table "${table}" in the floor plan`,
  langToggleTitle: 'Switch language / เปลี่ยนภาษา',
};

export default en;
