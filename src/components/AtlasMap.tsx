import { memo } from 'react';
import type { Area } from '../data/areas';
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

export const AtlasMap = memo(function AtlasMap({ area, colorful = false, decorative = false }: { area: Area; colorful?: boolean; decorative?: boolean }) {
  return <svg className="atlas-map" viewBox={viewBox(area)} preserveAspectRatio="xMidYMid meet" role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : `${area.name} atlas overview`} aria-hidden={decorative || undefined}>
    <image href={colorful ? colorMap : paperMap} width="1200" height="800" />
    <image href={colorful ? colorMap : paperMap} x={2 * Math.PI * scale} width="1200" height="800" />
  </svg>;
});
