import { useEffect, useState } from 'react';
import { findArea, type Area } from '../data/areas';
import { inScope, loadGeography, type Place } from '../map/geography';
import { formatTime, type Session } from '../game/session';
import { readProgress, recordKey } from '../game/storage';

export function ContinuePractice({ onContinue }: { onContinue: (session: Session) => void }) {
  const [active] = useState(() => { const progress = readProgress(); return progress.active?.status === 'playing' ? progress.active : Object.values(progress.rounds).at(-1) ?? null; });
  return active?.status === 'playing' ? <button className="continue-practice" onClick={() => onContinue(active)}>Continue {active.review ? 'review' : findArea(active.scopeId).name} · {active.answers.length}/{active.order.length}</button> : null;
}
export function StartRound({ area, expanded, onStart }: { area: Area; expanded: boolean; onStart: (fresh: boolean) => void }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [progress] = useState(readProgress);
  useEffect(() => {
    let active = true; setFailed(false);
    loadGeography().then(data => { if (active) setPlaces(data.features.map(f => f.properties)); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);
  const count = places.filter(place => inScope(place, area, expanded)).length;
  const resume = progress.active?.status === 'playing' && progress.active.scopeId === area.id && progress.active.expanded === expanded;
  const record = progress.records[recordKey(area.id, expanded)];
  return <div className="start-round"><span>{failed ? 'Place list unavailable.' : places.length ? `${count} ${expanded ? 'countries & areas' : 'countries'}` : 'Loading places…'}</span>{failed ? <button onClick={() => setAttempt(n => n + 1)}>Try again</button> : <button className="button button-navy" disabled={!count} onClick={() => onStart(!resume)}>{resume ? 'Continue round' : 'Start game'}</button>}{resume ? <button className="text-action" onClick={() => onStart(true)}>Start a new round</button> : null}{record?.perfectBestMs != null ? <small>Perfect best {formatTime(record.perfectBestMs)}</small> : <small>Find every prompted place on the map.</small>}</div>;
}
