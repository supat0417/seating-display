import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  computeContentBBox, landmarkFor, normTable, objectBBox, seatCanvasPoint, seatIndexFor, seatPositions, unionRect,
  type FloorplanObject,
} from '../../../domain/floorplan';
import type { Guest } from '../../../domain/guest';
import { useT } from '../../i18n/I18nContext';
import { useCamera, type Inset } from '../../hooks/useCamera';
import { GuestPanel } from './GuestPanel';

const ANIM_MS = 900;
/** Seat dots sit just outside the table outline; include them in the framed area. */
const SEAT_MARGIN = 14;
const MOBILE_QUERY = '(max-width:720px)';
/** Gap kept between the sticky search card and the plan when it is scrolled into view on mobile. */
const MOBILE_TOP_GAP = 8;
/** Upper bound of the mobile sheet's collapsed "peek" height (see .guest-panel in index.css). */
const MOBILE_PEEK_PX = 190;

function isMobile() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

export interface PlanCardHandle {
  /** Focus a specific table object (by id), optionally highlighting a guest name in the
   * opened panel — used by search results and quick-pick chips. */
  focusTable: (obj: FloorplanObject, highlightName: string | null) => void;
}

/** The searched-for guest's table and seat. Unlike the spotlight it survives panning, so the
 * guest can look around the room and still see where they sit. */
interface Pin { tableId: string; seatIndex: number | null; name: string | null; seat: string | null }

