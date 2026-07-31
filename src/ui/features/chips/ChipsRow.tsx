import type { FloorplanObject } from '../../../domain/floorplan';
import { useT } from '../../i18n/I18nContext';

export function ChipsRow({
  floorplan, onFocusTable,
}: {
  floorplan: FloorplanObject[];
  onFocusTable: (obj: FloorplanObject, highlightName: string | null) => void;
}) {
  const { t } = useT();
  const tables = floorplan.filter((o) => o.type === 'round' || o.type === 'long');
  if (!tables.length) return null;

  const sorted = [...tables].sort((a, b) => String(a.label).localeCompare(String(b.label), 'th', { numeric: true }));

  return (
    <div className="chips-row">
      <div className="chips-label">{t('chipsLabel')}</div>
      {sorted.map((o) => (
        <button key={o.id} className="chip2" onClick={() => onFocusTable(o, null)}>{o.label}</button>
      ))}
    </div>
  );
}
