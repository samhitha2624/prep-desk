/*
 * Study progress, saved in localStorage separately for guests and for each account.
 * Signed-in learners also sync it to the API, so it follows them to other devices.
 * Shape: { read: { "subject/topic": timestamp }, last: "subject/topic" | null, days: ["YYYY-MM-DD"] }
 */
import { backend } from './backend/index.js';

const GUEST_KEY = 'prepdesk.progress.v1';

let storeKey = GUEST_KEY;
let userId = null;
let pushTimer = null;
let state = load(GUEST_KEY);

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { read: {}, last: null, days: [], ...JSON.parse(raw) };
  } catch {}
  return null;
}

function save() {
  try {
    localStorage.setItem(storeKey, JSON.stringify(state));
  } catch {}
  if (userId) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => backend?.saveProgress(state).catch(() => {}), 800);
  }
}

const empty = () => ({ read: {}, last: null, days: [] });
state = state || empty();

// Switches progress to the given account (or back to guest with null).
// The first time an account is used on this browser, it starts with the guest's progress.
export function useProgressFor(id) {
  clearTimeout(pushTimer);
  userId = id || null;
  storeKey = userId ? `${GUEST_KEY}.${userId}` : GUEST_KEY;
  state = load(storeKey) || (userId ? load(GUEST_KEY) : null) || empty();
  if (userId) save();
}

// Merges the account's saved progress from the API into this browser's copy, then saves the result both ways.
export async function syncProgress() {
  if (!userId) return;
  const id = userId;
  const remote = await backend.loadProgress().catch(() => null);
  if (!remote || id !== userId) return;
  const read = { ...remote.read };
  for (const [k, ts] of Object.entries(state.read)) read[k] = Math.max(ts, read[k] || 0);
  const days = [...new Set([...remote.days, ...state.days])].sort().slice(-60);
  state = { read, days, last: state.last || remote.last };
  save();
}

const dayKey = (d) => d.toISOString().slice(0, 10);
const topicKey = (s, t) => `${s}/${t}`;

export function recordActivity() {
  const d = dayKey(new Date());
  if (!state.days.includes(d)) state.days = [...state.days, d].slice(-60);
  save();
}

export function streak() {
  const days = new Set(state.days);
  const cur = new Date();
  if (!days.has(dayKey(cur))) cur.setDate(cur.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(cur))) {
    n++;
    cur.setDate(cur.getDate() - 1);
  }
  return n;
}

export function isRead(subjectId, topicId) {
  return Boolean(state.read[topicKey(subjectId, topicId)]);
}

export function toggleRead(subjectId, topicId) {
  const k = topicKey(subjectId, topicId);
  if (state.read[k]) delete state.read[k];
  else state.read[k] = Date.now();
  recordActivity();
  return Boolean(state.read[k]);
}

export function setLastTopic(subjectId, topicId) {
  state.last = topicKey(subjectId, topicId);
  recordActivity();
}

export function lastTopic() {
  if (!state.last) return null;
  const [subjectId, topicId] = state.last.split('/');
  return { subjectId, topicId };
}

export function subjectStats(subject) {
  const total = subject.topics.length;
  const ready = subject.topics.filter((t) => t.synopsis?.length).length;
  const done = subject.topics.filter((t) => isRead(subject.id, t.id)).length;
  return { total, ready, done, pct: total ? Math.round((done / total) * 100) : 0 };
}
