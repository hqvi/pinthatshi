import { memo, useId, useMemo } from 'react';
import type { Area } from '../data/areas';
import type { Geography } from '../map/geography';
import { framing, shapeMetrics } from '../map/geometry';
import { scopeColors } from '../map/palette';
import paperMap from '../assets/world-paper.svg';
import colorMap from '../assets/world-color.svg';

const mercator = (latitude: number) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));
const top = mercator(85), bottom = mercator(-60);
const scale = Math.min(1200 / (2 * Math.PI), 800 / (top - bottom));
const left = (1200 - 2 * Math.PI * scale) / 2;
const inset = (800 - (top - bottom) * scale) / 2;

function viewBox(area: Area, bounds = area.bounds): string {
  const [west, south, east, north] = bounds;
  const x = left + (west + 180) * Math.PI / 180 * scale;
  const y = inset + (top - mercator(north)) * scale;
  const width = (east - west) * Math.PI / 180 * scale;
  const height = (mercator(north) - mercator(south)) * scale;
  return `${x} ${y} ${width} ${height}`;
}

const paths = new WeakMap<Geography, Map<string, string>>();
function geographyPaths(data: Geography) {
  let result = paths.get(data); if (result) return result;
  result = new Map();
  for (const f of data.features) {
    const rings = f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat();
    result.set(f.properties.id, rings.map(ring => ring.map(([lng, lat], i) => `${i ? 'L' : 'M'}${(left + (lng + 180) * Math.PI / 180 * scale).toFixed(2)},${(inset + (top - mercator(Math.max(-85, Math.min(85, lat)))) * scale).toFixed(2)}`).join('') + 'Z').join(''));
  }
  paths.set(data, result); return result;
}
export const AtlasMap = memo(function AtlasMap({ area, colorful = false, decorative = false, geography, expanded = true }: { area: Area; colorful?: boolean; decorative?: boolean; geography?: Geography | null; expanded?: boolean }) {
  const clipId = useId().replaceAll(':','');
  const art = useMemo(() => {
    if (!geography || !colorful) return null;
    const colors = scopeColors(geography, area, expanded), shapePaths = geographyPaths(geography);
    const ids = new Set(colors.keys()), bounds = framing(geography, area, ids);
    return { bounds, faces: geography.features.map(f => <path key={f.properties.id} d={shapePaths.get(f.properties.id)} fill={colors.get(f.properties.id) ?? '#c6d0c2'} fillRule="evenodd" stroke={ids.has(f.properties.id) ? '#3a2c1d' : '#a3b9b3'} strokeWidth={ids.has(f.properties.id) ? .8 : .45} vectorEffect="non-scaling-stroke"/>), aids: geography.features.filter(f => ids.has(f.properties.id) && shapeMetrics(f).size < 2).map(f => {
      const anchor = shapeMetrics(f).anchor;
      return <circle key={f.properties.id} cx={left + (anchor[0] + 180) * Math.PI / 180 * scale} cy={inset + (top - mercator(anchor[1])) * scale} r={Math.max(.5, (bounds[2] - bounds[0]) * Math.PI / 180 * scale * (area.level === 'world' ? 1.8 : 3.5) / (area.level === 'region' ? 220 : 440))} fill={colors.get(f.properties.id)} stroke="#3a2c1d" strokeWidth=".7" vectorEffect="non-scaling-stroke"/>;
    }) };
  }, [geography, area, colorful, expanded]);
  const box = viewBox(area,art?.bounds), [x,y,width,height] = box.split(' ').map(Number);
  return <svg className="atlas-map" viewBox={box} preserveAspectRatio={area.level === 'world' && art ? 'xMidYMid slice' : 'xMidYMid meet'} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `${area.name} atlas overview`} aria-hidden={decorative || undefined}>
    <defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height}/></clipPath></defs><g clipPath={`url(#${clipId})`}>
    {art ? [-1,0,1].map(copy => <g key={copy} transform={`translate(${copy * 2 * Math.PI * scale} 0)`}>{art.faces}{art.aids}</g>) : <><image href={colorful ? colorMap : paperMap} width="1200" height="800"/><image href={colorful ? colorMap : paperMap} x={2 * Math.PI * scale} width="1200" height="800"/></>}
    </g>
  </svg>;
});
