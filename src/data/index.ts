// The bundled seating data is the fallback used when public/data.json is absent or invalid.
//
// To update the data this app displays: replace src/data/seating-data.json with a fresh
// export from the seating-plan app (its "Export" button produces exactly this shape) and
// rebuild/redeploy.
//
import raw from './seating-data.json';
import { loadSeatingData, type SeatingData } from '../domain/dataFile';

const loaded = loadSeatingData(raw);
export const fallbackSeatingData: SeatingData = loaded;

/** Loads the latest seating-plan export placed at public/data.json without requiring a rebuild. */
export async function loadDisplayData(): Promise<SeatingData> {
	try {
		const response = await fetch(`${import.meta.env.BASE_URL}data.json`, { cache: 'no-store' });
		if (!response.ok) throw new Error(`data.json returned ${response.status}`);
		const loadedData = loadSeatingData(await response.json());
		return loadedData;
	} catch {
		return fallbackSeatingData;
	}
}
