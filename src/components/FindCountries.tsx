import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractiveAtlas, type Selection } from './InteractiveAtlas';
import { allAreas, type Area } from '../data/areas';
import { inScope, loadGeography, type Geography, type Place } from '../map/geography';
import { addTime, answer, canResume, createSession, formatTime, hint, streak, isMilestone, summarize, targetId, type Session } from '../game/session';
import { readProgress, recordKey, writeSession, savedRound } from '../game/storage';
import { scopeColors } from '../map/palette';
import { playSound } from '../game/sound';
import { CountrySilhouette, StreakBanner } from './QuizFeedback';
import { shapeMetrics } from '../map/geometry';
import { SoundButton } from './SoundButton';

export function FindCountries({ area, expanded, onExit, onNext }: { area: Area; expanded: boolean; onExit: () => void; onNext: (area: Area) => void }) {
  const [data, setData] = useState<Geography | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(!document.hidden);
  const [hideClock, setHideClock] = useState(false);
  const [feedback, setFeedback] = useState('Find the named place. Click its shape or a small-place circle.');
  const [selection, setSelection] = useState<Selection>(null);
  const [milestone, setMilestone] = useState(0);
  const [fitRequest, setFitRequest] = useState(0);
  const [snapshot, setSnapshot] = useState<string | null>();
  const [preparingCard, setPreparingCard] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const prompt = useRef<HTMLHeadingElement>(null);
  const cardTitle = useRef<HTMLHeadingElement>(null);
  const lastTick = useRef(performance.now());
  const current = useRef(session); current.current = session;
  const running = useRef(false);
  const animateCard = useRef(false);

  useEffect(() => {
    let active = true; setFailed(false);
    loadGeography().then(geography => {
      if (!active) return;
      const ids = geography.features.filter(f => inScope(f.properties, area, expanded)).map(f => f.properties.id);
      const progress = readProgress();
      const saved = savedRound(area.id, expanded);
      const resumed = canResume(saved, ids, area.id, expanded);
      const colors = scopeColors(geography, area, expanded);
      setData({ ...geography, features: geography.features.map(f => ({ ...f, properties: { ...f.properties, color: colors.get(f.properties.id) ?? f.properties.color } })) });
      setSession(resumed ? saved : createSession(ids, area.id, expanded, crypto.randomUUID()));
      setBest(progress.records[recordKey(area.id, expanded)]?.perfectBestMs ?? null);
      if (resumed && saved?.status === 'playing') setFeedback('Resumed your saved round. Find the next place.');
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [area, expanded, attempt]);

  const activeClock = !!session && session.status === 'playing' && ready && !paused && visible;
  useEffect(() => {
    running.current = activeClock; lastTick.current = performance.now();
    if (!activeClock) return;
    const tick = window.setInterval(() => {
      const now = performance.now(), elapsed = now - lastTick.current; lastTick.current = now;
      setSession(previous => previous ? addTime(previous, elapsed) : null);
    }, 500);
    return () => { clearInterval(tick); running.current = false; };
  }, [activeClock]);
  useEffect(() => {
    const saveOnLeave = () => {
      if (!current.current) return;
      const updated = running.current ? addTime(current.current, performance.now() - lastTick.current) : current.current;
      lastTick.current = performance.now(); current.current = updated; writeSession(updated);
      if (document.hidden) setSession(updated);
    };
    const visibility = () => { saveOnLeave(); setVisible(!document.hidden); };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', saveOnLeave);
    return () => { saveOnLeave(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', saveOnLeave); };
  }, []);
  useEffect(() => { if (session) { setSaveFailed(!writeSession(session)); if (session.status === 'complete') setBest(readProgress().records[recordKey(area.id, expanded)]?.perfectBestMs ?? null); } }, [session, area.id, expanded]);
  useEffect(() => { if (session) prompt.current?.focus({ preventScroll: true }); }, [!!session]);
  useEffect(() => { if (showCard) cardTitle.current?.focus({ preventScroll: true }); }, [showCard]);

  const places = useMemo(() => new Map(data?.features.map(f => [f.properties.id, f.properties]) ?? []), [data]);
  const answered = useMemo(() => session?.answers.map(a => a.id) ?? [], [session?.answers]);
  const stats = session ? summarize(session) : null;
  const assisted = useMemo(() => session?.answers.filter(a => a.hinted || a.skipped).map(a => a.id) ?? [], [session?.answers]);
  const target = session ? places.get(targetId(session)) : null;
  function change(action: (round: Session) => Session) {
    const now = performance.now(), elapsed = running.current ? now - lastTick.current : 0; lastTick.current = now;
    setSession(previous => previous ? action(addTime(previous, elapsed)) : null);
  }
  function choose(place: Place | null, keyboard = false, pin?: [number, number]) {
    if (!session || session.status !== 'playing' || paused || !visible || !ready) return;
    if (!place) { playSound('click'); setFeedback('Choose a place inside this practice area.'); return; }
    if (answered.includes(place.id)) { playSound('click'); setFeedback(`${place.name} is already on your completed map.`); return; }
    animateCard.current = !keyboard;
    const correct = place.id === targetId(session);
    playSound(correct ? 'correct' : 'wrong', session.answers.length);
    if (correct) { const count = streak(answer(session, place.id)); if (isMilestone(count)) setMilestone(count); } else setMilestone(0);
    setFeedback(correct ? `Correct — ${place.name}.` : session.hintStage === 2 || session.mistakes + 1 >= 3 ? `That is ${place.name}. ${target?.name} is circled in red.` : `That is ${place.name}. Follow the arrow toward ${target?.name}.`);
    if (correct) setSelection(null);
    const shape = data?.features.find(f => f.properties.id === place.id);
    change(round => answer(round, place.id, false, pin ?? (shape ? shapeMetrics(shape).anchor : [place.longitude,place.latitude])));
  }
  const chooseRef = useRef(choose); chooseRef.current = choose;
  const selectCountry = useCallback((place: Place | null, keyboard = false, pin?: [number, number]) => chooseRef.current(place, keyboard, pin), []);
  function revealHint() {
    if (!target || !session || session.hintStage >= 2 || paused || !ready) return;
    playSound('hint');
    change(hint); setMilestone(0);
    setFeedback(session.hintStage === 0 ? 'Its shape is beside its name. Press Space again to show its location.' : 'Its location is circled in red. This answer is assisted.');
  }
  function skip(keyboard: boolean) {
    if (!target || paused || !ready) return;
    playSound('click');
    animateCard.current = !keyboard; setFeedback(`Revealed ${target.name}. It will be included in review.`);
    setSelection(null); setMilestone(0);
    change(round => answer(round, null, true));
  }
  function restart(review = false) {
    if (!data || !session || !stats) return;
    const ids = review ? stats.reviewIds : data.features.filter(f => inScope(f.properties, area, expanded)).map(f => f.properties.id);
    if (!ids.length) return;
    setSession(createSession(ids, area.id, expanded, crypto.randomUUID(), review));
    playSound('entry');
    setMilestone(0); setSnapshot(undefined); setPreparingCard(false); setShowCard(false); setSelection(null); setPaused(false); setFitRequest(n => n + 1);
    setFeedback(review ? 'Review the places that needed another look.' : 'A fresh map. Find the named place.');
    animateCard.current = false;
    prompt.current?.focus({ preventScroll: true });
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof HTMLElement && event.target.closest('button,input,textarea,select,summary,a'))) return;
      if (current.current?.status === 'playing' && current.current.hintStage < 2 && ready && !paused && visible) { event.preventDefault(); revealHint(); }
    };
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  });
  useEffect(() => {
    if (session?.status !== 'complete') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setPreparingCard(true), animateCard.current && !reduced ? 650 : 0);
    return () => clearTimeout(timer);
  }, [session?.status]);
  useEffect(() => {
    if (session?.status !== 'complete' || snapshot === undefined) return;
    setPreparingCard(false); setShowCard(true);
    if (animateCard.current) playSound('paper');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stamp = window.setTimeout(() => { if (animateCard.current) playSound('stamp'); }, reduced ? 0 : 600);
    return () => clearTimeout(stamp);
  }, [session?.status, snapshot]);
  if (!session || !data || !stats) return <section className="quiz-loading"><h1 ref={prompt} tabIndex={-1}>Find Countries</h1><p role="status">{failed ? 'The place list could not be loaded.' : 'Preparing your map…'}</p>{failed ? <button onClick={() => setAttempt(n => n + 1)}>Try again</button> : null}<button className="text-action" onClick={onExit}>Choose another area</button></section>;
  const complete = session.status === 'complete';
  const nextArea = allAreas[(allAreas.findIndex(a => a.id === area.id) + 1) % allAreas.length];
  const disabled = !ready || paused || !visible;
  return <section className="quiz-layout" aria-label="Find Countries round" data-round-state={session.status}>
    <div className="quiz-map map-stage">
      <div className="live-quiz-map" inert={showCard || preparingCard || paused || !visible} aria-hidden={showCard || preparingCard || paused || !visible ? true : undefined}>
        <InteractiveAtlas area={area} expanded={expanded} mode="quiz" selection={selection} onSelect={selectCountry} answered={answered} assisted={assisted} wrong={session.lastWrong} targetId={!complete ? target?.id : undefined} complete={complete} capture={preparingCard} hintId={session.hintStage === 2 && !complete ? target?.id : undefined} fitRequest={fitRequest} onReady={setReady} onSnapshot={setSnapshot} />

      </div>
      {!paused && !showCard ? <StreakBanner count={milestone} animated={animateCard.current} /> : null}
      {!complete && (paused || !visible) ? <div className="pause-screen paper"><h2>Take your time.</h2><p>The round is paused.</p><button className="button" onClick={() => setPaused(false)}>Resume</button></div> : null}
      {complete && preparingCard && !showCard ? <div className="result-surface" role="status">Preparing your postcard…</div> : null}
      {complete && showCard ? <section className={`result-surface${animateCard.current ? ' reveal-card' : ''}`} aria-labelledby="postcard-title"><article className="result-postcard paper"><p className="greetings">Greetings from</p><h2 style={snapshot ? { backgroundImage: `url(${snapshot})` } : undefined} ref={cardTitle} id="postcard-title" tabIndex={-1}>{area.name}</h2><div className="postcard-columns"><div className="postcard-picture">{snapshot ? <img src={snapshot} alt={`Your completed ${area.name} map, with place labels and its raised red edge`} /> : <p>{snapshot === undefined ? 'Preparing your map image…' : 'Map image unavailable. Your results are saved below.'}</p>}<span className={`postcard-stamp${stats.perfect ? ' stamp-perfect' : ''}`}>{stats.perfect ? 'Perfect' : 'Complete'}</span></div><div className="postcard-details"><p className="postcard-number">{stats.firstTry}<small>/{session.order.length}</small></p><span className="eyebrow">First try, unassisted</span><p className="postcard-time">Time <strong>{formatTime(session.elapsedMs)}</strong></p><p>{stats.found} found · {stats.skipped} revealed<br />{stats.mistakes} {stats.mistakes === 1 ? 'mistake' : 'mistakes'} · {stats.hints} {stats.hints === 1 ? 'hint' : 'hints'}</p><div className="result-buttons"><button className="button" onClick={() => restart()}>Play again</button><button className="button button-navy" onClick={() => onNext(nextArea)}>Next map</button>{stats.reviewIds.length ? <button className="button button-red" onClick={() => restart(true)}>Review {stats.reviewIds.length} places</button> : null}<button className="text-action" onClick={() => setShowCard(false)}>View completed map</button></div></div></div><footer>pinthatshi · {session.review ? 'Review' : 'Find Countries'} · {expanded ? 'Countries & Areas' : 'Countries'}</footer></article></section> : null}
    </div>
    <aside className="quiz-sidebar paper">
      <div className="round-topbar"><button className="round-back" aria-label="Back to areas" onClick={onExit}>‹</button><div className="clock-readout"><span className="eyebrow">{session.review ? 'Review time' : 'Time'}</span><strong>{hideClock ? '—:—' : formatTime(session.elapsedMs)}</strong>{best != null ? <small>best {formatTime(best)}</small> : null}</div><div className="round-progress"><progress value={answered.length} max={session.order.length} aria-label="Places completed" /><span className="progress-ticks" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${session.order.length}, minmax(0, 1fr))`, gap: session.order.length > 80 ? 0 : 2 }}>{session.order.map(id => <i key={id} style={{ backgroundColor: answered.includes(id) ? places.get(id)?.color : undefined, borderWidth: session.order.length > 80 ? 0 : 1 }} />)}</span><span className="eyebrow">{area.name}</span></div><SoundButton /></div>
      <div className="question-block" aria-live="polite"><span className="eyebrow">{complete ? session.review ? 'Review complete' : 'Map complete' : `${answered.length + 1} of ${session.order.length}`}</span><h1 ref={prompt} tabIndex={-1}>{complete ? stats.perfect ? 'Perfect map!' : 'A little more learned.' : `Find ${target?.name}`}</h1>{session.hintStage > 0 && target ? <CountrySilhouette feature={data.features.find(f => f.properties.id === target.id)!} /> : null}<small>{expanded ? 'Countries & Areas' : 'Countries'}{session.review ? ' · Review' : ''}</small></div>
      <p className="round-feedback" role="status">{complete ? `${stats.firstTry} first try without help. ${stats.reviewIds.length ? `${stats.reviewIds.length} places worth another look.` : 'Every place found without help.'}` : feedback}</p>
      <div className="quiz-actions">{complete ? <><button className="button" onClick={() => restart()}>Play again</button><button className="button button-navy" onClick={() => onNext(nextArea)}>Next map</button><button className="button button-red" onClick={() => setShowCard(true)}>View postcard</button>{stats.reviewIds.length ? <button className="text-action" onClick={() => restart(true)}>Review {stats.reviewIds.length} places</button> : null}</> : <><details className="round-options"><summary>Round options</summary><div><button className="text-action" onClick={event => skip(event.detail === 0)} disabled={disabled}>Reveal & skip</button><button className="text-action" onClick={() => { change(round => round); setPaused(value => !value); }}>{paused ? 'Resume' : 'Pause'}</button><button className="text-action" onClick={() => setHideClock(value => !value)}>{hideClock ? 'Show timer' : 'Hide timer'}</button><button className="text-action" onClick={() => restart()}>Start over</button><small>Arrow keys pan · +/− zoom · Enter selects the center · Space hints</small></div></details><button className="button button-red hint-button" onClick={revealHint} disabled={disabled || session.hintStage === 2}>{session.hintStage === 0 ? 'Hint' : session.hintStage === 1 ? 'Show it' : 'Shown'}<kbd>Space</kbd></button></>}</div>
      <div className="answer-lists"><h2>Found {stats.found}</h2><ul>{session.answers.filter(a => !a.skipped).sort((a, b) => (places.get(a.id)?.name ?? '').localeCompare(places.get(b.id)?.name ?? '')).map(a => <li key={a.id}><i className="place-dot" style={{ backgroundColor: places.get(a.id)?.color }} />{places.get(a.id)?.name}{a.hinted ? <small>hint</small> : a.mistakes ? <small>retry</small> : null}</li>)}</ul>{stats.skipped ? <><h2>Revealed {stats.skipped}</h2><ul>{session.answers.filter(a => a.skipped).map(a => <li key={a.id}><i className="place-dot" style={{ backgroundColor: places.get(a.id)?.color }} />{places.get(a.id)?.name}</li>)}</ul></> : null}{!complete ? <><h2>Still to find {session.order.length - answered.length}</h2><ul className="remaining-places">{session.order.slice(answered.length).sort((a, b) => (places.get(a)?.name ?? '').localeCompare(places.get(b)?.name ?? '')).map(id => <li key={id}><i className="unfound-dot" />{places.get(id)?.name}</li>)}</ul></> : null}</div>
      {saveFailed ? <p className="save-notice" role="status">Progress couldn’t be saved in this browser. You can keep playing.</p> : null}
    </aside>
  </section>;
}
