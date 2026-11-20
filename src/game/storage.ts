import { DATASET, isSession, summarize, type Session } from './session.ts';

const KEY = 'pinthatshi.progress.v1';
type RecordEntry = { runs: number; perfectBestMs: number | null };
export type Progress = { version: 1; active: Session | null; records: Record<string, RecordEntry>; recordedIds: string[]; rounds: Record<string, Session>; learned: string[]; archivedRounds: unknown[] };
type Store = Pick<Storage, 'getItem' | 'setItem'>;
const empty = (): Progress => ({ version: 1, active: null, records: {}, recordedIds: [], rounds: {}, learned: [], archivedRounds: [] });
export const recordKey = (scopeId: string, expanded: boolean) => `${DATASET}:find-countries:map:${scopeId}:${expanded ? 'areas' : 'countries'}`;
export function readProgress(store?: Store): Progress {
  try {
    const raw = (store ?? localStorage).getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Progress;
    if (parsed.version !== 1 || !parsed.records || typeof parsed.records !== 'object' || !Array.isArray(parsed.recordedIds)) return empty();
    const records: Progress['records'] = {};
    for (const [key, entry] of Object.entries(parsed.records)) if (entry && Number.isInteger(entry.runs) && entry.runs >= 0 && (entry.perfectBestMs === null || (Number.isFinite(entry.perfectBestMs) && entry.perfectBestMs >= 0))) records[key] = entry;
    const archivedRounds: unknown[] = Array.isArray(parsed.archivedRounds) ? parsed.archivedRounds.slice(-100) : [];
    const legacy = [parsed.active, ...Object.values(parsed.rounds ?? {})].filter((r): r is Session => !!r && typeof r === 'object' && (r as Session).dataset !== DATASET);
    for (const round of legacy) if (!archivedRounds.some(r => !!r && typeof r === 'object' && 'id' in r && r.id === round.id)) archivedRounds.push(round);
    const rounds: Progress['rounds'] = {};
    for (const [key, round] of Object.entries(parsed.rounds ?? {})) if (isSession(round) && round.status === 'playing' && !round.review && key === recordKey(round.scopeId, round.expanded)) rounds[key] = round;
    if (isSession(parsed.active) && parsed.active.status === 'playing' && !parsed.active.review) rounds[recordKey(parsed.active.scopeId, parsed.active.expanded)] = parsed.active;
    const learned = Array.isArray(parsed.learned) ? parsed.learned.filter(id => typeof id === 'string') : [];
    return { version: 1, rounds, learned, archivedRounds, active: isSession(parsed.active) ? parsed.active : null, records, recordedIds: parsed.recordedIds.filter(id => typeof id === 'string').slice(-100) };
  } catch { return empty(); }
}
export function writeSession(session: Session | null, store?: Store): boolean {
  try {
    const storage = store ?? localStorage;
    const progress = readProgress(storage);
    progress.active = session;
    if (session && !session.review) {
      const slot = recordKey(session.scopeId, session.expanded);
      if (session.status === 'playing') progress.rounds[slot] = session; else delete progress.rounds[slot];
      progress.learned = [...new Set([...progress.learned, ...session.answers.filter(a => !a.skipped).map(a => a.id)])];
    }
    if (session?.status === 'complete' && !session.review && !progress.recordedIds.includes(session.id)) {
      const key = recordKey(session.scopeId, session.expanded);
      const record = progress.records[key] ?? { runs: 0, perfectBestMs: null };
      progress.records[key] = { runs: record.runs + 1, perfectBestMs: summarize(session).perfect ? Math.min(record.perfectBestMs ?? Infinity, session.elapsedMs) : record.perfectBestMs };
      progress.recordedIds = [...progress.recordedIds, session.id].slice(-100);
    }
    storage.setItem(KEY, JSON.stringify(progress));
    return true;
  } catch { return false; }
}

export function savedRound(scopeId: string, expanded: boolean): Session | null {
  const progress = readProgress();
  if (progress.active?.review && progress.active.scopeId === scopeId && progress.active.expanded === expanded && progress.active.status === 'playing') return progress.active;
  return progress.rounds[recordKey(scopeId, expanded)] ?? null;
}
export function clearRound(scopeId: string, expanded: boolean): void {
  try {
    const progress = readProgress(); delete progress.rounds[recordKey(scopeId, expanded)];
    if (progress.active?.scopeId === scopeId && progress.active.expanded === expanded) progress.active = null;
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch { /* A fresh in-memory round can still be played. */ }
}
