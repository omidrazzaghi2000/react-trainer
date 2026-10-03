// Learner progress, persisted in localStorage. Every write goes through
// `commit()`, which saves, re-checks badges/levels and notifies subscribers.

const KEY = 'reacttr.progress.v1';
const DRAFT_PREFIX = 'reacttr.draft.';
const PREF_PREFIX = 'reacttr.pref.';

export const XP = {
  learned: 20,
  quizPoint: 10, // per question improved over the previous best
  quizPerfect: 15,
  exercise: 50,
  trainingCorrect: 3,
  firstRun: 5,
};

// Cumulative XP needed to reach level i+1 (index 0 = level 1).
const LEVEL_XP = [0, 100, 250, 450, 700, 1000, 1400, 1900];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaults() {
  return {
    v: 1,
    xp: 0,
    learned: {},
    awardedLearned: {},
    quiz: {},
    exercises: {},
    runs: 0,
    training: { sessions: 0, answered: 0, correct: 0, bestStreak: 0, matchPerfect: 0 },
    streak: { last: null, count: 0, best: 0 },
    badges: {},
  };
}

function isValid(data) {
  return data && typeof data === 'object' && data.v === 1 && typeof data.xp === 'number' && data.learned && data.quiz && data.exercises;
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const data = JSON.parse(raw);
    return isValid(data) ? { ...defaults(), ...data, training: { ...defaults().training, ...data.training }, streak: { ...defaults().streak, ...data.streak } } : defaults();
  } catch {
    return defaults();
  }
}

let state = read();
let lessons = []; // summaries, set by init()
const listeners = new Set();

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: progress lives for this session only */
  }
}

// ------------------------------------------------------------------ badges
const BADGES = [
  { id: 'first-steps', icon: 'footprints', tone: 'indigo', test: (s) => Object.keys(s.learned).length >= 1 },
  { id: 'hello-react', icon: 'atom', tone: 'teal', test: (s) => s.runs >= 1 },
  { id: 'sprout', icon: 'sprout', tone: 'green', test: (s) => allLearned(s, 'beginner') },
  { id: 'hook-hero', icon: 'rocket', tone: 'blue', test: (s) => allLearned(s, 'intermediate') },
  { id: 'architect', icon: 'layers', tone: 'violet', test: (s) => allLearned(s, 'advanced') },
  { id: 'elite', icon: 'crown', tone: 'amber', test: (s) => allLearned(s, 'elite') },
  { id: 'quiz-ace', icon: 'medal', tone: 'amber', test: (s) => Object.values(s.quiz).filter((q) => q.best === q.total).length >= 10 },
  { id: 'test-driven', icon: 'flask-conical', tone: 'teal', test: (s) => Object.keys(s.exercises).length >= 5 },
  { id: 'matchmaker', icon: 'target', tone: 'pink', test: (s) => s.training.matchPerfect >= 1 },
  { id: 'on-fire', icon: 'flame', tone: 'red', test: (s) => s.streak.best >= 3 },
  { id: 'grandmaster', icon: 'trophy', tone: 'green', test: (s) => lessons.length > 0 && lessons.every((l) => s.exercises[l.id]) },
];

function allLearned(s, category) {
  const list = lessons.filter((l) => l.category === category);
  return list.length > 0 && list.every((l) => s.learned[l.id]);
}

export function badgeList() {
  return BADGES.map((b) => ({ ...b, unlocked: Boolean(state.badges[b.id]), at: state.badges[b.id] || null }));
}

// ------------------------------------------------------------------ levels
export function levelInfo(xp = state.xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i++) if (xp >= LEVEL_XP[i]) level = i + 1;
  const floor = LEVEL_XP[level - 1];
  const ceil = LEVEL_XP[level] ?? null;
  const pct = ceil === null ? 100 : Math.round(((xp - floor) / (ceil - floor)) * 100);
  return { level, xp, floor, ceil, pct, toNext: ceil === null ? 0 : ceil - xp, max: ceil === null };
}

