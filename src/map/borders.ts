import type { FeatureCollection, LineString } from 'geojson';
import type { Geography } from './geography';
const cached = new WeakMap<object, FeatureCollection<LineString>>();
/** Draw a shared edge only once, otherwise dash phases overlap into solid lines. */
export function borderLines(data: Geography): FeatureCollection<LineString> {
  const saved = cached.get(data.features[0].geometry); if (saved) return saved;
  const seen = new Set<string>(), lines: number[][][] = [];
  const pointKey = (p: number[]) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`;
  for (const feature of data.features) {
    const rings = feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates.flat();
    for (const ring of rings) {
      let run: number[][] = [];
      const flush = () => { if (run.length > 1) lines.push(run); run = []; };
      for (let i=1;i<ring.length;i++) {
        const p=ring[i-1],q=ring[i],a=pointKey(p),b=pointKey(q),key=a<b?`${a}/${b}`:`${b}/${a}`;
        if (seen.has(key)) { flush(); continue; }
        seen.add(key); if (!run.length) run.push(p); run.push(q);
        if (run.length >= 2049) { flush(); run.push(q); }
      }
      flush();
    }
  }
  const result: FeatureCollection<LineString> = { type:'FeatureCollection', features:lines.map(coordinates=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates}})) };
  cached.set(data.features[0].geometry,result); return result;
}
