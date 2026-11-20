import { DATASET, isSession, summarize, type Session } from './session.ts';

const KEY = 'pinthatshi.progress.v1';
type RecordEntry = { runs: number; perfectBestMs: number | null };
export type Progress = { version: 1; active: Session | null; records: Record<string, RecordEntry>; recordedIds: string[] };
type Store = Pick<Storage, 'getItem' | 'setItem'>;
const empty = (): Progress => ({ version: 1, active: null, records: {}, recordedIds: [] });
export const recordKey = (scopeId: string, expanded: boolean) => `${DATASET}:find-countries:map:${scopeId}:${expanded ? 'areas' : 'countries'}`;
export function readProgress(store?: Store): Progress {
  try {
    const raw = (store ?? localStorage).getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Progress;
    if (parsed.version !== 1 || !parsed.records || typeof parsed.records !== 'object' || !Array.isArray(parsed.recordedIds)) return empty();
    const records: Progress['records'] = {};
    for (const [key, entry] of Object.entries(parsed.records)) if (entry && Number.isInteger(entry.runs) && entry.runs >= 0 && (entry.perfectBestMs === null || (Number.isFinite(entry.perfectBestMs) && entry.perfectBestMs >= 0))) records[key] = entry;
    return { version: 1, active: isSession(parsed.active) ? parsed.active : null, records, recordedIds: parsed.recordedIds.filter(id => typeof id === 'string').slice(-100) };
  } catch { return empty(); }
}
export function writeSession(session: Session | null, store?: Store): boolean {
  try {
    const storage = store ?? localStorage;
    const progress = readProgress(storage);
    progress.active = session;
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
