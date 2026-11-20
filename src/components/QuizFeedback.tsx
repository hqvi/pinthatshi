import { useEffect, useRef, useState } from 'react';
import type { Geography } from '../map/geography';
import { mercatorY } from '../map/cartography';
import { shapeMetrics } from '../map/geometry';
import { playSound } from '../game/sound';

export function CountrySilhouette({ feature }: { feature: Geography['features'][number] }) {
  const [w,s,e,n] = shapeMetrics(feature).bounds;
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const path = polygons.flatMap(p => p.map(ring => ring.map(([lng,lat], i) => `${i ? 'L':'M'}${lng + Math.round(((w+e)/2-lng)/360)*360},${mercatorY(lat)*360}`).join('')+'Z')).join('');
  return <svg className="hint-silhouette" viewBox={`${w-1} ${mercatorY(n)*360-1} ${Math.max(2,e-w)+2} ${Math.max(2,(mercatorY(s)-mercatorY(n))*360)+2}`} role="img" aria-label="Shape hint for this country"><path d={path} fill={feature.properties.color} stroke="#2b2118" strokeWidth="1" vectorEffect="non-scaling-stroke" fillRule="evenodd"/></svg>;
}
export function StreakBanner({ count, animated = true }: { count: number; animated?: boolean }) {
  const [visible, setVisible] = useState(false), previous = useRef(0);
  useEffect(() => {
    if (count && count !== previous.current) { setVisible(true); playSound('milestone', count); }
    previous.current = count;
    const timer = window.setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(timer);
  }, [count]);
  if (!visible || !count) return null;
  const text = count === 3 ? 'Three' : count === 5 ? 'Five' : count === 10 ? 'Ten' : count;
  return <div className={`streak-event${count >= 10 ? ' streak-gold' : ''}${animated ? '' : ' streak-static'}`} role="status"><span>{text} in a row</span>{count >= 10 ? <div className="streak-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ left: `${(i*47)%100}%`, backgroundColor: ['#ff5e7e','#ffb81c','#00a99d','#4f7cff'][i%4], transform: `rotate(${i*37}deg)`, animationDelay: `${i%4*35}ms` }}/>)}</div> : null}</div>;
}
