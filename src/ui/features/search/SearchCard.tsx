import { useState } from 'react';
import type { FloorplanObject } from '../../../domain/floorplan';
import { normTable, formatTableLabel } from '../../../domain/floorplan';
import type { Guest } from '../../../domain/guest';
import { useT } from '../../i18n/I18nContext';
import { useToast } from '../../components/Toast';

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

  const trimmed = query.trim().toLowerCase();
  const matches = trimmed ? guests.filter((g) => g.name.toLowerCase().includes(trimmed)).slice(0, 24) : [];

  function selectGuest(g: Guest) {
    const obj = floorplan.find((o) => normTable(o.label) === normTable(g.table));
    if (!obj) {
      showToast(t('toastTableNotFound', g.table));
      return;
    }
    onFocusTable(obj, g.name);
  }

  return (
    <div className="search-card">
      <div className="search-wrap2">
        <span className="sicon">🔍</span>
        <input type="text" placeholder={t('searchPlaceholder')} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="search-results2">
        {trimmed && matches.length === 0 && <div className="search-empty">{t('searchEmpty')}</div>}
        {matches.map((g, i) => (
          <div key={i} className="result-row2" onClick={() => selectGuest(g)}>
            <span className="rname2">{g.name}</span>
            <span className="rtable2">{formatTableLabel(g.table, t('tableWordPrefix'))} · {t('seatInline', g.seat)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
