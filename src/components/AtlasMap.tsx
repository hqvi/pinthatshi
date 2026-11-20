import { memo, useMemo } from 'react';
import type { Area } from '../data/areas';
import type { Geography } from '../map/geography';
import { scopeColors } from '../map/palette';
import paperMap from '../assets/world-paper.svg';
import colorMap from '../assets/world-color.svg';

const mercator = (latitude: number) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));
const top = mercator(85), bottom = mercator(-60);
const scale = Math.min(1200 / (2 * Math.PI), 800 / (top - bottom));
const left = (1200 - 2 * Math.PI * scale) / 2;
const inset = (800 - (top - bottom) * scale) / 2;

function viewBox(area: Area): string {
  const [west, south, east, north] = area.bounds;
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
  const coloredPaths = useMemo(() => {
    if (!geography || !colorful) return null;
    const colors = scopeColors(geography, area, expanded), shapePaths = geographyPaths(geography);
    return [...colors].map(([id, color]) => <path key={id} d={shapePaths.get(id)} fill={color} fillRule="evenodd" stroke="#3a2c1d" strokeWidth=".65" vectorEffect="non-scaling-stroke"/>);
  }, [geography, area, colorful, expanded]);
  return <svg className="atlas-map" viewBox={viewBox(area)} preserveAspectRatio="xMidYMid meet" role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `${area.name} atlas overview`} aria-hidden={decorative || undefined}>
    <image href={colorful && !geography ? colorMap : paperMap} width="1200" height="800" />
    <image href={colorful && !geography ? colorMap : paperMap} x={2 * Math.PI * scale} width="1200" height="800" />
    {coloredPaths}<g transform={`translate(${2 * Math.PI * scale} 0)`}>{coloredPaths}</g>
  </svg>;
});
