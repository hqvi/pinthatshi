import type { Map as LibreMap } from 'maplibre-gl';
import { coordinateLabel, gridStep, gridValues } from './grid.ts';

type GridLayer = { x: number; y: number; opacity: number };
export function prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const ratio = Math.min(devicePixelRatio || 1, 2), w = Math.round(width * ratio), h = Math.round(height * ratio);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  if (ctx) { ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, width, height); }
  return ctx;
}
export function drawGrid(ctx: CanvasRenderingContext2D, map: LibreMap, layer?: GridLayer) {
  const width = map.getContainer().clientWidth, height = map.getContainer().clientHeight;
  const nw = map.unproject([0, 0]), se = map.unproject([width, height]);
  const xs = gridValues(nw.lng, se.lng, layer?.x ?? gridStep(se.lng - nw.lng, width));
  const ys = gridValues(Math.max(-85, se.lat), Math.min(85, nw.lat), layer?.y ?? gridStep(nw.lat - se.lat, height));
  ctx.save(); ctx.globalAlpha = layer?.opacity ?? 1;
  ctx.strokeStyle = '#3a2c1d4d'; ctx.lineWidth = .75; ctx.setLineDash([1, 3]);
  for (const x of xs) { const px = map.project([x, 0]).x; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, height); ctx.stroke(); }
  for (const y of ys) { const py = map.project([map.getCenter().lng, y]).y; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(width, py); ctx.stroke(); }
  ctx.setLineDash([]); ctx.font = '14px VT323, monospace'; ctx.lineWidth = 3; ctx.strokeStyle = '#f4e9cd'; ctx.fillStyle = '#2b2118'; ctx.lineJoin = 'round';
  let last = -Infinity;
  ctx.textAlign = 'center';
  for (const x of xs) {
    const px = map.project([x, 0]).x, text = coordinateLabel(x, false), space = ctx.measureText(text).width / 2;
    if (px < 42 + space || px > width - 8 - space || px - space < last + 10) continue;
    ctx.strokeText(text, px, height - 6); ctx.fillText(text, px, height - 6); last = px + space;
  }
  last = -Infinity; ctx.textAlign = 'left';
  for (const y of [...ys].reverse()) {
    const py = map.project([map.getCenter().lng, y]).y;
    if (py < 15 || py > height - 28 || py - last < 26) continue;
    const text = coordinateLabel(y, true); ctx.strokeText(text, 6, py + 4); ctx.fillText(text, 6, py + 4); last = py;
  }
  ctx.restore();
}
/** Camera-frame state stays outside React, including spacing hysteresis/crossfade. */
export function gridPainter() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current: GridLayer | undefined, previous: GridLayer | undefined, start = 0;
  return (canvas: HTMLCanvasElement, map: LibreMap) => {
    const width = map.getContainer().clientWidth, height = map.getContainer().clientHeight;
    const nw = map.unproject([0, 0]), se = map.unproject([width, height]);
    const desired = { x: gridStep(se.lng - nw.lng, width), y: gridStep(nw.lat - se.lat, height), opacity: 1 };
    if (!current) current = desired;
    const xPixels = current.x * width / (se.lng - nw.lng), yPixels = current.y * height / (nw.lat - se.lat);
    if ((desired.x !== current.x && (xPixels < 40 || xPixels > 140)) || (desired.y !== current.y && (yPixels < 40 || yPixels > 140))) { previous = current; current = desired; start = performance.now(); }
    const ctx = prepareCanvas(canvas, width, height); if (!ctx) return;
    const blend = reduced.matches ? 1 : Math.min(1, (performance.now() - start) / 180);
    if (previous && blend < 1) drawGrid(ctx, map, { ...previous, opacity: 1 - blend });
    drawGrid(ctx, map, { ...current, opacity: previous ? blend : 1 });
    if (blend < 1) map.triggerRepaint(); else previous = undefined;
  };
}
