// The bundled seating data, imported statically at build time (no runtime fetch, no gate,
// no localStorage fallback — see loadSeatingData for the one-time validation pass).
//
// To update the data this app displays: replace src/data/seating-data.json with a fresh
// export from the seating-plan app (its "Export" button produces exactly this shape) and
// rebuild/redeploy.
//
// wedding-logo.png is a bundled fallback logo used when seating-data.json doesn't carry its
// own `logo` data URI — replace the file to swap logos without touching the JSON export.
import raw from './seating-data.json';
import weddingLogoUrl from './wedding-logo.png';
import { loadSeatingData } from '../domain/dataFile';

const loaded = loadSeatingData(raw);
export const seatingData = { ...loaded, logo: loaded.logo ?? weddingLogoUrl };
