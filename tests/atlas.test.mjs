import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { coordinateLabel, gridStep, gridValues, longitudeInterval } from '../src/map/grid.ts';
import { inScope, normalizeAnswer } from '../src/map/scope.ts';
import { allAreas, findArea, world } from '../src/data/areas.ts';

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
    assert.ok(step * pixels / span >= 84.9);
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
