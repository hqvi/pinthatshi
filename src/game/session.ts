export const DATASET = 'natural-earth-5.1.2-pinthatshi-1';
export type Answer = { id: string; mistakes: number; hinted: boolean; skipped: boolean };
export type Session = {
  version: 1; dataset: string; id: string; scopeId: string; expanded: boolean; review: boolean;
  order: string[]; answers: Answer[]; mistakes: number; hinted: boolean; elapsedMs: number;
  status: 'playing' | 'complete';
};

export function createSession(ids: string[], scopeId: string, expanded: boolean, id: string, review = false, random = Math.random): Session {
  const order = [...new Set(ids)];
  if (!order.length) throw new Error('A round needs at least one place');
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return { version: 1, dataset: DATASET, id, scopeId, expanded, review, order, answers: [], mistakes: 0, hinted: false, elapsedMs: 0, status: 'playing' };
}
export const targetId = (session: Session) => session.order[session.answers.length];
export function answer(session: Session, id: string | null, skip = false): Session {
  if (session.status !== 'playing' || (!skip && (!id || session.answers.some(a => a.id === id)))) return session;
  if (!skip && id !== targetId(session)) return { ...session, mistakes: session.mistakes + 1 };
  const answers = [...session.answers, { id: targetId(session), mistakes: session.mistakes, hinted: session.hinted, skipped: skip }];
  return { ...session, answers, mistakes: 0, hinted: false, status: answers.length === session.order.length ? 'complete' : 'playing' };
}
export const hint = (session: Session): Session => session.status === 'playing' && !session.hinted ? { ...session, hinted: true } : session;
export const addTime = (session: Session, ms: number): Session => session.status === 'playing' && Number.isFinite(ms) && ms > 0 ? { ...session, elapsedMs: session.elapsedMs + ms } : session;
export function summarize(session: Session) {
  const found = session.answers.filter(a => !a.skipped).length;
  const mistakes = session.answers.reduce((sum, a) => sum + a.mistakes, 0);
  const hints = session.answers.filter(a => a.hinted).length;
  const skipped = session.answers.filter(a => a.skipped).length;
  const firstTry = session.answers.filter(a => !a.skipped && !a.hinted && !a.mistakes).length;
  return { found, mistakes, hints, skipped, firstTry, perfect: session.status === 'complete' && firstTry === session.order.length, reviewIds: session.answers.filter(a => a.skipped || a.hinted || a.mistakes > 0).map(a => a.id) };
}
export function isSession(value: unknown): value is Session {
  if (!value || typeof value !== 'object') return false;
  const s = value as Session;
  const count = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  if (s.version !== 1 || s.dataset !== DATASET || typeof s.id !== 'string' || typeof s.scopeId !== 'string' || typeof s.expanded !== 'boolean' || typeof s.review !== 'boolean' || !count(s.elapsedMs) || !Number.isInteger(s.mistakes) || s.mistakes < 0 || typeof s.hinted !== 'boolean') return false;
  if (!Array.isArray(s.order) || !s.order.length || s.order.length > 500 || s.order.some(id => typeof id !== 'string') || new Set(s.order).size !== s.order.length || !Array.isArray(s.answers) || s.answers.length > s.order.length) return false;
  if (s.status !== (s.answers.length === s.order.length ? 'complete' : 'playing')) return false;
  return s.answers.every((a, i) => a && a.id === s.order[i] && Number.isInteger(a.mistakes) && a.mistakes >= 0 && typeof a.hinted === 'boolean' && typeof a.skipped === 'boolean');
}
export function canResume(session: Session | null, ids: string[], scopeId: string, expanded: boolean): session is Session {
  if (!session || !isSession(session) || session.scopeId !== scopeId || session.expanded !== expanded) return false;
  const pool = new Set(ids);
  return session.order.every(id => pool.has(id)) && (session.review || session.order.length === pool.size);
}
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
