import type { FeatureCollection, MultiPolygon, Polygon, LineString } from 'geojson';
import coastUrl from '../assets/coastlines.geojson?url';
import geographyUrl from '../assets/places.geojson?url';

export type Place = { id: string; name: string; kind: 'country' | 'area'; parent: string; sourceType: string; continent: string; region: string; longitude: number; latitude: number; color: string };
export type Geography = FeatureCollection<Polygon | MultiPolygon, Place>;
let pending: Promise<Geography> | undefined;
export function loadGeography(): Promise<Geography> {
  pending ??= fetch(geographyUrl).then(async response => {
    if (!response.ok) throw new Error('Could not load atlas geography');
    return await response.json() as Geography;
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}

export { inScope, normalizeAnswer } from './scope';

let coastPending: Promise<FeatureCollection<LineString>> | undefined;
export function loadCoastlines(): Promise<FeatureCollection<LineString>> {
  coastPending ??= fetch(coastUrl).then(async response => {
    if (!response.ok) throw new Error('Could not load coastline');
    return await response.json() as FeatureCollection<LineString>;
  }).catch(error => { coastPending = undefined; throw error; });
  return coastPending;
}
