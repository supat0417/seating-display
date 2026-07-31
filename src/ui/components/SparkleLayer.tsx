import { useEffect, useRef } from 'react';

/** Ports spawnSparkles(): 18 randomly-placed/sized/timed floating gold dots, spawned once. */
export function SparkleLayer() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    const n = 18;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      const size = 2 + Math.random() * 3;
      s.className = 'sparkle';
      s.style.width = size + 'px';
      s.style.height = size + 'px';
      s.style.left = Math.random() * 100 + 'vw';
      s.style.top = 20 + Math.random() * 70 + 'vh';
      s.style.animationDelay = Math.random() * 7 + 's';
      s.style.animationDuration = 6 + Math.random() * 5 + 's';
      layer.appendChild(s);
    }
  }, []);

  return <div ref={ref} id="sparkleLayer" />;
}
