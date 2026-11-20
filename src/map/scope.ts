import type { Area } from '../data/areas';
import type { Place } from './geography';

const regions: Record<string, string> = {
  'western-asia': 'Western Asia', 'central-asia': 'Central Asia', 'southern-asia': 'Southern Asia',
  'eastern-asia': 'Eastern Asia', 'south-eastern-asia': 'South-Eastern Asia',
  'northern-africa': 'Northern Africa', 'western-africa': 'Western Africa', 'middle-africa': 'Middle Africa',
  'eastern-africa': 'Eastern Africa', 'southern-africa': 'Southern Africa',
  'northern-europe': 'Northern Europe', 'western-europe': 'Western Europe', 'southern-europe': 'Southern Europe', 'eastern-europe': 'Eastern Europe',
  'northern-america': 'Northern America', 'central-america': 'Central America', caribbean: 'Caribbean',
  'australia-new-zealand': 'Australia and New Zealand', melanesia: 'Melanesia', micronesia: 'Micronesia', polynesia: 'Polynesia',
};
export function inScope(place: Place, area: Area, expanded: boolean): boolean {
  if (!expanded && place.kind === 'area') return false;
  if (area.level === 'world') return true;
  if (area.level === 'region') return place.region === regions[area.id];
  if (area.id === 'north-america') return ['Northern America', 'Central America', 'Caribbean'].includes(place.region);
  if (area.id === 'south-america') return place.region === 'South America';
  if (area.id === 'oceania') return ['Australia and New Zealand', 'Melanesia', 'Micronesia', 'Polynesia'].includes(place.region);
  if (area.id === 'africa') return place.region.endsWith('Africa');
  return place.continent === area.name;
}
export function normalizeAnswer(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
