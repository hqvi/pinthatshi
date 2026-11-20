import type { Geography } from './geography';
import type { Area, Bounds } from '../data/areas';
import { longitudeInterval, normalizeLongitude } from './grid.ts';

export type PlaceShape = Geography['features'][number];
const cache = new WeakMap<object, { anchor: [number, number]; bounds: Bounds; size: number }>();
const my = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, lat)) * Math.PI / 360)) / Math.PI) / 2;
export function pointInRing(point: readonly number[], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
export function containsPoint(feature: PlaceShape, point: readonly number[]): boolean {
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  return polygons.some(p => pointInRing(point, p[0]) && !p.slice(1).some(r => pointInRing(point, r)));
}
export function shapeMetrics(feature: PlaceShape) {
  const saved = cache.get(feature.geometry); if (saved) return saved;
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  const rings = polygons.map(p => p[0]);
  const area = (ring: number[][]) => Math.abs(ring.reduce((n, p, i) => { const q = ring[(i + 1) % ring.length]; return n + p[0] * q[1] - q[0] * p[1]; }, 0));
  const largest = rings.reduce((best, ring) => area(ring) > area(best) ? ring : best, rings[0]);
  const vertices = rings.flat();
  const [west, east] = longitudeInterval(vertices.map(p => p[0]));
  const south = Math.min(...vertices.map(p => p[1])), north = Math.max(...vertices.map(p => p[1]));
  const [lw, le] = longitudeInterval(largest.map(p => p[0]));
  const ls = Math.min(...largest.map(p => p[1])), ln = Math.max(...largest.map(p => p[1]));
  let anchor: [number, number] = [feature.properties.longitude, feature.properties.latitude];
  if (!containsPoint(feature, anchor)) {
    let distance = Infinity; anchor = [largest[0][0], largest[0][1]];
    for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++) {
      const point: [number, number] = [normalizeLongitude(lw + (le - lw) * i / 20), ls + (ln - ls) * j / 20];
      const d = (i - 10) ** 2 + (j - 10) ** 2;
      if (d < distance && containsPoint(feature, point)) { anchor = point; distance = d; }
    }
  }
  const result = { anchor, bounds: [west, south, east, north] as Bounds, size: 512 * Math.max((le - lw) / 360, Math.abs(my(ln) - my(ls))) };
  cache.set(feature.geometry, result); return result;
}
export function aidOpacity(sizeAtZoom0: number, zoom: number) {
  return Math.max(0, Math.min(1, (24 - sizeAtZoom0 * 2 ** zoom) / 12)) * Math.max(0, Math.min(1, (12 - zoom) / .75));
}
export function framing(data: Geography, area: Area, ids: ReadonlySet<string>): Bounds {
  // Thumbnail framing crops the polar margins like the reference; the live atlas
  // retains its full camera bounds and all source geometry.
  if (area.level === 'world') return [-180, -58, 180, 76];
  const members = data.features.filter(f => ids.has(f.properties.id));
  if (!members.length) return area.bounds;
  const [west,south,east,north] = area.bounds;
  const local = (p: readonly number[]) => {
    const lon = p[0] + Math.round(((west+east)/2-p[0])/360)*360;
    return lon >= west && lon <= east && p[1] >= south && p[1] <= north;
  };
  const points = members.flatMap(f => {
    const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    return [...polygons.flatMap(p => p[0]).filter(local), ...[shapeMetrics(f).anchor].filter(local)];
  });
  if (!points.length) return area.bounds;
  const [w,e] = longitudeInterval(points.map(p => p[0]));
  const s = Math.max(-80, Math.min(...points.map(p => p[1]))), n = Math.min(80, Math.max(...points.map(p => p[1])));
  return [w-2,s-2,e+2,n+2];
}
