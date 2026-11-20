import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { colorFor } from './place-colors.mjs';

const countries = JSON.parse(await readFile(process.argv[2] || new URL('../.preview/ne_50m_admin_0_countries.geojson', import.meta.url), 'utf8'));
const units = JSON.parse(await readFile(process.argv[3] || new URL('../.preview/ne_50m_admin_0_map_units.geojson', import.meta.url), 'utf8'));
// Split overseas geography, not internal constituent countries or provinces.
const splits = new Set(['FRA', 'NLD', 'PRT', 'NOR', 'NZL', 'IOA']);
const mainUnits = { FXX: 'FRA', PRX: 'PRT' };
const associatedCountries = new Set(['JEY', 'GGY', 'IMN', 'ABW', 'CUW', 'ALD', 'GRL', 'MAC', 'HKG', 'SXM']);
const countryOverrides = new Set(['KOS', 'PSX']);
const areaOverrides = new Set(['SOL']);
const source = [...countries.features.filter(f => !splits.has(f.properties.ADM0_A3)), ...units.features.filter(f => splits.has(f.properties.ADM0_A3))];
const features = source.filter(f => f.properties.ADM0_A3 !== 'ATA').map(f => {
  const p = f.properties;
  const rawId = splits.has(p.ADM0_A3) ? p.GU_A3 : p.ADM0_A3;
  const id = mainUnits[rawId] || rawId;
  const area = areaOverrides.has(id) || (!countryOverrides.has(id) && !mainUnits[rawId] && (associatedCountries.has(id) || rawId !== p.ADM0_A3 || !['Country', 'Sovereign country', 'Sovereignty'].includes(p.TYPE)));
  const name = id === 'FRA' ? 'France' : id === 'TLS' ? 'Timor-Leste' : p.NAME_EN || p.GEOUNIT || p.ADMIN;
  const parent = area && !['Disputed', 'Indeterminate'].includes(p.TYPE) && p.SOVEREIGNT !== name ? p.SOVEREIGNT : '';
  const geometry = JSON.parse(JSON.stringify(f.geometry, (_, value) => typeof value === 'number' ? Math.round(value * 100000) / 100000 : value));
  return { type: 'Feature', id, properties: { id, name, kind: area ? 'area' : 'country', parent, sourceType: p.TYPE, continent: p.CONTINENT, region: p.SUBREGION, longitude: p.LABEL_X, latitude: p.LABEL_Y, color: colorFor(id) }, geometry };
}).sort((a, b) => a.properties.name.localeCompare(b.properties.name, 'en'));
if (new Set(features.map(f => f.id)).size !== features.length) throw Error('Duplicate place identifiers');
await mkdir(new URL('../src/assets/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/assets/places.geojson', import.meta.url), JSON.stringify({ type: 'FeatureCollection', features }) + '\n');
const rows = features.map(f => { const p = f.properties; return `| ${p.id} | ${p.name} | ${p.kind} | ${p.region} | ${p.parent || '—'} | ${p.sourceType} |`; });
await writeFile(new URL('../docs/geography-checklist.md', import.meta.url), `# Interactive atlas: source checklist\n\nThis is the first playable roster. Countries contains 197 entries; expanded coverage contains 253. See the [roster policy](game-roster.md) for inclusions and primary-region choices. ${features.length} mapped places use Natural Earth v5.1.2 1:50m countries and map units. This version freezes the practice grouping. Future roster revisions must change the dataset version so records remain comparable. Source classifications are preserved below; they are not assertions of recognition or sovereignty.\n\nOverseas map units are split for France, Netherlands, Portugal, Norway, New Zealand, and the source's Indian Ocean Territories. Mainland France and Portugal retain FRA/PRT identifiers. The UK, Belgium, Bosnia and Herzegovina, and other internally subdivided countries remain together. Antarctica is context outside this practice roster and is currently omitted. Region membership follows the source SUBREGION; Northern Africa maps to its Northern Africa/Western Sahara entries, and the Americas use Northern America, Central America, Caribbean, and South America. Scope filters use these names, not bounding-box containment.\n\nCountries includes the explicitly documented Palestine and Kosovo overrides; Somaliland remains in expanded coverage. Other dependencies and associated/source-disputed areas remain in expanded coverage. The game grouping is distinct from the original source type shown in the table. A small-place marker is a selection aid at the source label anchor, not a replacement geographic boundary.\n\nSources: [countries](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_countries.geojson), [map units](https://github.com/nvkelso/natural-earth-vector/blob/v5.1.2/geojson/ne_50m_admin_0_map_units.geojson), [public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/). Regenerate using scripts/create-geography.mjs with the two downloaded files as arguments. Normal builds use committed geometry.\n\n| ID | Place | Display grouping | Geographic subregion | Associated sovereign | Source type |\n| --- | --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`);
console.log(`Generated ${features.length} mapped places and their exploration checklist.`);
