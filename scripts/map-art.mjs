// Static-preview geometry helpers. The playable map will use its own renderer.
export const chart = { sea: '#a9c3c9', land: '#ecdfb9', coast: '#3a2c1d', shallow: '#b7ced1', shoal: '#c7dad9', depth: '#c0362d' };
const mercator = (latitude) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));

export function projectScene(data, bounds, width, height, padding = 12) {
  const { west, south, east, north } = bounds;
  const top = mercator(north), bottom = mercator(south);
  const horizontal = (east - west) * Math.PI / 180, vertical = top - bottom;
  const scale = Math.min((width - padding * 2) / horizontal, (height - padding * 2) / vertical);
  const leftInset = (width - horizontal * scale) / 2, topInset = (height - vertical * scale) / 2;
  const point = ([longitude, latitude]) => [leftInset + (longitude - west) * Math.PI / 180 * scale, topInset + (top - mercator(Math.max(-85, Math.min(85, latitude)))) * scale];
  const projected = [];
  for (const feature of data.features) {
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.type === 'MultiPolygon' ? feature.geometry.coordinates : [];
    const visible = polygons.filter(([outer]) => {
      const xs = outer.map((p) => p[0]), ys = outer.map((p) => p[1]);
      return Math.max(...xs) >= west && Math.min(...xs) <= east && Math.max(...ys) >= south && Math.min(...ys) <= north;
    });
    if (!visible.length) continue;
    const vertices = [];
    const path = visible.map((polygon) => polygon.map((ring) => ring.map((coordinate, index) => {
      const xy = point(coordinate);
      vertices.push(xy);
      return `${index ? 'L' : 'M'}${xy.map((value) => value.toFixed(2)).join(' ')}`;
    }).join('') + 'Z').join('')).join('');
    projected.push({ code: feature.properties.ADM0_A3, path, vertices });
  }
  return projected;
}

export function silhouette(place, attributes = '') {
  return `<path d="${place.path}" fill-rule="evenodd" ${attributes}/>`;
}

export function coastalBands(places) {
  return [[20, chart.shallow], [13, chart.sea], [7, chart.shoal]].map(([width, color]) => `<g fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round">${places.map((place) => silhouette(place)).join('')}</g>`).join('');
}

export function depthLayers(places, width, height, offset = 7, id = 'completion-cutout') {
  // Cut out the original union. Only the shifted exterior forms the side face.
  const original = places.map((place) => silhouette(place)).join('');
  return {
    definition: `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><path d="M0 0h${width}v${height}H0z" fill="white"/><g fill="black" stroke="black" stroke-width="1.4" stroke-linejoin="round">${original}</g></mask>`,
    layer: `<g data-layer="completion-depth" mask="url(#${id})" opacity=".82"><g fill="${chart.depth}" transform="translate(${offset} ${offset})">${original}</g></g>`,
  };
}

export function gridLines(width, height) {
  return `<g fill="none" stroke="${chart.coast}" stroke-opacity=".15" stroke-width=".5" stroke-dasharray="1 3">${Array.from({ length: 10 }, (_, index) => `<path d="M${index * width / 10} 0v${height}M0 ${index * height / 10}h${width}"/>`).join('')}</g>`;
}
