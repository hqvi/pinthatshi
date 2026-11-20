import { readFile, writeFile } from 'node:fs/promises';
const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/create-coastlines.mjs <Natural Earth v5.1.2 50m coastline GeoJSON>');
const source = JSON.parse(await readFile(input, 'utf8'));
const paths = source.features.flatMap(f => (f.geometry.type === 'MultiLineString' ? f.geometry.coordinates : [f.geometry.coordinates]).filter(line => Math.max(...line.map(p => p[1])) >= -60).map(line => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: line.map(p => p.map(n => Math.round(n * 100000) / 100000)) } })));
// Split long paths at shared endpoints: preserve every geographic vertex while
// staying below MapLibre's 16-bit line-mesh segment limit (up to 10 vertices per point).
const features = paths.flatMap(feature => {
  const chunks = [], coordinates = feature.geometry.coordinates;
  for (let start = 0; start < coordinates.length - 1; start += 2048) chunks.push({ ...feature, geometry: { ...feature.geometry, coordinates: coordinates.slice(start, start + 2049) } });
  return chunks;
});
await writeFile(new URL('../src/assets/coastlines.geojson', import.meta.url), JSON.stringify({ type: 'FeatureCollection', features }) + '\n');
console.log(`Generated ${features.length} physical coastline paths.`);
