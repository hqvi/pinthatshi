import type { Map as LibreMap } from 'maplibre-gl';
import type { Geography } from './geography';
import { coordinateLabel, gridStep, gridValues } from './grid.ts';

type Rect = { x: number; y: number; width: number; height: number };
export function findLabelRect(x: number, y: number, width: number, height: number, viewportWidth: number, viewportHeight: number, occupied: Rect[]): Rect | null {
  for (const [dx, dy] of [[0, 0], [0, -23], [0, 23], [25, -13], [-25, 13], [0, -43]]) {
    const candidate = { x: x + dx - width / 2, y: y + dy - height / 2, width, height };
    if (candidate.x < 32 || candidate.y < 20 || candidate.x + width > viewportWidth - 15 || candidate.y + height > viewportHeight - 28) continue;
    if (!occupied.some(r => candidate.x < r.x + r.width + 3 && candidate.x + width + 3 > r.x && candidate.y < r.y + r.height + 3 && candidate.y + height + 3 > r.y)) return candidate;
  }
  return null;
}

function polygonPaths(data: Geography, ids: Set<string>, map: LibreMap): Path2D[] {
  const paths: Path2D[] = [];
  const center = map.getCenter().lng;
  for (const feature of data.features) {
    if (!ids.has(feature.properties.id)) continue;
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) {
      // Natural Earth's rings are split at the date line; shift each polygon to the visible world copy.
      const middle = polygon[0].reduce((sum, p) => sum + p[0], 0) / polygon[0].length;
      const shift = Math.round((center - middle) / 360) * 360;
      for (const copy of [-360, 0, 360]) {
        const path = new Path2D();
        for (const ring of polygon) {
          ring.forEach(([longitude, latitude], i) => {
            const point = map.project([longitude + shift + copy, latitude]);
            if (i) path.lineTo(point.x, point.y); else path.moveTo(point.x, point.y);
          });
          path.closePath();
        }
        paths.push(path);
      }
    }
  }
  return paths;
}

export function paintResolved(canvas: HTMLCanvasElement, map: LibreMap, data: Geography, ids: readonly string[], complete: boolean) {
  const width = map.getContainer().clientWidth, height = map.getContainer().clientHeight;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx || !width || !height) return;
  ctx.scale(ratio, ratio);
  if (complete) {
    const paths = polygonPaths(data, new Set(ids), map);
    ctx.save(); ctx.translate(width < 700 ? 5 : 7, width < 700 ? 5 : 7);
    ctx.fillStyle = '#c0362d'; ctx.globalAlpha = .82;
    paths.forEach(path => ctx.fill(path, 'evenodd'));
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = 1.4; ctx.lineJoin = 'round';
    paths.forEach(path => { ctx.fill(path, 'evenodd'); ctx.stroke(path); }); ctx.restore();
  }
  const occupied: Rect[] = [{ x: 0, y: 0, width: 210, height: 95 }, { x: 0, y: height - 175, width: 100, height: 175 }, { x: width - 80, y: height - 90, width: 80, height: 90 }];
  ctx.font = '16px VT323, monospace'; ctx.textBaseline = 'middle';
  for (const id of [...ids].reverse()) {
    const place = data.features.find(f => f.properties.id === id)?.properties;
    if (!place) continue;
    const longitude = place.longitude + Math.round((map.getCenter().lng - place.longitude) / 360) * 360;
    const point = map.project([longitude, place.latitude]);
    const rect = findLabelRect(point.x, point.y, ctx.measureText(place.name).width + 22, 22, width, height, occupied);
    if (!rect) continue;
    occupied.push(rect);
    ctx.strokeStyle = '#6a583f'; ctx.lineWidth = .5; ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(rect.x + rect.width / 2, rect.y + rect.height / 2); ctx.stroke();
    ctx.fillStyle = '#f4e9cd'; ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 1; ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = place.color; ctx.beginPath(); ctx.arc(rect.x + 8, rect.y + 11, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2b2118'; ctx.fillText(place.name, rect.x + 16, rect.y + 11);
  }
}

export function captureMap(map: LibreMap, overlay: HTMLCanvasElement): string {
  const width = map.getContainer().clientWidth, height = map.getContainer().clientHeight;
  const output = document.createElement('canvas');
  const ratio = Math.min(devicePixelRatio || 1, 2);
  output.width = Math.round(width * ratio); output.height = Math.round(height * ratio);
  const ctx = output.getContext('2d');
  if (!ctx) throw new Error('Map capture unavailable');
  ctx.scale(ratio, ratio); ctx.drawImage(map.getCanvas(), 0, 0, width, height);
  const nw = map.unproject([0, 0]), se = map.unproject([width, height]);
  const longitude = gridValues(nw.lng, se.lng, gridStep(se.lng - nw.lng, width));
  const latitude = gridValues(Math.max(-80, se.lat), Math.min(80, nw.lat), gridStep(nw.lat - se.lat, height));
  ctx.strokeStyle = '#2b21182e'; ctx.lineWidth = .6; ctx.setLineDash([1, 4]);
  ctx.font = '13px VT323, monospace'; ctx.fillStyle = '#2b2118';
  for (const value of longitude) { const x = map.project([value, 0]).x; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); ctx.textAlign = 'center'; if (x > 35 && x < width - 20) ctx.fillText(coordinateLabel(value, false), x, height - 7); }
  for (const value of latitude) { const y = map.project([map.getCenter().lng, value]).y; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); ctx.textAlign = 'left'; if (y > 20 && y < height - 30) ctx.fillText(coordinateLabel(value, true), 5, y + 4); }
  ctx.setLineDash([]); ctx.drawImage(overlay, 0, 0, width, height);
  ctx.font = '12px VT323, monospace'; ctx.textAlign = 'right'; ctx.fillText('Natural Earth · pinthatshi', width - 8, height - 25);
  return output.toDataURL('image/png');
}

