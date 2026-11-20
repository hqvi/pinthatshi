import type { Map as LibreMap } from 'maplibre-gl';
// Optional detail source. The local quiz geometry remains available if tiles fail.
export function addMapDetails(map: LibreMap) {
  map.addSource('openfreemap', { type: 'vector', url: 'https://tiles.openfreemap.org/planet' });
  map.addLayer({ id: 'detail-water', type: 'fill', source: 'openfreemap', 'source-layer': 'water', minzoom: 5, paint: { 'fill-color': '#a9c3c9' } }, 'boundaries');
  map.addLayer({ id: 'detail-rivers', type: 'line', source: 'openfreemap', 'source-layer': 'waterway', minzoom: 5, paint: { 'line-color': '#a9c3c9', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, .5, 10, 1.5] } }, 'boundaries');
  map.addLayer({ id: 'detail-roads', type: 'line', source: 'openfreemap', 'source-layer': 'transportation', minzoom: 7, paint: { 'line-color': '#b9a67e', 'line-opacity': .45, 'line-width': ['interpolate', ['linear'], ['zoom'], 7, .35, 12, 1.4] } }, 'boundaries');
}
