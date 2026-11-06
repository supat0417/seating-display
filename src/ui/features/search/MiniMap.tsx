import { memo } from 'react';
import type { FloorplanObject, Rect } from '../../../domain/floorplan';

/** Thumbnail of the whole room with one table highlighted. Shown in each search result so a
 * screenshot of the list still shows where the table is, even if the plan is never opened. */
export const MiniMap = memo(function MiniMap({
  floorplan, bbox, targetId,
}: {
  floorplan: FloorplanObject[];
  bbox: Rect;
  targetId: string | null;
}) {
  const w = bbox.maxX - bbox.minX, h = bbox.maxY - bbox.minY;
  return (
    <svg className="minimap" viewBox={`${bbox.minX} ${bbox.minY} ${w} ${h}`} aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      {floorplan.map((o) => {
        const cls = o.id === targetId ? 'mm-target' : `mm-${o.type}`;
        const cx = o.x + o.w / 2, cy = o.y + o.h / 2;
        if (o.type === 'round') {
          return <circle key={o.id} className={cls} cx={cx} cy={cy} r={Math.min(o.w, o.h) / 2} />;
        }
        return (
          <rect
            key={o.id} className={cls} x={o.x} y={o.y} width={o.w} height={o.h} rx={o.type === 'long' ? 10 : 6}
            transform={o.rot ? `rotate(${o.rot} ${cx} ${cy})` : undefined}
          />
        );
      })}
    </svg>
  );
});
