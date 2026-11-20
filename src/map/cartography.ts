import type { Map as LibreMap } from 'maplibre-gl';
import type { Geography } from './geography';

const mercatorY = (lat: number) => (1 - Math.log(Math.tan(Math.PI / 4 + Math.max(-85, Math.min(85, lat)) * Math.PI / 360)) / Math.PI) / 2;
const pathCache = new WeakMap<Geography, Path2D>();
function landPath(data: Geography) {
  let path = pathCache.get(data);
  if (path) return path;
  path = new Path2D();
  for (const f of data.features) {
    const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) {
      ring.forEach(([x, y], i) => { const px = (x + 180) / 360, py = mercatorY(y); if (i) path!.lineTo(px, py); else path!.moveTo(px, py); });
      path.closePath();
    }
  }
  pathCache.set(data, path); return path;
}
function hash(x: number, y: number, salt: number) {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ salt;
  n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function paintWaves(canvas: HTMLCanvasElement, map: LibreMap, data: Geography) {
  const width = map.getContainer().clientWidth, height = map.getContainer().clientHeight, ratio = Math.min(devicePixelRatio || 1, 2);
  const rw = Math.round(width * ratio), rh = Math.round(height * ratio);
  if (canvas.width !== rw || canvas.height !== rh) { canvas.width = rw; canvas.height = rh; }
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height);
  const zoom = map.getZoom(), fade = Math.max(0, Math.min(1, (7.75 - zoom) / .75));
  if (!fade) return;
  const scale = 512 * 2 ** zoom, center = map.getCenter(), cx = (center.lng + 180) / 360, cy = mercatorY(center.lat);
  const left = cx - width / scale / 2, top = cy - height / scale / 2;
  const level = Math.floor(zoom + 4.5), fraction = zoom + 4.5 - level;
  ctx.fillStyle = '#486874';
  for (const [lod, alpha] of [[level, .42 * (1 - fraction) * fade], [level + 1, .42 * fraction * fade]]) {
    const cells = 2 ** lod, size = 1 / cells;
    ctx.globalAlpha = alpha;
    for (let y = Math.floor(top * cells); y <= Math.ceil((top + height / scale) * cells); y++) {
      if (y < 0 || y >= cells) continue;
      for (let x = Math.floor(left * cells); x <= Math.ceil((left + width / scale) * cells); x++) {
        const wx = ((x % cells) + cells) % cells;
        if (hash(wx, y, lod * 89) < .27) continue;
        const px = Math.round(((x + .15 + hash(wx, y, 17) * .7) * size - left) * scale);
        const py = Math.round(((y + .15 + hash(wx, y, 53) * .7) * size - top) * scale);
        ctx.fillRect(px, py, 3, 1); ctx.fillRect(px + 3, py - 1, 2, 1); ctx.fillRect(px + 5, py, 3, 1);
      }
    }
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'destination-out';
  const path = landPath(data);
  for (let copy = Math.floor(left) - 1; copy <= Math.ceil(left + width / scale) + 1; copy++) {
    ctx.save(); ctx.translate((copy - left) * scale, -top * scale); ctx.scale(scale, scale);
    ctx.fill(path, 'evenodd'); ctx.lineWidth = 26 / scale; ctx.lineJoin = 'round'; ctx.stroke(path); ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
}
