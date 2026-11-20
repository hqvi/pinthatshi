import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chart, projectScene, silhouette, coastalBands, gridLines } from './map-art.mjs';

const input = process.argv[2] || fileURLToPath(new URL('../.preview/ne_50m_admin_0_countries.geojson', import.meta.url));
const data = JSON.parse(await readFile(input, 'utf8'));
const configurations = [
  { code: 'br', id: 'BRA', name: 'Brazil', bounds: { west: -83, south: -35, east: -31, north: 7 } },
  { code: 'mx', id: 'MEX', name: 'Mexico', bounds: { west: -119, south: 14, east: -85, north: 34 } },
  { code: 'es', id: 'ESP', name: 'Spain', bounds: { west: -12, south: 34, east: 7, north: 47 } },
  { code: 'ph', id: 'PHL', name: 'Philippines', bounds: { west: 113, south: 3, east: 129, north: 23 } },
];
const width = 700, height = 480;
const output = new URL('../docs/interaction-lab/assets/flag-maps/', import.meta.url);
await mkdir(output, { recursive: true });
for (const config of configurations) {
  const places = projectScene(data, config.bounds, width, height);
  const target = places.find((place) => place.code === config.id);
  if (!target) throw new Error(`Missing geometry for ${config.name}`);
  const xs = target.vertices.map((point) => point[0]), ys = target.vertices.map((point) => point[1]);
  const box = { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  const source = await readFile(new URL(`../docs/interaction-lab/assets/flags/${config.code}.svg`, import.meta.url));
  const viewBox = source.toString('utf8').match(/viewBox="([^"]+)"/);
  if (!viewBox) throw new Error(`Missing flag aspect ratio for ${config.name}`);
  const [, , flagWidth, flagHeight] = viewBox[1].split(/\s+/).map(Number);
  const ratio = flagWidth / flagHeight;
  // Explicit cover dimensions avoid nested SVG viewport letterboxing.
  const coverWidth = Math.max(box.width, box.height * ratio);
  const coverHeight = coverWidth / ratio;
  const coverX = box.x + (box.width - coverWidth) / 2;
  const coverY = box.y + (box.height - coverHeight) / 2;
  const embedded = `data:image/svg+xml;base64,${source.toString('base64')}`;
  const background = places.map((place) => silhouette(place, `fill="${chart.land}" stroke="${chart.coast}" stroke-width=".7" stroke-linejoin="round"`)).join('');
  for (const withFlag of [false, true]) {
    const image = `<image data-flag-image="${config.code}" data-target-bounds="${[box.x, box.y, box.width, box.height].map((n) => n.toFixed(2)).join(',')}" href="${embedded}" x="${coverX.toFixed(2)}" y="${coverY.toFixed(2)}" width="${coverWidth.toFixed(2)}" height="${coverHeight.toFixed(2)}" preserveAspectRatio="xMidYMid meet" clip-path="url(#country-clip)"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" data-target="${config.id}"><title>${config.name}${withFlag ? ' flag clipped inside its country shape' : ' highlighted in its geographic context'}</title><desc>The complete rectangular flag is shown separately. This is independent 1:50m illustration geometry.</desc><defs><clipPath id="viewport"><path d="M0 0h${width}v${height}H0z"/></clipPath><clipPath id="country-clip" clipPathUnits="userSpaceOnUse">${silhouette(target, 'clip-rule="evenodd"')}</clipPath></defs><g clip-path="url(#viewport)">${coastalBands(places)}${background}${withFlag ? image : silhouette(target, 'fill="#f2c14e"')}${silhouette(target, `fill="none" stroke="${chart.coast}" stroke-width="1.8" stroke-linejoin="round"`)}${gridLines(width, height)}</g></svg>\n`;
    await writeFile(new URL(`${config.code}-${withFlag ? 'flag' : 'outline'}.svg`, output), svg);
  }
  console.log(`Created ${config.name} context and flag-fill previews.`);
}
