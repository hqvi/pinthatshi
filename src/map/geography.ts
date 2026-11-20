import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
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
