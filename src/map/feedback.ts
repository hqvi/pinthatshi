import type { Map as LibreMap } from 'maplibre-gl';
import { prepareCanvas } from './grid-renderer.ts';
import { shapeMetrics } from './geometry.ts';
import type { Geography } from './geography';
import { mercatorY } from './cartography.ts';
import type { Session } from '../game/session';
export function directionAngle(from: readonly number[], to: readonly number[]) {
  const x = (((to[0] - from[0] + 180) % 360) + 360) % 360 - 180;
  const y = (mercatorY(to[1]) - mercatorY(from[1])) * 360;
  return Math.round(Math.atan2(y,x)/(Math.PI/4))*(Math.PI/4);
}
export function paintFeedback(canvas: HTMLCanvasElement, map: LibreMap, data: Geography, locationId?: string) {
  const ctx = prepareCanvas(canvas, map.getContainer().clientWidth, map.getContainer().clientHeight); if (!ctx) return;
  const project = (point: readonly number[]) => map.project([point[0]+Math.round((map.getCenter().lng-point[0])/360)*360,point[1]]);
  const target = data.features.find(f => f.properties.id === locationId);
  if (target) {
    const p = project(shapeMetrics(target).anchor);
    ctx.strokeStyle = '#c0362d'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x,p.y,18,0,Math.PI*2); ctx.stroke();
  }
  // The arrow target is supplied separately from location visibility by the caller.
  return { ctx, project };
}
export function paintArrow(canvas: HTMLCanvasElement, map: LibreMap, data: Geography, wrong: Session['lastWrong'], targetId?: string, location = false) {
  const prepared = paintFeedback(canvas,map,data,location ? targetId : undefined);
  if (!prepared || !wrong || !targetId) return;
  const f = data.features.find(f => f.properties.id === targetId); if (!f) return;
  const { ctx,project } = prepared, p = project(wrong.point), anchor = shapeMetrics(f).anchor;
  const angle = directionAngle(wrong.point,anchor);
  ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(50,0); ctx.strokeStyle = '#f4e9cd'; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = '#2b2118'; ctx.lineWidth = 1.75; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(60,0); ctx.lineTo(47,-5); ctx.lineTo(47,5); ctx.closePath(); ctx.fillStyle = '#ffb81c'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0,0,3.5,0,Math.PI*2); ctx.fillStyle = '#f4e9cd'; ctx.fill(); ctx.stroke(); ctx.restore();
}
