import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chart, projectScene, silhouette, coastalBands, depthLayers, gridLines } from './map-art.mjs';

// Static illustrations, not the game's coverage list or final map renderer.
const input = process.argv[2] || fileURLToPath(new URL('../.preview/ne_50m_admin_0_countries.geojson', import.meta.url));
const data = JSON.parse(await readFile(input, 'utf8'));
const colors = {
  ARG: '#ff8a2c', BOL: '#ff788c', BRA: '#597af4', CHL: '#a76bf1',
  COL: '#ff9cd5', ECU: '#9daef1', GUY: '#c4cf61', PRY: '#35b8aa',
  PER: '#a2c332', SUR: '#ffa547', URY: '#f68fbf', VEN: '#f7ce4b', FRA: '#dc665b',
};
const width = 380, height = 540;
const places = projectScene(data, { west: -86, south: -58, east: -30, north: 15 }, width, height);
const depth = depthLayers(places.filter((place) => colors[place.code]), width, height);
const faces = places.map((place) => silhouette(place, `fill="${colors[place.code] || chart.land}" stroke="${chart.coast}" stroke-width=".75" stroke-linejoin="round"`)).join('');
const output = new URL('../docs/interaction-lab/assets/', import.meta.url);
await mkdir(output, { recursive: true });
for (const raised of [false, true]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><title>Illustrative completed South America map${raised ? ' with a hard offset depth layer' : ''}</title><desc>Natural Earth v5.1.2 1:50m, independently rendered for the design lab.</desc><defs><clipPath id="crop"><path d="M0 0h${width}v${height}H0z"/></clipPath>${raised ? depth.definition : ''}</defs><g clip-path="url(#crop)">${coastalBands(places)}${faces}${raised ? depth.layer : ''}${gridLines(width, height)}</g></svg>\n`;
  await writeFile(new URL(raised ? 'south-america.svg' : 'south-america-flat.svg', output), svg);
}
console.log(`Created flat and raised South America previews (${places.length} contextual features).`);
