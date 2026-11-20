import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { coordinateLabel, gridStep, gridValues, longitudeInterval } from '../src/map/grid.ts';
import { inScope, normalizeAnswer, primaryContinent } from '../src/map/scope.ts';
import { scopeColors, palette } from '../src/map/palette.ts';
import { aidOpacity, containsPoint, shapeMetrics, framing } from '../src/map/geometry.ts';
import { borderLines } from '../src/map/borders.ts';
import { directionAngle } from '../src/map/feedback.ts';
import { allAreas, findArea, world, continents } from '../src/data/areas.ts';

const geography = JSON.parse(await readFile(new URL('../src/assets/places.geojson', import.meta.url), 'utf8'));
const get = id => geography.features.find(f => f.id === id)?.properties;

test('longitude labels wrap correctly on both sides of the date line', () => {
  assert.equal(coordinateLabel(190, false), '170°W');
  assert.equal(coordinateLabel(-190, false), '170°E');
  assert.equal(coordinateLabel(360, false), '0°');
  assert.equal(coordinateLabel(-15, true), '15°S');
  assert.equal(coordinateLabel(.2, true), '0.2°N');
});
test('grid spacing adapts without overlapping edge labels', () => {
  for (const [span, pixels] of [[360, 1200], [40, 390], [2, 800], [150, 350]]) {
    const step = gridStep(span, pixels);
    assert.ok(step * pixels / span >= 45.9);
    const values = gridValues(-span / 2, span / 2, step);
    assert.ok(values.every(Number.isFinite));
    assert.ok(values.length <= 100);
  }
});
test('dateline islands use a short focus interval instead of a world-spanning box', () => {
  const [west, east] = longitudeInterval([178, -179, 179.5, -178.5]);
  assert.ok(east - west < 5);
  assert.ok(east > 180);
});
test('French Guiana belongs to South America and is excluded by Countries coverage', () => {
  const place = get('GUF');
  assert.ok(place);
  assert.equal(place.parent, 'France');
  assert.equal(inScope(place, findArea('south-america'), true), true);
  assert.equal(inScope(place, findArea('europe'), true), false);
  assert.equal(inScope(place, world, false), false);
  assert.equal(inScope(get('FRA'), findArea('europe'), false), true);
});
test('country packs do not accidentally split the UK in the world dataset', () => {
  assert.ok(get('GBR'));
  assert.ok(!get('ENG') && !get('WLS') && !get('SCT') && !get('NIR'));
});
test('every display scope has mapped places, stable unique IDs, and finite geometry', () => {
  assert.equal(new Set(geography.features.map(f => f.id)).size, geography.features.length);
  assert.equal(new Set(allAreas.map(area => area.id)).size, allAreas.length);
  for (const area of allAreas) assert.ok(geography.features.some(f => inScope(f.properties, area, true)), area.name);
  for (const feature of geography.features) {
    assert.equal(feature.id, feature.properties.id);
    assert.match(feature.properties.color, /^#[a-f0-9]{6}$/);
    assert.ok(Number.isFinite(feature.properties.longitude) && Number.isFinite(feature.properties.latitude));
    const positions = feature.geometry.coordinates.flat(feature.geometry.type === 'Polygon' ? 1 : 2);
    assert.ok(positions.every(p => p.length >= 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90), feature.id);
  }
});
test('search ignores accents and punctuation and fails safely for unknown area IDs', () => {
  assert.equal(normalizeAnswer('  Réunion  '), 'reunion');
  assert.equal(normalizeAnswer('Côte d’Ivoire'), 'cote d ivoire');
  assert.equal(findArea('not-a-place'), world);
});
test('card thumbnails use the same place colors as live selection', async () => {
  const artwork = await readFile(new URL('../src/assets/world-color.svg', import.meta.url), 'utf8');
  for (const feature of geography.features) assert.ok(artwork.includes(`<use href="#land-${feature.id}" fill="${feature.properties.color}"/>`), feature.id);
});
test('the published game roster has 197 countries and 56 areas, without misleading parent labels', () => {
  assert.equal(geography.features.filter(f => f.properties.kind === 'country').length, 197);
  assert.equal(geography.features.filter(f => f.properties.kind === 'area').length, 56);
  for (const id of ['KOS', 'PSX', 'VAT', 'TWN']) { assert.equal(get(id).kind, 'country'); assert.equal(get(id).parent, ''); }
  assert.equal(get('SOL').kind, 'area');
  assert.equal(get('GUF').parent, 'France');
});

test('scope palettes are deterministic, complete and do not change source geography', () => {
  const before = JSON.stringify(geography);
  const area = findArea('central-asia');
  const first = scopeColors(geography, area, false);
  assert.equal(first.size, 5);
  assert.deepEqual(first, scopeColors(geography, area, false));
  assert.ok([...first.values()].every(color => palette.includes(color)));
  assert.ok(new Set(first.values()).size >= 4);
  assert.equal(JSON.stringify(geography), before);
  assert.equal(coordinateLabel(180, false), '180°');
});

test('physical coast paths use finite coordinates and fit the renderer line-mesh limit', async () => {
  const coast = JSON.parse(await readFile(new URL('../src/assets/coastlines.geojson', import.meta.url), 'utf8'));
  assert.ok(coast.features.length > 1000);
  for (const feature of coast.features) {
    assert.equal(feature.geometry.type, 'LineString');
    assert.ok(feature.geometry.coordinates.length >= 2 && feature.geometry.coordinates.length * 10 < 65535);
    assert.ok(feature.geometry.coordinates.every(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) <= 180 && Math.abs(y) <= 90));
  }
});

