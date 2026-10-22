import { useRef, useState } from 'react';
import type { FloorplanObject } from '../../../domain/floorplan';
import { normTable, formatTableLabel } from '../../../domain/floorplan';
import type { Guest } from '../../../domain/guest';
import { useT } from '../../i18n/I18nContext';
import { useToast } from '../../components/Toast';

/** Time for the on-screen keyboard to close (and the page to stop resizing) before the plan
 * is scrolled to and framed. */
const KEYBOARD_CLOSE_MS = 320;

export function SearchCard({
  floorplan, guests, onFocusTable,
}: {
  floorplan: FloorplanObject[];
  guests: Guest[];
  onFocusTable: (obj: FloorplanObject, highlightName: string | null) => void;
}) {
  const { t } = useT();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  // Hidden once a guest is picked so the result list doesn't push the plan off screen;
  // comes back as soon as the guest edits or re-focuses the search box.
  const [showResults, setShowResults] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmed = query.trim().toLowerCase();
  const matches = trimmed ? guests.filter((g) => g.name.toLowerCase().includes(trimmed)).slice(0, 24) : [];

  function selectGuest(g: Guest) {
    const obj = floorplan.find((o) => normTable(o.label) === normTable(g.table));
    if (!obj) {
      showToast(t('toastTableNotFound', g.table));
      return;
    }
    // On touch devices the tap itself may already have started closing the keyboard, so
    // always wait rather than checking focus.
    const touch = window.matchMedia('(pointer:coarse)').matches;
    inputRef.current?.blur();
    setShowResults(false);
    window.setTimeout(() => onFocusTable(obj, g.name), touch ? KEYBOARD_CLOSE_MS : 0);
  }

  return (
    <div className="search-card">
      <div className="search-wrap2">
        <span className="sicon">🔍</span>
        <input
          ref={inputRef}
          type="text"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
        />
      </div>
      {showResults && (
        <div className="search-results2">
          {trimmed && matches.length === 0 && <div className="search-empty">{t('searchEmpty')}</div>}
          {matches.map((g, i) => (
            <div key={i} className="result-row2" onClick={() => selectGuest(g)}>
              <span className="rname2">{g.name}</span>
              <span className="rtable2">{formatTableLabel(g.table, t('tableWordPrefix'))} · {t('seatInline', g.seat)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
