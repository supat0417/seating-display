import { useEffect, useRef } from 'react';
import type { FloorplanObject } from '../../../domain/floorplan';
import { seatRosterForTable, type Guest } from '../../../domain/guest';
import { useT } from '../../i18n/I18nContext';

/** Side panel on desktop. On mobile it is a bottom sheet that opens as a short "peek"
 * (table + the searched guest's seat) so the plan stays visible; `expanded` reveals the
 * full roster. The peek/expanded split is purely CSS-driven on desktop-sized screens. */
export function GuestPanel({
  obj, guests, highlightName, open, expanded, onToggleExpanded, onClose,
}: {
  obj: FloorplanObject | null;
  guests: Guest[];
  highlightName: string | null;
  open: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const roster = obj ? seatRosterForTable(guests, obj) : [];
  const filled = roster.filter((r) => !r.empty).length;
  const norm = highlightName ? String(highlightName).trim().toLowerCase() : null;
  const me = norm ? roster.find((r) => !r.empty && String(r.name).trim().toLowerCase() === norm) : undefined;

  useEffect(() => {
    if (!open) return;
    if (highlightName) {
      requestAnimationFrame(() => {
        const meEl = bodyRef.current?.querySelector('.me');
        meEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    } else if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, expanded, obj?.id, highlightName]);

  return (
    <>
      <div className={`panel-backdrop${open ? ' show' : ''}`} onClick={onClose} />
      <div className={`guest-panel${open ? ' open' : ''}${expanded ? ' expanded' : ''}`}>
        <div className="gp-head">
          <button className="gp-close" aria-label={t('gpCloseLabel')} onClick={onClose}>&times;</button>
          <div className="gp-eyebrow">Table</div>
          <div className="gp-title">{obj?.label ?? '—'}</div>
          <div className="gp-cap">{obj?.capacity ? t('capacityFraction', filled, obj.capacity) : t('seatsSuffix', filled)}</div>
        </div>
        {me && (
          <div className="gp-peek-me">
            <span className="gname">{me.name}</span>
            <span className="gseat">{t('seatInline', me.seat)}</span>
          </div>
        )}
        <button className="gp-toggle" onClick={onToggleExpanded}>
          {expanded ? t('gpShowLess') : t('gpShowAll', filled)}
        </button>
        <div className="gp-body" ref={bodyRef}>
          {roster.length === 0 ? (
            <div className="gp-empty">{t('noGuestForTable')}</div>
          ) : (
            <ul className="gp-list">
              {roster.map((r, i) => {
                const isMe = !r.empty && norm && String(r.name).trim().toLowerCase() === norm;
                return (
                  <li key={i} className={`${r.empty ? 'empty-seat' : ''}${isMe ? ' me' : ''}`}>
                    <span className="gname">{r.empty ? t('emptySeatLabel') : r.name}</span>
                    <span className="gseat">{t('seatInline', r.seat)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="gp-foot">
          <button className="gp-back" onClick={onClose}>{t('gpBackBtn')}</button>
        </div>
      </div>
    </>
  );
}