// ------------------------------------------------------------------ core
/** Applies a mutation, awards XP, and reports what changed ({ xp, badges, levelUp }). */
function commit(mutator) {
  const beforeLevel = levelInfo().level;
  const beforeXp = state.xp;
  mutator(state);
  touchStreak();
  const unlocked = [];
  for (const b of BADGES) {
    if (!state.badges[b.id] && b.test(state)) {
      state.badges[b.id] = Date.now();
      unlocked.push(b);
    }
  }
  write();
  const after = levelInfo();
  const change = { xp: state.xp - beforeXp, badges: unlocked, levelUp: after.level > beforeLevel ? after.level : null };
  listeners.forEach((fn) => fn(state, change));
  return change;
}

function touchStreak() {
  const d = today();
  const s = state.streak;
  if (s.last === d) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  s.count = s.last === yesterday ? s.count + 1 : 1;
  s.best = Math.max(s.best, s.count);
  s.last = d;
}

export const store = {
  init(summaries) {
    lessons = summaries;
    // Silently catch up on badges that became reachable (e.g. new lessons).
    for (const b of BADGES) if (!state.badges[b.id] && b.test(state)) state.badges[b.id] = Date.now();
    write();
  },
  get: () => state,
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  isLearned: (id) => Boolean(state.learned[id]),
  quizBest: (id) => state.quiz[id] || null,
  isSolved: (id) => Boolean(state.exercises[id]),

  toggleLearned(id) {
    return commit((s) => {
      if (s.learned[id]) {
        delete s.learned[id]; // XP already earned is kept
      } else {
        s.learned[id] = Date.now();
        if (!s.awardedLearned[id]) {
          s.awardedLearned[id] = true;
          s.xp += XP.learned;
        }
      }
    });
  },

  recordQuiz(id, score, total) {
    return commit((s) => {
      const prev = s.quiz[id];
      const prevBest = prev ? prev.best : 0;
      if (score > prevBest) s.xp += (score - prevBest) * XP.quizPoint;
      if (score === total && !(prev && prev.best === total)) s.xp += XP.quizPerfect;
      s.quiz[id] = { best: Math.max(prevBest, score), total, attempts: (prev ? prev.attempts : 0) + 1, last: score };
    });
  },

  recordExercise(id) {
    return commit((s) => {
      if (!s.exercises[id]) {
        s.exercises[id] = Date.now();
        s.xp += XP.exercise;
      }
    });
  },

  recordRun() {
    return commit((s) => {
      if (s.runs === 0) s.xp += XP.firstRun;
      s.runs += 1;
    });
  },

  recordTraining({ mode, correct, total, bestStreak }) {
    return commit((s) => {
      s.training.sessions += 1;
      s.training.answered += total;
      s.training.correct += correct;
      s.training.bestStreak = Math.max(s.training.bestStreak, bestStreak || 0);
      if (mode === 'match' && total >= 10 && correct === total) s.training.matchPerfect += 1;
      s.xp += correct * XP.trainingCorrect;
    });
  },

  export() {
    return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
  },

  import(json) {
    const data = JSON.parse(json);
    if (!isValid(data)) throw new Error('invalid');
    delete data.exportedAt;
    state = { ...defaults(), ...data };
    return commit(() => {});
  },

  reset() {
    state = defaults();
    try {
      Object.keys(localStorage).filter((k) => k.startsWith(DRAFT_PREFIX)).forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    write();
    listeners.forEach((fn) => fn(state, { xp: 0, badges: [], levelUp: null }));
  },

  // Small UI preferences (e.g. auto-run), kept across sessions.
  pref(key, fallback) {
    try {
      const v = localStorage.getItem(PREF_PREFIX + key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  setPref(key, value) {
    try {
      localStorage.setItem(PREF_PREFIX + key, JSON.stringify(value));
    } catch { /* ignore */ }
  },

  // Unsaved code drafts (exercise editors, playground)
  loadDraft(key) {
    try {
      return localStorage.getItem(DRAFT_PREFIX + key);
    } catch {
      return null;
    }
  },
  saveDraft(key, code) {
    try {
      localStorage.setItem(DRAFT_PREFIX + key, code);
    } catch { /* ignore */ }
  },
  clearDraft(key) {
    try {
      localStorage.removeItem(DRAFT_PREFIX + key);
    } catch { /* ignore */ }
  },
};
