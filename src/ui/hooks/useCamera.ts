import { useCallback, useEffect, useRef } from 'react';
import { ZOOM_MAX, ZOOM_MIN, clamp, type Rect } from '../../domain/floorplan';

const ANIM_MS = 900;
/** Focus never zooms past this, so neighbouring tables and the landmark stay readable. */
const FOCUS_MAX_SCALE = 1.8;
/** ...and never shrinks the focused table below this many on-screen pixels. */
const FOCUS_MIN_TABLE_PX = 90;
const FOCUS_PAD = 32;

type BBox = Rect;

/** Viewport edges covered by the guest panel (right on desktop, bottom sheet on mobile). */
export interface Inset { right: number; bottom: number }

export interface UseCameraOptions {
  contentBBox: BBox;
  /** A round/long table-node id if the pointerdown started on one and the gesture ends up
   * being a tap (not a drag) — mirrors the original's tapCandidate/tap-vs-drag logic. */
  onTapTable: (id: string) => void;
  /** Fired on the first pan-move past the drag threshold, and on every wheel tick — mirrors
   * the original's unconditional (but focus-gated by the caller) clearFocusVisuals() calls. */
  onInteractionStart: () => void;
}

export function useCamera({ contentBBox, onTapTable, onInteractionStart }: UseCameraOptions) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const scale = useRef(1);
  const tx = useRef(0);
  const ty = useRef(0);
  const fit = useRef({ scale: 1, tx: 0, ty: 0 });
  const insetRef = useRef<Inset>({ right: 0, bottom: 0 });
  const bboxRef = useRef(contentBBox);
  bboxRef.current = contentBBox;

  const viewportRect = useCallback(() => viewportRef.current!.getBoundingClientRect(), []);

  const applyTransform = useCallback((animate: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.transition = animate ? `transform ${ANIM_MS}ms var(--ease-swoop)` : 'none';
    canvas.style.transform = `translate(${tx.current}px,${ty.current}px) scale(${scale.current})`;
  }, []);

  const clampToBounds = useCallback((txVal: number, tyVal: number, s: number) => {
    const r = viewportRect();
    // Bounds are relative to the uncovered part of the viewport, so a table at the room's
    // edge can still be pulled out from under the guest panel.
    const w = r.width - insetRef.current.right;
    const h = r.height - insetRef.current.bottom;
    const b = bboxRef.current;
    const scaledW = (b.maxX - b.minX) * s;
    const scaledH = (b.maxY - b.minY) * s;
    let minTx: number, maxTx: number, minTy: number, maxTy: number;
    if (scaledW <= w) {
      minTx = maxTx = (w - scaledW) / 2 - b.minX * s;
    } else {
      maxTx = -b.minX * s;
      minTx = w - b.maxX * s;
    }
    if (scaledH <= h) {
      minTy = maxTy = (h - scaledH) / 2 - b.minY * s;
    } else {
      maxTy = -b.minY * s;
      minTy = h - b.maxY * s;
    }
    return { tx: clamp(txVal, minTx, maxTx), ty: clamp(tyVal, minTy, maxTy) };
  }, [viewportRect]);

  const recomputeFit = useCallback(() => {
    const vp = viewportRef.current;
    const vw = vp?.clientWidth || 1;
    const vh = vp?.clientHeight || 1;
    const pad = 0.94;
    const b = bboxRef.current;
    const bw = b.maxX - b.minX;
    const bh = b.maxY - b.minY;
    const fitScale = clamp(Math.min(vw / bw, vh / bh) * pad, ZOOM_MIN, ZOOM_MAX);
    fit.current = {
      scale: fitScale,
      tx: (vw - bw * fitScale) / 2 - b.minX * fitScale,
      ty: (vh - bh * fitScale) / 2 - b.minY * fitScale,
    };
  }, []);

  const zoomAtPoint = useCallback((newScale: number, clientX: number, clientY: number, animate: boolean) => {
    const r = viewportRect();
    const clamped = clamp(newScale, ZOOM_MIN, ZOOM_MAX);
    const localX = (clientX - r.left - tx.current) / scale.current;
    const localY = (clientY - r.top - ty.current) / scale.current;
    scale.current = clamped;
    const c = clampToBounds(clientX - r.left - localX * clamped, clientY - r.top - localY * clamped, scale.current);
    tx.current = c.tx;
    ty.current = c.ty;
    applyTransform(animate);
  }, [applyTransform, clampToBounds, viewportRect]);

  const resetToFit = useCallback((animate: boolean) => {
    insetRef.current = { right: 0, bottom: 0 };
    recomputeFit();
    scale.current = fit.current.scale;
    tx.current = fit.current.tx;
    ty.current = fit.current.ty;
    applyTransform(animate);
  }, [applyTransform, recomputeFit]);

  /** Frame `target` (the focused table) together with `context` (table + landmark) inside the
   * part of the viewport not covered by `inset`. Zoom is capped so the surroundings stay
   * visible; if the whole context can't fit at a readable size, the view leans toward the
   * landmark while keeping the target fully on screen. Returns the target's centre in
   * viewport pixels after the move. */
  const focusFrame = useCallback((target: Rect, context: Rect, inset: Inset, animate: boolean) => {
    insetRef.current = inset;
    const r = viewportRect();
    const safeW = Math.max(r.width - inset.right, 1);
    const safeH = Math.max(r.height - inset.bottom, 1);
    const tw = target.maxX - target.minX, th = target.maxY - target.minY;
    const cw = context.maxX - context.minX, ch = context.maxY - context.minY;

    const fitContext = Math.min((safeW - 2 * FOCUS_PAD) / cw, (safeH - 2 * FOCUS_PAD) / ch);
    const maxS = Math.min(FOCUS_MAX_SCALE, (safeW - 2 * FOCUS_PAD) / tw, (safeH - 2 * FOCUS_PAD) / th);
    const minS = Math.min(FOCUS_MIN_TABLE_PX / Math.max(tw, th), maxS);
    const s = clamp(Math.max(clamp(fitContext, minS, maxS), fit.current.scale), ZOOM_MIN, ZOOM_MAX);

    const tcx = (target.minX + target.maxX) / 2, tcy = (target.minY + target.maxY) / 2;
    const slackX = Math.max(0, (safeW / 2 - FOCUS_PAD - (tw * s) / 2) / s);
    const slackY = Math.max(0, (safeH / 2 - FOCUS_PAD - (th * s) / 2) / s);
    const cx = clamp((context.minX + context.maxX) / 2, tcx - slackX, tcx + slackX);
    const cy = clamp((context.minY + context.maxY) / 2, tcy - slackY, tcy + slackY);

    scale.current = s;
    const c = clampToBounds(safeW / 2 - cx * s, safeH / 2 - cy * s, s);
    tx.current = c.tx;
    ty.current = c.ty;
    applyTransform(animate);
    return { x: c.tx + tcx * s, y: c.ty + tcy * s };
  }, [applyTransform, clampToBounds, viewportRect]);

  const zoomInBtn = useCallback(() => {
    const r = viewportRect();
    zoomAtPoint(scale.current * 1.25, r.left + r.width / 2, r.top + r.height / 2, true);
  }, [viewportRect, zoomAtPoint]);
  const zoomOutBtn = useCallback(() => {
    const r = viewportRect();
    zoomAtPoint(scale.current / 1.25, r.left + r.width / 2, r.top + r.height / 2, true);
  }, [viewportRect, zoomAtPoint]);

  // ---- pointer/pinch/wheel interactions ----
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const activePointers = new Map<number, { x: number; y: number }>();
    let panState: { startX: number; startY: number; startTx: number; startTy: number; moved: boolean; tapCandidateId: string | null } | null = null;
    let pinchState: { startDist: number; startScale: number } | null = null;

    function onScroll() {
      if (vp!.scrollLeft || vp!.scrollTop) {
        vp!.scrollLeft = 0;
        vp!.scrollTop = 0;
      }
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      if (target.closest('.guest-panel')) return;
      vp!.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (activePointers.size === 1) {
        const tapEl = target.closest<HTMLElement>('.table-node.round, .table-node.long');
        panState = { startX: e.clientX, startY: e.clientY, startTx: tx.current, startTy: ty.current, moved: false, tapCandidateId: tapEl?.dataset.id ?? null };
        vp!.classList.add('grabbing');
      } else if (activePointers.size === 2) {
        panState = null;
        const pts = [...activePointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchState = { startDist: dist || 1, startScale: scale.current };
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinchState && activePointers.size === 2) {
        const pts = [...activePointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const newScale = clamp(pinchState.startScale * (dist / pinchState.startDist), ZOOM_MIN, ZOOM_MAX);
        zoomAtPoint(newScale, midX, midY, false);
      } else if (panState) {
        const dx = e.clientX - panState.startX;
        const dy = e.clientY - panState.startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          if (!panState.moved) onInteractionStart();
          panState.moved = true;
        }
        const c = clampToBounds(panState.startTx + dx, panState.startTy + dy, scale.current);
        tx.current = c.tx;
        ty.current = c.ty;
        applyTransform(false);
      }
    }

    function endPointer(e: PointerEvent) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) pinchState = null;
      if (activePointers.size === 0) {
        vp!.classList.remove('grabbing');
        if (panState && !panState.moved && panState.tapCandidateId) {
          onTapTable(panState.tapCandidateId);
        }
        panState = null;
      }
    }

    function onPointerLeave(e: PointerEvent) {
      if (activePointers.has(e.pointerId)) endPointer(e);
    }

    function onWheel(e: WheelEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('.guest-panel')) return;
      e.preventDefault();
      onInteractionStart();
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoomAtPoint(scale.current * factor, e.clientX, e.clientY, false);
    }

    vp.addEventListener('scroll', onScroll);
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', endPointer);
    vp.addEventListener('pointercancel', endPointer);
    vp.addEventListener('pointerleave', onPointerLeave);
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      vp.removeEventListener('scroll', onScroll);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', endPointer);
      vp.removeEventListener('pointercancel', endPointer);
      vp.removeEventListener('pointerleave', onPointerLeave);
      vp.removeEventListener('wheel', onWheel);
    };
  }, [applyTransform, clampToBounds, onInteractionStart, onTapTable, zoomAtPoint]);

  return {
    viewportRef,
    canvasRef,
    focusFrame,
    resetToFit,
    zoomInBtn,
    zoomOutBtn,
    recomputeFit,
    applyCurrentTransform: applyTransform,
    setScaleTx: (s: number, x: number, y: number) => { scale.current = s; tx.current = x; ty.current = y; },
    getFit: () => fit.current,
  };
}
