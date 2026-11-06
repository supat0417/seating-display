export type Lang = 'th' | 'en';

export interface Dictionary {
  docTitle: string;
  heroTitle: string;
  heroDesc: string;
  searchPlaceholder: string;
  chipsLabel: string;
  legRound: string;
  legLong: string;
  legStage: string;
  legDoor: string;
  planTitle: string;
  hintTag: string;
  zoomInTitle: string;
  zoomOutTitle: string;
  homeTitle: string;
  gpCloseLabel: string;
  gpBackBtn: string;
  gpShowAll: (n: number) => string;
  gpShowLess: string;
  tableWordPrefix: string;
  seatsSuffix: (n: number) => string;
  seatInline: (seat: string) => string;
  capacityFraction: (a: number, b: number) => string;
  emptySeatLabel: string;
  noGuestForTable: string;
  searchEmpty: string;
  /** Short "where in the room" phrase shown under each search result. */
  location: (side: 'left' | 'center' | 'right', depth: 'front' | 'middle' | 'back') => string;
  /** Tap affordance on a search result row. */
  viewOnPlan: string;
  toastTableNotFound: (table: string) => string;
  langToggleTitle: string;
}
