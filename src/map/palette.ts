import type { Area } from '../data/areas';
import type { Geography } from './geography';
import { inScope } from './scope.ts';

export const palette = ['#ff5e7e', '#ffb81c', '#00a99d', '#4f7cff', '#a35cff', '#ff7a2f', '#7dcc3a', '#ff8fd0'];
const cache = new WeakMap<object, Map<string, Map<string, string>>>();
export function scopeColors(data: Geography, area: Area, expanded: boolean): Map<string, string> {
  const geometryKey = data.features[0]?.geometry;
  const cacheKey = `${area.id}:${expanded}`;
  const cached = geometryKey && cache.get(geometryKey)?.get(cacheKey);
  if (cached) return cached;
  const hash = [...area.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 0);
  const colors = new Map<string, string>(), usage = palette.map(() => 0);
  const features = data.features.filter(f => inScope(f.properties, area, expanded));
  // Shared boundary vertices identify neighbours without a separate topology dependency.
  const owners = new Map<string, string[]>(), neighbours = new Map<string, Set<string>>();
  for (const f of features) {
    neighbours.set(f.properties.id, new Set());
    const rings = f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat();
    for (const [x, y] of rings.flat()) {
      const key = `${x.toFixed(3)},${y.toFixed(3)}`;
      const ids = owners.get(key) ?? [];
      for (const id of ids) { neighbours.get(id)?.add(f.properties.id); neighbours.get(f.properties.id)!.add(id); }
      if (!ids.includes(f.properties.id)) ids.push(f.properties.id);
      owners.set(key, ids);
    }
  }
  const areaOf = (f: Geography['features'][number]) => {
    const rings = f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat();
    return rings.reduce((total, ring) => total + Math.abs(ring.reduce((n, p, i) => { const q = ring[(i + 1) % ring.length]; return n + p[0] * q[1] - q[0] * p[1]; }, 0)), 0);
  };
  for (const f of features.sort((a, b) => areaOf(b) - areaOf(a) || a.properties.id.localeCompare(b.properties.id))) {
    const used = [...neighbours.get(f.properties.id)!].map(id => colors.get(id));
    const ranked = palette.map((_, j) => (j + hash) % palette.length).sort((a, b) => {
      const score = (i: number) => usage[i] + used.reduce((n, color) => n + (color === palette[i] ? 100 : [[0, 7], [1, 5], [3, 4]].some(pair => pair.includes(i) && pair.some(k => palette[k] === color)) ? 8 : 0), 0);
      return score(a) - score(b);
    });
    colors.set(f.properties.id, palette[ranked[0]]); usage[ranked[0]]++;
  }
  if (geometryKey) { const entries = cache.get(geometryKey) ?? new Map(); entries.set(cacheKey, colors); cache.set(geometryKey, entries); }
  return colors;
}
