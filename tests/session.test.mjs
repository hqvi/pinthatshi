import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, answer, hint, targetId, summarize, addTime, isSession, canResume, streak, isMilestone } from '../src/game/session.ts';
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

test('unfinished maps survive switching region and coverage, and completion clears only its own slot', () => {
  let raw = null; const store = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const one = answer(fresh(), 'AAA');
  const two = { ...fresh(), id: 'other', scopeId: 'other', expanded: false };
  writeSession(one, store); writeSession(two, store);
  let progress = readProgress(store);
  assert.equal(progress.rounds[recordKey('example', true)].answers.length, 1);
  assert.equal(progress.rounds[recordKey('other', false)].id, 'other');
  let complete = one; for (const id of complete.order) complete = answer(complete, id);
  writeSession(complete, store); progress = readProgress(store);
  assert.equal(progress.rounds[recordKey('example', true)], undefined);
  assert.equal(progress.rounds[recordKey('other', false)].id, 'other');
  assert.deepEqual(progress.learned.sort(), ['AAA', 'BBB', 'CCC']);
});
test('old saves migrate without inventing learned countries from a run counter', () => {
  const old = { version: 1, active: fresh(), records: { old: { runs: 20, perfectBestMs: null } }, recordedIds: [] };
  const store = { getItem: () => JSON.stringify(old), setItem() {} };
  const progress = readProgress(store);
  assert.deepEqual(progress.learned, []);
  assert.equal(progress.rounds[recordKey('example', true)].id, old.active.id);
  assert.equal(progress.records.old.runs, 20);
});

test('manual hints progress through silhouette and location; third wrong guess also reveals location', () => {
  let round = fresh();
  round = hint(round); assert.equal(round.hintStage,1);
  round = hint(round); assert.equal(round.hintStage,2); assert.equal(hint(round),round);
  round = fresh();
  for (let i=0;i<3;i++) { round = answer(round,'BBB',false,[10+i,20]); assert.equal(round.hintStage,i===2?2:0); }
  assert.deepEqual(round.lastWrong,{id:'BBB',point:[12,20]});
  assert.ok(isSession(round));
  round = answer(round,'AAA'); assert.equal(round.hintStage,0); assert.equal(round.lastWrong,null); assert.equal(round.answers[0].hinted,true);
});
test('streaks include only uninterrupted first-try unassisted answers and use the agreed milestones', () => {
  let round = createSession(['A','B','C','D','E','F'], 'test', false,'streak',false,()=>.999);
  for (const id of ['A','B','C']) round=answer(round,id);
  assert.equal(streak(round),3); assert.ok(isMilestone(3));
  round=answer(round,'F'); assert.equal(streak(round),0);
  round=answer(round,'D'); assert.equal(streak(round),0);
  round=answer(round,'E'); assert.equal(streak(round),1);
  assert.equal(streak(hint(round)),0);
  assert.deepEqual([3,5,10,20,30,40].map(isMilestone),[true,true,true,true,true,true]);
  assert.equal(isMilestone(15),false);
});
test('legacy geography sessions are archived while learned places and old record entries are retained', () => {
  const legacy={...fresh(),version:1,dataset:'natural-earth-5.1.2-pinthatshi-1'};
  let raw=JSON.stringify({version:1,active:legacy,rounds:{old:legacy},learned:['GUF'],records:{old:{runs:1,perfectBestMs:5000}},recordedIds:['legacy']});
  const store={getItem:()=>raw,setItem:(_,value)=>{raw=value;}};
  let progress=readProgress(store);
  assert.equal(progress.active,null); assert.equal(progress.archivedRounds.length,1); assert.deepEqual(progress.learned,['GUF']);
  writeSession(fresh(),store); progress=readProgress(store);
  assert.equal(progress.archivedRounds.length,1); assert.equal(progress.records.old.perfectBestMs,5000);
});

test('tiny-country plaques leave the shape visible and provide space for their leader line', () => {
  const rect=findLabelRect(250,150,140,22,700,400,[],true);
  assert.ok(rect);
  const x=Math.max(rect.x,Math.min(rect.x+rect.width,250)),y=Math.max(rect.y,Math.min(rect.y+rect.height,150));
  assert.ok(Math.hypot(x-250,y-150)>=15);
});
