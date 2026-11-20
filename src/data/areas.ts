export type Bounds = readonly [west: number, south: number, east: number, north: number];
export type Area = { id: string; name: string; bounds: Bounds; level: 'region' | 'continent' | 'world' };
export type Continent = { name: string; area: Area; regions: Area[] };
const region = (id: string, name: string, bounds: Bounds): Area => ({ id, name, bounds, level: 'region' });
const continent = (id: string, name: string, bounds: Bounds, regions: Area[]): Continent => ({ name, area: { id, name, bounds, level: 'continent' }, regions });

// Display framing only. Geography membership and totals arrive with the audited dataset.
export const continents: Continent[] = [
  continent('asia', 'Asia', [25, -12, 155, 73], [
    region('western-asia', 'Western Asia', [25, 10, 64, 46]),
    region('central-asia', 'Central Asia', [45, 33, 90, 57]),
    region('southern-asia', 'Southern Asia', [59, -2, 99, 39]),
    region('eastern-asia', 'Eastern Asia', [72, 17, 148, 56]),
    region('south-eastern-asia', 'South-Eastern Asia', [91, -12, 143, 28]),
  ]),
  continent('africa', 'Africa', [-20, -37, 54, 39], [
    region('northern-africa', 'Northern Africa', [-19, 15, 37, 39]),
    region('western-africa', 'Western Africa', [-20, 0, 17, 29]),
    region('middle-africa', 'Central Africa', [7, -19, 33, 24]),
    region('eastern-africa', 'Eastern Africa', [20, -27, 54, 20]),
    region('southern-africa', 'Southern Africa', [10, -37, 38, -15]),
  ]),
  continent('europe', 'Europe', [-26, 33, 50, 72], [
    region('northern-europe', 'Northern Europe', [-26, 49, 34, 72]),
    region('western-europe', 'Western Europe', [-7, 41, 19, 57]),
    region('eastern-europe', 'Eastern Europe', [13, 40, 52, 66]),
    region('southern-europe', 'Southern Europe', [-12, 33, 32, 48]),
  ]),
  continent('north-america', 'North America', [-170, 5, -50, 78], [
    region('north-central-america', 'North and Central', [-170, 5, -50, 78]),
    region('caribbean', 'The Caribbean', [-88, 9, -58, 29]),
  ]),
  continent('south-america', 'South America', [-83, -57, -32, 14], []),
  continent('oceania', 'Oceania', [105, -49, 215, 30], []),
].sort((a,b) => ['north-america','south-america','europe','asia','africa','oceania'].indexOf(a.area.id) - ['north-america','south-america','europe','asia','africa','oceania'].indexOf(b.area.id));
export const world: Area = { id: 'world', name: 'The World', bounds: [-180, -60, 180, 85], level: 'world' };
export const offersWhole = (area: Area) => area.id !== 'north-america';
export const allAreas = [...continents.flatMap(c => [...c.regions, ...(offersWhole(c.area) ? [c.area] : [])]), world];
const aliases: Record<string, string> = { 'northern-america': 'north-central-america', 'central-america': 'north-central-america', 'north-america': 'north-central-america', 'australia-new-zealand': 'oceania', melanesia: 'oceania', micronesia: 'oceania', polynesia: 'oceania' };
export const findArea = (id: string | undefined) => allAreas.find(a => a.id === (aliases[id ?? ''] ?? id)) ?? world;
