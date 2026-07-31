// The bundled seating data, imported statically at build time (no runtime fetch, no gate,
// no localStorage fallback — see loadSeatingData for the one-time validation pass).
//
// To update the data this app displays: replace src/data/seating-data.json with a fresh
// export from the seating-plan app (its "Export" button produces exactly this shape) and
// rebuild/redeploy.
import raw from './seating-data.json';
import { loadSeatingData } from '../domain/dataFile';

export const seatingData = loadSeatingData(raw);
