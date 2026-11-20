import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, answer, hint, targetId, summarize, addTime, isSession, canResume } from '../src/game/session.ts';
import { readProgress, writeSession, recordKey } from '../src/game/storage.ts';
import { findLabelRect } from '../src/map/completion.ts';
import { allAreas } from '../src/data/areas.ts';
import { inScope } from '../src/map/scope.ts';
import { readFile } from 'node:fs/promises';
const fresh = () => createSession(['AAA', 'BBB', 'CCC'], 'example', true, 'round-1', false, () => .999);
test('a round shuffles without losing or duplicating countries', () => {
  const round = createSession(['A', 'B', 'A', 'C'], 'world', false, 'id', false, () => 0);
  assert.deepEqual([...round.order].sort(), ['A', 'B', 'C']);
  assert.notDeepEqual(round.order, ['A', 'B', 'C']);
});
test('wrong answers keep the prompt; correct answers advance and duplicates do not score', () => {
  const wrong = answer(fresh(), 'BBB');
  assert.equal(targetId(wrong), 'AAA'); assert.equal(wrong.mistakes, 1);
  const correct = answer(wrong, 'AAA');
  assert.equal(targetId(correct), 'BBB'); assert.equal(correct.answers[0].mistakes, 1);
  assert.equal(answer(correct, 'AAA'), correct);
  assert.equal(answer(correct, null), correct);
});
test('hints and skips survive results and produce a precise review set', () => {
  let round = answer(hint(fresh()), 'AAA');
  round = answer(round, null, true);
  round = answer(addTime(round, 2500), 'CCC');
  assert.equal(round.status, 'complete');
  assert.deepEqual(summarize(round), { found: 2, mistakes: 0, hints: 1, skipped: 1, firstTry: 1, perfect: false, reviewIds: ['AAA', 'BBB'] });
  assert.equal(answer(round, 'CCC'), round);
  assert.equal(addTime(round, 500), round);
});
test('valid sessions resume only with the same scope coverage and dataset', () => {
  const round = fresh(); assert.ok(isSession(round));
  assert.ok(canResume(round, ['AAA', 'BBB', 'CCC'], 'example', true));
  assert.ok(!canResume(round, ['AAA', 'BBB'], 'example', true));
  assert.ok(!canResume(round, round.order, 'example', false));
  assert.ok(!isSession({ ...round, dataset: 'old' }));
  assert.ok(!isSession({ ...round, answers: [{ id: 'CCC', mistakes: 0, hinted: false, skipped: false }] }));
  assert.ok(!isSession({ ...round, elapsedMs: NaN }));
});
test('perfect records are separate by coverage, saved once, and untouched by review or assisted runs', () => {
  let raw = null; const store = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  let round = fresh(); round = addTime(round, 5000);
  for (const id of round.order) round = answer(round, id);
  assert.ok(writeSession(round, store)); assert.ok(writeSession(round, store));
  const key = recordKey('example', true);
  assert.deepEqual(readProgress(store).records[key], { runs: 1, perfectBestMs: 5000 });
  let assisted = { ...fresh(), id: 'round-2' }; assisted = hint(assisted);
  for (const id of assisted.order) assisted = answer(assisted, id);
  writeSession(assisted, store);
  assert.deepEqual(readProgress(store).records[key], { runs: 2, perfectBestMs: 5000 });
  writeSession({ ...round, id: 'review', review: true, elapsedMs: 100 }, store);
  assert.equal(readProgress(store).records[key].runs, 2);
  assert.notEqual(key, recordKey('example', false));
});
test('broken or unavailable storage does not prevent playing', () => {
  assert.equal(readProgress({ getItem: () => '{bad', setItem() {} }).active, null);
  assert.equal(writeSession(fresh(), { getItem() { throw Error(); }, setItem() { throw Error(); } }), false);
});
test('every region, continent and world scope can finish in both coverage modes', async () => {
  const geography = JSON.parse(await readFile(new URL('../src/assets/places.geojson', import.meta.url), 'utf8'));
  for (const area of allAreas) for (const expanded of [true, false]) {
    const ids = geography.features.filter(f => inScope(f.properties, area, expanded)).map(f => f.id);
    let round = createSession(ids, area.id, expanded, 'round');
    for (const id of round.order) round = answer(round, id);
    assert.equal(round.status, 'complete', `${area.name} ${expanded}`);
    assert.equal(round.answers.length, ids.length);
    assert.equal(summarize(round).perfect, true);
  }
});
test('crowded country plaques move or hide instead of overlapping or leaving the viewport', () => {
  const first = findLabelRect(150, 150, 85, 22, 500, 400, []);
  const second = findLabelRect(151, 150, 85, 22, 500, 400, [first]);
  assert.ok(first && second);
  assert.ok(second.y + second.height <= first.y || first.y + first.height <= second.y);
  assert.equal(findLabelRect(-50, -50, 80, 22, 500, 400, []), null);
});
