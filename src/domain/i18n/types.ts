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
  tableWordPrefix: string;
  seatsSuffix: (n: number) => string;
  seatInline: (seat: string) => string;
  capacityFraction: (a: number, b: number) => string;
  emptySeatLabel: string;
  noGuestForTable: string;
  searchEmpty: string;
  toastTableNotFound: (table: string) => string;
  langToggleTitle: string;
}
