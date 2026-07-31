import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { computeContentBBox, seatPositions, type FloorplanObject } from '../../../domain/floorplan';
import type { Guest } from '../../../domain/guest';
import { useT } from '../../i18n/I18nContext';
import { useCamera } from '../../hooks/useCamera';
import { GuestPanel } from './GuestPanel';

const ANIM_MS = 900;

export interface PlanCardHandle {
  /** Focus a specific table object (by id), optionally highlighting a guest name in the
   * opened panel — used by search results and quick-pick chips. */
  focusTable: (obj: FloorplanObject, highlightName: string | null) => void;
}

export const PlanCard = forwardRef<PlanCardHandle, { floorplan: FloorplanObject[]; guests: Guest[] }>(
  function PlanCard({ floorplan, guests }, ref) {
    const { t } = useT();
    const contentBBox = useMemo(() => computeContentBBox(floorplan), [floorplan]);

    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [spotlightOn, setSpotlightOn] = useState(false);
    const [ringKey, setRingKey] = useState(0);
    const [hintVisible, setHintVisible] = useState(true);
    const [panelOpen, setPanelOpen] = useState(false);
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
        closeGuestPanel();
      }
    }, [focusedId, clearFocusVisuals, closeGuestPanel]);

    const onTapTable = useCallback((id: string) => {
      const obj = floorplan.find((o) => o.id === id);
      if (obj) focusTable(obj, null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floorplan]);

    const camera = useCamera({ contentBBox, onTapTable, onInteractionStart });

    function focusTable(obj: FloorplanObject, name: string | null) {
      const cx = obj.x + obj.w / 2;
      const cy = obj.y + obj.h / 2;
      camera.focusOn(cx, cy, obj.w, true);
      setFocusedId(obj.id);
      setHighlightName(name);
      setSpotlightOn(true);
      setRingKey((k) => k + 1);
      setHintVisible(false);
      window.clearTimeout(focusTimerRef.current);
      focusTimerRef.current = window.setTimeout(() => {
        setPanelObj(obj);
        setPanelOpen(true);
      }, ANIM_MS - 120);
    }

    function resetView() {
      camera.resetToFit(true);
      clearFocusVisuals();
      closeGuestPanel();
      setHintVisible(true);
    }

    useImperativeHandle(ref, () => ({ focusTable }), [floorplan]);

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
        <div className="viewport" ref={camera.viewportRef}>
          <div className="floor-canvas" ref={camera.canvasRef}>
            {floorplan.map((o) => {
              const isTable = o.type === 'round' || o.type === 'long';
              const dimmed = focusedId !== null && focusedId !== o.id;
              const focused = focusedId === o.id;
              return (
                <div
                  key={o.id}
                  className={`table-node ${o.type}${dimmed ? ' dimmed' : ''}${focused ? ' focused' : ''}`}
                  style={{ left: o.x, top: o.y, width: o.w, height: o.h, transform: `rotate(${o.rot || 0}deg)` }}
                  data-id={o.id}
                >
                  {isTable && seatPositions(o.type, o.w, o.h, o.capacity).map((p, i) => (
                    <div key={i} className="seat-mark" style={{ left: p.x, top: p.y }} />
                  ))}
                  <div className="t-label">{o.label}</div>
                  {isTable && <div className="t-sub">{t('seatsSuffix', o.capacity || 0)}</div>}
                </div>
              );
            })}
          </div>
          <div className={`spotlight${spotlightOn ? ' show' : ''}`} />
          <div key={ringKey} className={`focus-ring${ringKey > 0 ? ' play' : ''}`} />
          <div className="hint-tag" style={{ opacity: hintVisible ? 1 : 0 }}>{t('hintTag')}</div>
          <div className="zoom-controls">
            <button className="zbtn" title={t('zoomInTitle')} onClick={() => { onInteractionStart(); camera.zoomInBtn(); }}>+</button>
            <button className="zbtn home" title={t('homeTitle')} onClick={resetView}>⤢</button>
            <button className="zbtn" title={t('zoomOutTitle')} onClick={() => { onInteractionStart(); camera.zoomOutBtn(); }}>−</button>
          </div>
          <GuestPanel obj={panelObj} guests={guests} highlightName={highlightName} open={panelOpen} onClose={resetView} />
        </div>
      </div>
    );
  }
);