test('the 22-map picker matches reference countries and continent totals with no missing primary continent', () => {
  assert.equal(allAreas.length, 22);
  assert.deepEqual(allAreas.slice(0,3).map(a=>a.id),['north-central-america','caribbean','south-america']);
  const counts = { 'north-central-america':10, caribbean:13, 'south-america':12, europe:45, asia:49, africa:54, oceania:14, world:197 };
  for (const [id,count] of Object.entries(counts)) assert.equal(geography.features.filter(f => inScope(f.properties, findArea(id), false)).length, count, id);
  for (const feature of geography.features) {
    assert.ok(primaryContinent(feature.id), feature.id);
    assert.equal(continents.filter(c => inScope(feature.properties,c.area,true)).length,1,feature.id);
  }
  assert.equal(inScope(get('MDV'),findArea('asia'),false),true);
  assert.equal(findArea('central-america').id,'north-central-america');
  assert.equal(findArea('polynesia').id,'oceania');
});
test('selection aids anchor on actual geometry, fade with country footprint and disappear at maximum zoom', () => {
  for (const feature of geography.features) {
    const metrics = shapeMetrics(feature);
    assert.ok(containsPoint(feature,metrics.anchor),feature.id);
    assert.ok(metrics.size > 0 && metrics.bounds.every(Number.isFinite),feature.id);
  }
  assert.equal(aidOpacity(.1,1),1);
  assert.ok(aidOpacity(1,4) > 0 && aidOpacity(1,4) < 1);
  assert.equal(aidOpacity(1,5),0);
  assert.equal(aidOpacity(.001,12),0);
});
test('direction arrows take the short route across the date line and remain coarse compass directions', () => {
  assert.equal(directionAngle([179,0],[-179,0]),0);
  assert.equal(directionAngle([899,0],[-179,0]),0);
  assert.equal(Math.abs(directionAngle([-179,0],[179,0])),Math.PI);
  const angle = directionAngle([0,0],[20,10]);
  assert.ok(Number.isInteger(angle/(Math.PI/4)));
});
test('Morocco and Western Sahara retain separate source geometry and coverage ownership', () => {
  const morocco = geography.features.find(f=>f.id==='MAR'), sahara = geography.features.find(f=>f.id==='SAH');
  assert.ok(containsPoint(morocco,[-13,25])); assert.ok(!containsPoint(sahara,[-13,25]));
  assert.ok(containsPoint(sahara,[-14,23])); assert.ok(!containsPoint(morocco,[-14,23]));
  assert.equal(inScope(sahara.properties,findArea('northern-africa'),false),false);
  assert.equal(inScope(sahara.properties,findArea('northern-africa'),true),true);
});

test('shared boundaries are rendered once so neighbouring dash phases cannot fill each other', () => {
  const data={type:'FeatureCollection',features:[[[0,0],[1,0],[1,1],[0,1],[0,0]],[[1,0],[2,0],[2,1],[1,1],[1,0]]].map(ring=>({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[ring]}}))};
  const edges=[];
  for(const f of borderLines(data).features) for(let i=1;i<f.geometry.coordinates.length;i++) edges.push([f.geometry.coordinates[i-1].join(','),f.geometry.coordinates[i].join(',')].sort().join('/'));
  assert.equal(edges.length,7); assert.equal(new Set(edges).size,7);
});
test('regional thumbnails frame local geography without pulling all of Siberia into Eastern Europe', () => {
  const area=findArea('eastern-europe'), ids=new Set(geography.features.filter(f=>inScope(f.properties,area,false)).map(f=>f.id));
  const bounds=framing(geography,area,ids);
  assert.ok(bounds[0]>=10 && bounds[2]<=55);
  assert.ok(ids.has('RUS'));
  const source=shapeMetrics(geography.features.find(f=>f.id==='RUS')).bounds;
  assert.ok(source[2]>150); // Framing never alters the actual quiz polygon.
});
