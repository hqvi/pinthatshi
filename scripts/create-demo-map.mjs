import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// A static illustration for the transition lab, not the game's geographic data.
// Input: Natural Earth v5.1.2, ne_110m_admin_0_countries.geojson.
const input = process.argv[2] || fileURLToPath(new URL('../.preview/ne_110m_admin_0_countries.geojson', import.meta.url));
const data = JSON.parse(await readFile(input, 'utf8'));
const colors = {
  ARG: '#ff8a2c', BOL: '#ff788c', BRA: '#597af4', CHL: '#a76bf1',
  COL: '#ff9cd5', ECU: '#9daef1', GUY: '#c4cf61', PRY: '#35b8aa',
  PER: '#a2c332', SUR: '#ffa547', URY: '#f68fbf', VEN: '#f7ce4b', FRA: '#dc665b',
};
const mercator = (latitude) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));
const north = mercator(15);
const south = mercator(-58);
const project = ([longitude, latitude]) => [
  ((longitude + 86) / 56 * 380).toFixed(2),
  ((north - mercator(Math.max(-85, Math.min(85, latitude)))) / (north - south) * 540).toFixed(2),
];
const paths = [];
for (const feature of data.features) {
  const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates]
    : feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [];
  const visible = polygons.filter((polygon) => polygon[0].some(([x, y]) => x >= -86 && x <= -30 && y >= -58 && y <= 15));
  if (!visible.length) continue;
  const code = feature.properties.ADM0_A3;
  const path = visible.map((polygon) => polygon.map((ring) => ring.map((point, index) => `${index ? 'L' : 'M'}${project(point).join(' ')}`).join('') + 'Z').join('')).join('');
  paths.push(`<path d="${path}" fill="${colors[code] || '#ecdfb9'}" stroke="#3a2c1d" stroke-width=".75" fill-rule="evenodd"/>`);
}
const grid = Array.from({ length: 10 }, (_, index) => `<path d="M${index * 38} 0v540M0 ${index * 54}h380"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 540"><title>Illustrative South America crop, made with Natural Earth</title><desc>Low-detail geometry for the completion transition preview, not final game coverage.</desc><defs><clipPath id="crop"><path d="M0 0h380v540H0z"/></clipPath></defs><g clip-path="url(#crop)">${paths.join('')}<g fill="none" stroke="#3a2c1d" stroke-opacity=".15" stroke-width=".5" stroke-dasharray="1 3">${grid}</g></g></svg>\n`;
const output = new URL('../docs/interaction-lab/assets/south-america.svg', import.meta.url);
await mkdir(new URL('.', output), { recursive: true });
await writeFile(output, svg);
console.log(`Created static South America illustration (${paths.length} geographic features).`);
