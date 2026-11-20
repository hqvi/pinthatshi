// Illustration only: no gameplay membership or final place counts are inferred here.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { projectScene, silhouette } from './map-art.mjs';

const source = process.argv[2] || new URL('../.preview/ne_50m_admin_0_countries.geojson', import.meta.url);
const data = JSON.parse(await readFile(source, 'utf8'));
const bounds = { west: -180, south: -60, east: 180, north: 85 };
const places = projectScene(data, bounds, 1200, 800, 0).filter(p => p.code !== 'ATA');
const palette = ['#f6b91e', '#687ce3', '#85bd35', '#20afa4', '#ef91c6', '#ff7c32', '#a461dd', '#fa5c7b'];
await mkdir(new URL('../src/assets/', import.meta.url), { recursive: true });
for (const color of [false, true]) {
  const definitions = places.map(p => silhouette(p, `id="land-${p.code}"`)).join('');
  const outlines = places.map(p => `<use href="#land-${p.code}"/>`).join('');
  const coast = [[7, '#b7ced1'], [5, '#a9c3c9'], [2.5, '#c7dad9']].map(([w, c]) => `<g fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="round">${outlines}</g>`).join('');
  const faces = places.map((p, i) => `<use href="#land-${p.code}" fill="${color ? palette[i % palette.length] : '#ecdfb9'}"/>`).join('');
  const artwork = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><title>World atlas illustration</title><desc>Natural Earth v5.1.2 1:50m. Decorative overview, not the gameplay dataset.</desc><defs>${definitions}</defs>${coast}<g stroke="#3a2c1d" stroke-width=".3" stroke-linejoin="round">${faces}</g></svg>\n`;
  await writeFile(new URL(`../src/assets/world-${color ? 'color' : 'paper'}.svg`, import.meta.url), artwork);
}
console.log('Generated two independently sourced atlas illustrations.');
