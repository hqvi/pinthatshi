import { useEffect, useMemo, useRef, useState } from 'react';
import { InteractiveAtlas, type Selection } from './InteractiveAtlas';
import { allAreas, type Area } from '../data/areas';
import { inScope, loadGeography, type Geography, type Place } from '../map/geography';
import { addTime, answer, canResume, createSession, formatTime, hint, summarize, targetId, type Session } from '../game/session';
import { readProgress, recordKey, writeSession } from '../game/storage';
import compass from '../../docs/style-guide/sprites/compass.svg';

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
  const [fitRequest, setFitRequest] = useState(0);
  const [snapshot, setSnapshot] = useState<string | null>();
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
      const resumed = canResume(progress.active, ids, area.id, expanded);
      setData(geography);
      setSession(resumed ? progress.active : createSession(ids, area.id, expanded, crypto.randomUUID()));
      setBest(progress.records[recordKey(area.id, expanded)]?.perfectBestMs ?? null);
      if (resumed && progress.active?.status === 'playing') setFeedback('Resumed your saved round. Find the next place.');
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
  const target = session ? places.get(targetId(session)) : null;
  function change(action: (round: Session) => Session) {
    const now = performance.now(), elapsed = running.current ? now - lastTick.current : 0; lastTick.current = now;
    setSession(previous => previous ? action(addTime(previous, elapsed)) : null);
  }
  function choose(place: Place | null, keyboard = false) {
    if (!session || session.status !== 'playing' || paused || !visible || !ready) return;
    if (!place) { setFeedback('Choose a place inside this practice area.'); return; }
    if (answered.includes(place.id)) { setFeedback(`${place.name} is already on your completed map.`); return; }
    animateCard.current = !keyboard;
    const correct = place.id === targetId(session);
    setFeedback(correct ? `Correct — ${place.name}.` : `That is ${place.name}. Try finding ${target?.name} again.`);
    if (correct) { setSelection(null); if (session.hinted) setFitRequest(n => n + 1); }
    change(round => answer(round, place.id));
  }
  function revealHint() {
    if (!target || !session || paused || !ready) return;
    change(hint); setSelection({ place: target, focus: true, revision: Date.now() });
    setFeedback(`Hint: ${target.name} is outlined in red. This place will be marked assisted.`);
  }
  function skip(keyboard: boolean) {
    if (!target || paused || !ready) return;
    animateCard.current = !keyboard; setFeedback(`Revealed ${target.name}. It will be included in review.`);
    setSelection(null); if (session?.hinted) setFitRequest(n => n + 1);
    change(round => answer(round, null, true));
  }
  function restart(review = false) {
    if (!data || !session || !stats) return;
    const ids = review ? stats.reviewIds : data.features.filter(f => inScope(f.properties, area, expanded)).map(f => f.properties.id);
    if (!ids.length) return;
    setSession(createSession(ids, area.id, expanded, crypto.randomUUID(), review));
    setSnapshot(undefined); setShowCard(false); setSelection(null); setPaused(false); setFitRequest(n => n + 1);
    setFeedback(review ? 'Review the places that needed another look.' : 'A fresh map. Find the named place.');
    animateCard.current = false;
    prompt.current?.focus({ preventScroll: true });
  }
  if (!session || !data || !stats) return <section className="quiz-loading"><h1 ref={prompt} tabIndex={-1}>Find Countries</h1><p role="status">{failed ? 'The place list could not be loaded.' : 'Preparing your map…'}</p>{failed ? <button onClick={() => setAttempt(n => n + 1)}>Try again</button> : null}<button className="text-action" onClick={onExit}>Choose another area</button></section>;
  const complete = session.status === 'complete';
  const nextArea = allAreas[(allAreas.findIndex(a => a.id === area.id) + 1) % allAreas.length];
  const disabled = !ready || paused || !visible;
  return <section className="quiz-layout" aria-label="Find Countries round" data-round-state={session.status}>
    <div className="quiz-map map-stage">
      <div className="live-quiz-map" inert={showCard || paused || !visible} aria-hidden={showCard || paused || !visible ? true : undefined}>
        <InteractiveAtlas area={area} expanded={expanded} mode="quiz" selection={selection} onSelect={choose} answered={answered} complete={complete} hintId={session.hinted && !complete ? target?.id : undefined} fitRequest={fitRequest} onReady={setReady} onSnapshot={image => { setSnapshot(image); setShowCard(true); }} />
        <div className="map-caption paper"><span className="eyebrow">{session.review ? 'Review mistakes' : 'Find Countries'}</span><strong>{area.name}</strong><span>{expanded ? 'Countries & Areas' : 'Countries'}</span></div><img className="compass" src={compass} width="48" height="48" alt="" />
      </div>
      {!complete && (paused || !visible) ? <div className="pause-screen paper"><h2>Take your time.</h2><p>The round is paused.</p><button className="button" onClick={() => setPaused(false)}>Resume</button></div> : null}
      {complete && showCard ? <section className={`result-surface${animateCard.current ? ' reveal-card' : ''}`} aria-labelledby="postcard-title"><article className="result-postcard paper"><p className="greetings">Greetings from</p><h2 ref={cardTitle} id="postcard-title" tabIndex={-1}>{area.name}</h2><div className="postcard-columns"><div className="postcard-picture">{snapshot ? <img src={snapshot} alt={`Your completed ${area.name} map, with place labels and its raised red edge`} /> : <p>{snapshot === undefined ? 'Preparing your map image…' : 'Map image unavailable. Your results are saved below.'}</p>}<span className="postcard-stamp">{stats.perfect ? 'Perfect' : 'Complete'}</span></div><div className="postcard-details"><p className="postcard-number">{stats.firstTry}<small>/{session.order.length}</small></p><span className="eyebrow">First try, unassisted</span><p className="postcard-time">Time <strong>{formatTime(session.elapsedMs)}</strong></p><p>{stats.found} found · {stats.skipped} revealed<br />{stats.mistakes} {stats.mistakes === 1 ? 'mistake' : 'mistakes'} · {stats.hints} {stats.hints === 1 ? 'hint' : 'hints'}</p><div className="result-buttons"><button className="button" onClick={() => restart()}>Play again</button><button className="button button-navy" onClick={() => onNext(nextArea)}>Next map</button>{stats.reviewIds.length ? <button className="button button-red" onClick={() => restart(true)}>Review {stats.reviewIds.length} places</button> : null}<button className="text-action" onClick={() => setShowCard(false)}>View completed map</button></div></div></div><footer>pinthatshi · {session.review ? 'Review' : 'Find Countries'} · {expanded ? 'Countries & Areas' : 'Countries'}</footer></article></section> : null}
    </div>
    <aside className="quiz-sidebar paper">
      <div className="round-topbar"><div><span className="eyebrow">{session.review ? 'Review time' : 'Time'}</span><strong>{hideClock ? '—:—' : formatTime(session.elapsedMs)}</strong><button className="text-action" onClick={() => setHideClock(value => !value)}>{hideClock ? 'Show timer' : 'Hide timer'}</button></div><div><span className="eyebrow">{area.name}</span><span className="progress-readout">{answered.length} / {session.order.length}</span><progress value={answered.length} max={session.order.length} aria-label="Places completed" /><span className="progress-ticks" aria-hidden="true" style={{ width: Math.min(135, session.order.length * 5), marginLeft: "auto", gridTemplateColumns: `repeat(${session.order.length}, minmax(0, 1fr))`, gap: session.order.length > 80 ? 0 : 2 }}>{session.order.map(id => <i key={id} style={{ backgroundColor: answered.includes(id) ? places.get(id)?.color : undefined, borderWidth: session.order.length > 80 ? 0 : 1 }} />)}</span></div></div>
      <div className="question-block" aria-live="polite"><span className="eyebrow">{complete ? session.review ? 'Review complete' : 'Map complete' : `${answered.length + 1} of ${session.order.length}`}</span><h1 ref={prompt} tabIndex={-1}>{complete ? stats.perfect ? 'Perfect map!' : 'A little more learned.' : `Find ${target?.name}`}</h1><small>{expanded ? 'Countries & Areas' : 'Countries'}{session.review ? ' · Review' : ''}</small></div>
      <p className="round-feedback" role="status">{complete ? `${stats.firstTry} first try without help. ${stats.reviewIds.length ? `${stats.reviewIds.length} places worth another look.` : 'Every place found without help.'}` : feedback}</p>
      <div className="quiz-actions">{complete ? <><button className="button button-navy" onClick={() => setShowCard(true)}>View postcard</button><button className="button" onClick={() => restart()}>Play again</button>{stats.reviewIds.length ? <button className="button button-red" onClick={() => restart(true)}>Review {stats.reviewIds.length} places</button> : null}<button className="text-action" onClick={onExit}>Choose another area</button><p className="record-note">{session.review ? 'Review rounds have separate results.' : best === null ? 'A perfect run sets your first best time.' : `Perfect best ${formatTime(best)}`}</p></> : <><button className="button button-red" onClick={revealHint} disabled={disabled || session.hinted}>Hint</button><button className="button" onClick={event => skip(event.detail === 0)} disabled={disabled}>Reveal & skip</button><button className="text-action" onClick={() => { change(round => round); setPaused(value => !value); }}>{paused ? 'Resume' : 'Pause'}</button><small>Keyboard: arrow keys pan, +/− zoom, Enter selects the crosshair.</small></>}</div>
      <div className="answer-lists"><h2>Found {stats.found}</h2><ul>{session.answers.filter(a => !a.skipped).sort((a, b) => (places.get(a.id)?.name ?? '').localeCompare(places.get(b.id)?.name ?? '')).map(a => <li key={a.id}><i className="place-dot" style={{ backgroundColor: places.get(a.id)?.color }} />{places.get(a.id)?.name}{a.hinted ? <small>hint</small> : a.mistakes ? <small>retry</small> : null}</li>)}</ul>{stats.skipped ? <><h2>Revealed {stats.skipped}</h2><ul>{session.answers.filter(a => a.skipped).map(a => <li key={a.id}><i className="place-dot" style={{ backgroundColor: places.get(a.id)?.color }} />{places.get(a.id)?.name}</li>)}</ul></> : null}{!complete ? <><h2>Still to find {session.order.length - answered.length}</h2><ul className="remaining-places">{session.order.slice(answered.length).sort((a, b) => (places.get(a)?.name ?? '').localeCompare(places.get(b)?.name ?? '')).map(id => <li key={id}>{places.get(id)?.name}</li>)}</ul></> : null}</div>
      {saveFailed ? <p className="save-notice" role="status">Progress couldn’t be saved in this browser. You can keep playing.</p> : null}
    </aside>
  </section>;
}
