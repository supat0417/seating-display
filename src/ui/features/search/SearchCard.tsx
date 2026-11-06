import { useEffect, useMemo, useRef, useState } from 'react';
import type { FloorplanObject } from '../../../domain/floorplan';
import { computeContentBBox, describeLocation, normTable, formatTableLabel } from '../../../domain/floorplan';
import type { Guest } from '../../../domain/guest';
import { useT } from '../../i18n/I18nContext';
import { useToast } from '../../components/Toast';
import { MiniMap } from './MiniMap';

/** Time for the on-screen keyboard to close (and the page to stop resizing) before the plan
 * is scrolled to and framed. */
const KEYBOARD_CLOSE_MS = 320;
/** When the typed name narrows the list to one guest, open their table on the plan after the
 * guest stops typing for this long — many guests read the table off the list and never tap. */
const AUTO_OPEN_MS = 1100;
const AUTO_OPEN_MIN_CHARS = 2;

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

  const bbox = useMemo(() => computeContentBBox(floorplan), [floorplan]);
  const tableByKey = useMemo(() => new Map(floorplan.map((o) => [normTable(o.label), o])), [floorplan]);

  const trimmed = query.trim().toLowerCase();
  const matches = trimmed ? guests.filter((g) => g.name.toLowerCase().includes(trimmed)).slice(0, 24) : [];

  function selectGuest(g: Guest) {
    const obj = tableByKey.get(normTable(g.table));
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

  // Keyed on the query only, so re-focusing the box (to edit) never re-triggers it.
  const single = trimmed.length >= AUTO_OPEN_MIN_CHARS && matches.length === 1 ? matches[0] : null;
  useEffect(() => {
    if (!single) return;
    const id = window.setTimeout(() => selectGuest(single), AUTO_OPEN_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="search-card">
      <form
        className="search-wrap2"
        role="search"
        onSubmit={(e) => { e.preventDefault(); if (matches[0]) selectGuest(matches[0]); }}
      >
        <span className="sicon" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="8.5" cy="8.5" r="5.75" /><path d="M13 13l4.5 4.5" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          aria-label={t('searchPlaceholder')}
          autoComplete="off"
          placeholder={t('searchPlaceholder')}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
        />
      </form>
      {showResults && (
        <div className="search-results2">
          {trimmed && matches.length === 0 && <div className="search-empty">{t('searchEmpty')}</div>}
          {matches.map((g, i) => {
            const obj = tableByKey.get(normTable(g.table)) ?? null;
            const loc = obj ? describeLocation(floorplan, obj) : null;
            return (
              <button type="button" key={i} className="result-row2" onClick={() => selectGuest(g)}>
                {obj && <MiniMap floorplan={floorplan} bbox={bbox} targetId={obj.id} />}
                <span className="rbody2">
                  <span className="rname2">{g.name}</span>
                  <span className="rtable2"><b>{formatTableLabel(g.table, t('tableWordPrefix'))}</b>{t('seatInline', g.seat)}</span>
                  {loc && <span className="rloc2">{t('location', loc.side, loc.depth)}</span>}
                </span>
                <span className="rgo2" aria-hidden="true">{t('viewOnPlan')} ›</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
