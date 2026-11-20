import type { Area } from '../data/areas';
import type { Place } from './geography';

import membershipData from '../data/memberships.json' with { type: 'json' };
const members = new Map(Object.entries(membershipData).flatMap(([region, ids]) => ids.map(id => [id, region] as const)));
const continentRegions: Record<string, readonly string[]> = {
  asia: ['western-asia','central-asia','southern-asia','eastern-asia','south-eastern-asia'],
  africa: ['northern-africa','western-africa','middle-africa','eastern-africa','southern-africa'],
  europe: ['northern-europe','western-europe','eastern-europe','southern-europe'],
  'north-america': ['north-central-america','caribbean'], 'south-america': ['south-america'], oceania: ['oceania'],
};
export function primaryContinent(id: string): string | undefined {
  const region = members.get(id); return Object.keys(continentRegions).find(continent => continentRegions[continent].includes(region ?? ''));
}
export function inScope(place: Place, area: Area, expanded: boolean): boolean {
  if (!expanded && place.kind === 'area') return false;
  if (area.level === 'world') return members.has(place.id);
  const region = members.get(place.id);
  return area.level === 'region' ? region === area.id : continentRegions[area.id]?.includes(region ?? '') ?? false;
}
export function normalizeAnswer(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
