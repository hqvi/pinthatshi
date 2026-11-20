// Illustration only: no gameplay membership or final place counts are inferred here.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { projectScene, silhouette } from './map-art.mjs';
import { colorFor } from './place-colors.mjs';

const source = process.argv[2] || new URL('../src/assets/places.geojson', import.meta.url);
const data = JSON.parse(await readFile(source, 'utf8'));
const bounds = { west: -180, south: -60, east: 180, north: 85 };
const normalized = { ...data, features: data.features.map(f => ({ ...f, properties: { ...f.properties, ADM0_A3: f.properties.id || f.properties.ADM0_A3 } })) };
const places = projectScene(normalized, bounds, 1200, 800, 0).filter(p => p.code !== 'ATA');
await mkdir(new URL('../src/assets/', import.meta.url), { recursive: true });
for (const color of [false, true]) {
  const definitions = places.map(p => silhouette(p, `id="land-${p.code}"`)).join('');
  const outlines = places.map(p => `<use href="#land-${p.code}"/>`).join('');
  const coast = [[7, '#b7ced1'], [5, '#a9c3c9'], [2.5, '#c7dad9']].map(([w, c]) => `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round">${outlines}</g>`).join('');
  const faces = places.map(p => `<use href="#land-${p.code}" fill="${color ? colorFor(p.code) : '#ecdfb9'}"/>`).join('');
  const artwork = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><title>World atlas illustration</title><desc>Natural Earth v5.1.2 1:50m. Decorative overview, not the gameplay dataset.</desc><defs>${definitions}</defs>${coast}<g stroke="#3a2c1d" stroke-width=".3" stroke-linejoin="round">${faces}</g></svg>\n`;
  await writeFile(new URL(`../src/assets/world-${color ? 'color' : 'paper'}.svg`, import.meta.url), artwork);
}
console.log('Generated two independently sourced atlas illustrations.');
