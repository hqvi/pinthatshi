import type { Map as LibreMap } from 'maplibre-gl';
import type { Geography } from './geography';
import { prepareCanvas, drawGrid } from './grid-renderer.ts';
import { shapeMetrics } from './geometry.ts';
import { mercatorY } from './cartography.ts';

type Rect = { x: number; y: number; width: number; height: number };
export function findLabelRect(x: number, y: number, width: number, height: number, viewportWidth: number, viewportHeight: number, occupied: Rect[], preferOffset = false): Rect | null {
  if (x < 0 || y < 0 || x > viewportWidth || y > viewportHeight) return null;
  const near = preferOffset ? [[-width/2-20,0],[width/2+20,0],[-width/2-20,-28],[width/2+20,28],[0,-30],[0,30]] : [[0,0]];
  for (const [dx, dy] of [...near, ...[28,52,80,112,150].flatMap(d => [[0,-d],[0,d],[d,0],[-d,0],[d,-d],[-d,d],[d,d],[-d,-d]])]) {
    const candidate = { x: x + dx - width / 2, y: y + dy - height / 2, width, height };
    if (candidate.x < 32 || candidate.y < 20 || candidate.x + width > viewportWidth - 15 || candidate.y + height > viewportHeight - 28) continue;
    if (!occupied.some(r => candidate.x < r.x + r.width + 3 && candidate.x + width + 3 > r.x && candidate.y < r.y + r.height + 3 && candidate.y + height + 3 > r.y)) return candidate;
  }
  return null;
}

const paths = new WeakMap<object, { ids: string; path: Path2D }>();
const widths = new Map<string, number>();
if (typeof document !== 'undefined') void document.fonts.ready.then(() => widths.clear());
function resolvedPath(data: Geography, ids: readonly string[]) {
  const key = data.features[0].geometry, joined = ids.join(',');
  const cached = paths.get(key); if (cached?.ids === joined) return cached.path;
  const path = new Path2D(), wanted = new Set(ids);
  for (const f of data.features) if (wanted.has(f.properties.id)) {
    const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const polygon of polygons) for (const ring of polygon) {
      ring.forEach(([x,y], i) => { const px = (x + 180) / 360, py = mercatorY(y); if (i) path.lineTo(px,py); else path.moveTo(px,py); }); path.closePath();
    }
  }
  paths.set(key, { ids: joined, path }); return path;
}

export function paintResolved(canvas: HTMLCanvasElement, map: LibreMap, data: Geography, ids: readonly string[], complete: boolean) {
  const width = map.getContainer().clientWidth, height = map.getContainer().clientHeight;
  const ctx = prepareCanvas(canvas, width, height);
  if (!ctx || !width || !height) return;
  if (complete) {
    const path = resolvedPath(data, ids), scale = 512 * 2 ** map.getZoom(), center = map.getCenter();
    const left = (center.lng + 180) / 360 - width / scale / 2, top = mercatorY(center.lat) - height / scale / 2;
    for (const erase of [false, true]) {
      ctx.save(); if (erase) ctx.globalCompositeOperation = 'destination-out'; else { ctx.translate(width < 700 ? 5 : 7, width < 700 ? 5 : 7); ctx.fillStyle = '#c0362d'; ctx.globalAlpha = .82; }
      for (let copy = Math.floor(left) - 1; copy <= Math.ceil(left + width / scale) + 1; copy++) {
        ctx.save(); ctx.translate((copy - left) * scale, -top * scale); ctx.scale(scale,scale); ctx.fill(path,'evenodd');
        if (erase) { ctx.lineWidth = 1.4 / scale; ctx.stroke(path); } ctx.restore();
      }
      ctx.restore();
    }
  }
  const occupied: Rect[] = [ { x: 0, y: height - 175, width: 100, height: 175 }, { x: width - 80, y: height - 90, width: 80, height: 90 }];
  ctx.font = '16px VT323, monospace'; ctx.textBaseline = 'middle';
  for (const id of [...ids].reverse()) {
    const feature = data.features.find(f => f.properties.id === id);
    if (!feature) continue;
    const place = feature.properties, anchor = shapeMetrics(feature).anchor;
    const longitude = anchor[0] + Math.round((map.getCenter().lng - anchor[0]) / 360) * 360;
    const point = map.project([longitude, anchor[1]]);
    const measured = widths.get(place.name) ?? ctx.measureText(place.name).width; widths.set(place.name, measured);
    const rect = findLabelRect(point.x, point.y, measured + 22, 22, width, height, occupied, shapeMetrics(feature).size * 2 ** map.getZoom() < 24);
    if (!rect) continue;
    occupied.push(rect);
    const endX = Math.max(rect.x, Math.min(rect.x + rect.width, point.x)), endY = Math.max(rect.y, Math.min(rect.y + rect.height, point.y));
    if (Math.hypot(endX - point.x, endY - point.y) > 5) {
      ctx.beginPath(); ctx.moveTo(point.x,point.y); ctx.lineTo(endX,endY);
      ctx.strokeStyle = '#f4e9cd'; ctx.lineWidth = 3.5; ctx.stroke(); ctx.strokeStyle = place.color; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(point.x,point.y,3.5,0,Math.PI*2); ctx.fillStyle = place.color; ctx.fill(); ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.fillStyle = '#f4e9cd'; ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 1; ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = place.color; ctx.beginPath(); ctx.arc(rect.x + 8, rect.y + 11, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b2118'; ctx.fillText(place.name, rect.x + 16, rect.y + 11);
  }
}

export function captureMap(map: LibreMap, overlay: HTMLCanvasElement, grid?: HTMLCanvasElement | null): string {
  const width = map.getContainer().clientWidth, height = map.getContainer().clientHeight;
  const output = document.createElement('canvas');
  const ratio = Math.min(devicePixelRatio || 1, 2);
  output.width = Math.round(width * ratio); output.height = Math.round(height * ratio);
  const ctx = output.getContext('2d');
  if (!ctx) throw new Error('Map capture unavailable');
  ctx.scale(ratio, ratio); ctx.drawImage(map.getCanvas(), 0, 0, width, height);
  if (grid) ctx.drawImage(grid, 0, 0, width, height); else drawGrid(ctx, map);
  ctx.drawImage(overlay, 0, 0, width, height);
  ctx.font = '12px VT323, monospace'; ctx.textAlign = 'right'; ctx.fillText('Natural Earth · pinthatshi', width - 8, height - 25);
  return output.toDataURL('image/png');
}