export const PlanCard = forwardRef<PlanCardHandle, { floorplan: FloorplanObject[]; guests: Guest[] }>(
  function PlanCard({ floorplan, guests }, ref) {
    const { t } = useT();
    const contentBBox = useMemo(() => computeContentBBox(floorplan), [floorplan]);

    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [focusPt, setFocusPt] = useState({ x: 0, y: 0 });
    const [pin, setPin] = useState<Pin | null>(null);
    const [spotlightOn, setSpotlightOn] = useState(false);
    const [ringKey, setRingKey] = useState(0);
    const [hintVisible, setHintVisible] = useState(true);
    const [panelOpen, setPanelOpen] = useState(false);
    const [panelExpanded, setPanelExpanded] = useState(false);
    const [panelObj, setPanelObj] = useState<FloorplanObject | null>(null);
    const [highlightName, setHighlightName] = useState<string | null>(null);
    const focusTimerRef = useRef<number | undefined>(undefined);

    const clearFocusVisuals = useCallback(() => {
      setFocusedId(null);
      setSpotlightOn(false);
    }, []);

    const closeGuestPanel = useCallback(() => setPanelOpen(false), []);

    const onInteractionStart = useCallback(() => {
      if (focusedId) {
        clearFocusVisuals();
        // The mobile peek sheet is small enough to keep while the guest looks around.
        if (!isMobile()) closeGuestPanel();
      }
    }, [focusedId, clearFocusVisuals, closeGuestPanel]);

    const onTapTable = useCallback((id: string) => {
      const obj = floorplan.find((o) => o.id === id);
      if (obj) focusTable(obj, null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floorplan]);

    const camera = useCamera({ contentBBox, onTapTable, onInteractionStart });

    /** How much of the viewport the guest panel will cover once open. On mobile the panel is
     * a bottom sheet that opens as a short peek, and the plan is scrolled to the top of the
     * screen so it sits entirely above it. */
    function panelInset(): Inset {
      const vp = camera.viewportRef.current;
      const panel = vp?.querySelector<HTMLElement>('.guest-panel');
      if (!vp || !panel) return { right: 0, bottom: 0 };
      if (!isMobile()) {
        return { right: Math.min(panel.offsetWidth, vp.clientWidth * 0.6), bottom: 0 };
      }
      document.body.classList.add('plan-focused');
      // The search card is sticky, so the plan has to land below it rather than at the very top.
      const search = document.querySelector<HTMLElement>('.search-card');
      const stickyTop = search ? parseFloat(getComputedStyle(search).top) || 0 : 0;
      const topGap = (search ? stickyTop + search.offsetHeight : 0) + MOBILE_TOP_GAP;
      const scrollToPlan = () => {
        const top = window.scrollY + vp.getBoundingClientRect().top - topGap;
        window.scrollTo({ top, behavior: 'smooth' });
      };
      scrollToPlan();
      // A late layout change (keyboard finishing closing, URL bar resizing) can cut the smooth
      // scroll short; re-aim once the dust settles.
      window.setTimeout(scrollToPlan, 450);
      const covered = topGap + vp.clientHeight - (window.innerHeight - MOBILE_PEEK_PX);
      return { right: 0, bottom: Math.max(0, Math.min(covered, vp.clientHeight * 0.5)) };
    }

    function focusTable(obj: FloorplanObject, name: string | null) {
      const target = objectBBox(obj);
      target.minX -= SEAT_MARGIN; target.minY -= SEAT_MARGIN;
      target.maxX += SEAT_MARGIN; target.maxY += SEAT_MARGIN;
      const landmark = landmarkFor(floorplan, obj);
      const context = landmark ? unionRect(target, objectBBox(landmark)) : target;
      setFocusPt(camera.focusFrame(target, context, panelInset(), true));

      const guest = name
        ? guests.find((g) => normTable(g.table) === normTable(obj.label) && g.name.trim().toLowerCase() === name.trim().toLowerCase())
        : undefined;
      setPin({
        tableId: obj.id,
        seatIndex: guest ? seatIndexFor(guest.seat, obj.capacity) : null,
        name: guest?.name ?? null,
        seat: guest?.seat ?? null,
      });

      setFocusedId(obj.id);
      setHighlightName(name);
      setSpotlightOn(true);
      setRingKey((k) => k + 1);
      setHintVisible(false);
      setPanelObj(obj);
      setPanelExpanded(false);
      window.clearTimeout(focusTimerRef.current);
      focusTimerRef.current = window.setTimeout(() => setPanelOpen(true), ANIM_MS - 120);
    }

    function resetView() {
      window.clearTimeout(focusTimerRef.current);
      camera.resetToFit(true);
      clearFocusVisuals();
      closeGuestPanel();
      setPin(null);
      setHintVisible(true);
      document.body.classList.remove('plan-focused');
    }

    useImperativeHandle(ref, () => ({ focusTable }), [floorplan, guests]);

    // Initial fit + resize handling (re-fit if not focused; otherwise re-clamp current view).
    useEffect(() => {
      camera.recomputeFit();
      camera.resetToFit(false);
      function onResize() {
        const wasAtFit = !focusedId;
        camera.recomputeFit();
        if (wasAtFit) camera.resetToFit(false);
      }
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pinObj = pin ? floorplan.find((o) => o.id === pin.tableId) ?? null : null;
    const pinPoint = pinObj && pin?.seatIndex != null ? seatCanvasPoint(pinObj, pin.seatIndex) : null;

    return (
      <div className="plan-card">
        <div className="plan-head">
          <div className="plan-title">{t('planTitle')}</div>
          <div className="plan-legend">
            <div className="leg-item"><span className="leg-dot" /><span>{t('legRound')}</span></div>
            <div className="leg-item"><span className="leg-dot long" /><span>{t('legLong')}</span></div>
            <div className="leg-item"><span className="leg-dot stage" /><span>{t('legStage')}</span></div>
            <div className="leg-item"><span className="leg-dot door" /><span>{t('legDoor')}</span></div>
          </div>
        </div>
        <div
          className="viewport"
          ref={camera.viewportRef}
          style={{ '--fx': `${focusPt.x}px`, '--fy': `${focusPt.y}px` } as CSSProperties}
        >
          <div className="floor-canvas" ref={camera.canvasRef}>
            {floorplan.map((o) => {
              const isTable = o.type === 'round' || o.type === 'long';
              // Only tables fade; the stage and doors stay crisp as orientation landmarks.
              const dimmed = isTable && focusedId !== null && focusedId !== o.id;
              const focused = focusedId === o.id;
              const pinned = pin?.tableId === o.id;
              const showSeatNumbers = focused || pinned;
              return (
                <div
                  key={o.id}
                  className={`table-node ${o.type}${dimmed ? ' dimmed' : ''}${focused ? ' focused' : ''}${pinned ? ' pinned' : ''}`}
                  style={{ left: o.x, top: o.y, width: o.w, height: o.h, transform: `rotate(${o.rot || 0}deg)` }}
                  data-id={o.id}
                >
                  {isTable && seatPositions(o.type, o.w, o.h, o.capacity).map((p, i) => (
                    <div
                      key={i}
                      className={`seat-mark${showSeatNumbers ? ' numbered' : ''}${pinned && pin?.seatIndex === i ? ' me' : ''}`}
                      style={{ left: p.x, top: p.y }}
                    >
                      {showSeatNumbers && <span style={{ transform: `rotate(${-(o.rot || 0)}deg)` }}>{i + 1}</span>}
                    </div>
                  ))}
                  <div className="t-label">{o.label}</div>
                  {isTable && <div className="t-sub">{t('seatsSuffix', o.capacity || 0)}</div>}
                </div>
              );
            })}
            {pinPoint && pin && (
              <div key={`${pin.tableId}-${pin.seatIndex}`} className="seat-pin" style={{ left: pinPoint.x, top: pinPoint.y }}>
                <div className="seat-pin-label">
                  <b>{pin.name}</b>
                  <span>{t('seatInline', pin.seat ?? '')}</span>
                </div>
              </div>
            )}
          </div>
          <div className={`spotlight${spotlightOn ? ' show' : ''}`} />
          <div key={ringKey} className={`focus-ring${ringKey > 0 ? ' play' : ''}`} />
          <div className="hint-tag" style={{ opacity: hintVisible ? 1 : 0 }}>{t('hintTag')}</div>
          <div className="zoom-controls">
            <button className="zbtn" title={t('zoomInTitle')} onClick={() => { onInteractionStart(); camera.zoomInBtn(); }}>+</button>
            <button className="zbtn home" title={t('homeTitle')} onClick={resetView}>⤢</button>
            <button className="zbtn" title={t('zoomOutTitle')} onClick={() => { onInteractionStart(); camera.zoomOutBtn(); }}>−</button>
          </div>
          <GuestPanel obj={panelObj} guests={guests} highlightName={highlightName} open={panelOpen}
            expanded={panelExpanded} onToggleExpanded={() => setPanelExpanded((v) => !v)} onClose={resetView} />
        </div>
      </div>
    );
  }
);
