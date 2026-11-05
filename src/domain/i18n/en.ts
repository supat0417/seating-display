import type { Dictionary } from './types';

const en: Dictionary = {
  docTitle: 'Find your seat',
  heroTitle: 'Find your seat',
  heroDesc: 'Type your name, then tap it to see your table and seat on the floor plan.',
  searchPlaceholder: 'Type your name',
  chipsLabel: 'Or choose a table',
  legRound: 'Round table',
  legLong: 'Long table',
  legStage: 'Stage',
  legDoor: 'Door',
  planTitle: 'Floor plan',
  hintTag: 'Drag to move around. Scroll or pinch to zoom.',
  zoomInTitle: 'Zoom in',
  zoomOutTitle: 'Zoom out',
  homeTitle: 'Show the whole room',
  gpCloseLabel: 'Close',
  gpBackBtn: 'Back to the whole room',
  gpShowAll: (n) => `Show everyone at this table (${n})`,
  gpShowLess: 'Show less',
  tableWordPrefix: 'Table ',
  seatsSuffix: (n) => `${n} seat${n === 1 ? '' : 's'}`,
  seatInline: (seat) => `Seat ${seat}`,
  capacityFraction: (a, b) => `${a} / ${b} seats`,
  emptySeatLabel: 'Empty',
  noGuestForTable: 'No one is seated at this table yet.',
  searchEmpty: 'No guest with that name. Check the spelling, or try just your first name.',
  toastTableNotFound: (table) => `Table "${table}" isn't on the floor plan. Please ask a member of staff.`,
  langToggleTitle: 'Switch language / เปลี่ยนภาษา',
};

export default en;
