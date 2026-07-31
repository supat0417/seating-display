import { useCallback, useEffect, useRef } from 'react';
import { ZOOM_MAX, ZOOM_MIN, clamp } from '../../domain/floorplan';

const ANIM_MS = 900;

interface BBox { minX: number; minY: number; maxX: number; maxY: number }

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
    const b = bboxRef.current;
    const scaledW = (b.maxX - b.minX) * s;
    const scaledH = (b.maxY - b.minY) * s;
    let minTx: number, maxTx: number, minTy: number, maxTy: number;
    if (scaledW <= r.width) {
      minTx = maxTx = (r.width - scaledW) / 2 - b.minX * s;
    } else {
      maxTx = -b.minX * s;
      minTx = r.width - b.maxX * s;
    }
    if (scaledH <= r.height) {
      minTy = maxTy = (r.height - scaledH) / 2 - b.minY * s;
    } else {
      maxTy = -b.minY * s;
      minTy = r.height - b.maxY * s;
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

  const centerOn = useCallback((px: number, py: number, targetScale: number, animate: boolean) => {
    scale.current = clamp(targetScale, ZOOM_MIN, ZOOM_MAX);
    const r = viewportRect();
    const c = clampToBounds(r.width / 2 - px * scale.current, r.height / 2 - py * scale.current, scale.current);
    tx.current = c.tx;
    ty.current = c.ty;
    applyTransform(animate);
  }, [applyTransform, clampToBounds, viewportRect]);

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
    recomputeFit();
    scale.current = fit.current.scale;
    tx.current = fit.current.tx;
    ty.current = fit.current.ty;
    applyTransform(animate);
  }, [applyTransform, recomputeFit]);

  const focusOn = useCallback((cx: number, cy: number, objW: number, animate: boolean) => {
    const r = viewportRect();
    const targetScale = clamp((r.width * 0.5) / Math.max(objW, 60), 1.7, 3.0);
    centerOn(cx, cy, targetScale, animate);
  }, [centerOn, viewportRect]);

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
    focusOn,
    resetToFit,
    zoomInBtn,
    zoomOutBtn,
    recomputeFit,
    applyCurrentTransform: applyTransform,
    setScaleTx: (s: number, x: number, y: number) => { scale.current = s; tx.current = x; ty.current = y; },
    getFit: () => fit.current,
  };
}
