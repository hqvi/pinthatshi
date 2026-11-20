import { useEffect, useRef } from 'react';
import type { Map as LibreMap } from 'maplibre-gl';

export function Compass({ map, onReset }: { map: LibreMap | null; onReset: () => void }) {
  const needle = useRef<SVGGElement>(null);
  useEffect(() => {
    if (!map || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0, angle = 0, velocity = 0, previous = performance.now(), longitude = map.getCenter().lng, zoom = map.getZoom();
    const tick = (time: number) => {
      const dt = Math.min((time - previous) / 1000, .032); previous = time;
      velocity += (-100 * angle - 10 * velocity) * dt;
      angle = Math.max(-70, Math.min(70, angle + velocity * dt));
      if (needle.current) needle.current.style.transform = `rotate(${angle}deg)`;
      if (Math.abs(angle) > .2 || Math.abs(velocity) > 2) frame = requestAnimationFrame(tick); else { frame = 0; angle = 0; if (needle.current) needle.current.style.transform = ''; }
    };
    const move = () => {
      const next = map.getCenter().lng, nextZoom = map.getZoom();
      if (Math.abs(nextZoom - zoom) < .001) velocity += Math.max(-40, Math.min(40, (next - longitude) * 512 * 2 ** zoom / 360)) * 16;
      longitude = next; zoom = nextZoom;
      if (!frame && velocity) { previous = performance.now(); frame = requestAnimationFrame(tick); }
    };
    map.on('move', move);
    return () => { map.off('move', move); cancelAnimationFrame(frame); };
  }, [map]);
  return <button className="atlas-compass" aria-label="Reset map to practice area" onClick={onReset}><svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#f4e9cd" stroke="#3a2c1d"/><circle cx="26" cy="26" r="20" fill="none" stroke="#6a583f" strokeDasharray=".6 3.2"/>{Array.from({ length: 8 }, (_, i) => <path key={i} d="M26 3v5" transform={`rotate(${i * 45} 26 26)`} stroke="#3a2c1d" strokeWidth={i % 2 ? .6 : 1}/>)}<g ref={needle} className="compass-needle"><path d="M26 9 29.2 26 26 24 22.8 26Z" fill="#c0362d" stroke="#2b2118" strokeWidth=".7"/><path d="M26 43 22.8 26 26 28 29.2 26Z" fill="#f8f0dc" stroke="#2b2118" strokeWidth=".7"/><circle cx="26" cy="26" r="1.5" fill="#2b2118"/></g></svg></button>;
}
