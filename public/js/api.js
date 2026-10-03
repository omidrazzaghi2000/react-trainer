// Data access for the app. Two modes, chosen by <meta name="app-mode">:
//   server – the Node/Express API
//   static – pre-built JSON files (the GitHub Pages build, see scripts/build-static.js)
// Either way, code never goes to a server: it runs in the browser sandbox.

import { shuffle } from './util.js';

export const isStatic = document.querySelector('meta[name="app-mode"]')?.content === 'static';

const cache = new Map();

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function cached(url) {
  if (!cache.has(url)) {
    cache.set(url, request(url).catch((e) => {
      cache.delete(url);
      throw e;
    }));
  }
  return cache.get(url);
}

const id = (s) => encodeURIComponent(s);
const CATEGORY_IDS = ['beginner', 'intermediate', 'advanced', 'elite'];
const clamp = (v, fallback) => Math.min(40, Math.max(1, Number.parseInt(v, 10) || fallback));

function pick(training, categories) {
  const wanted = String(categories || '').split(',').filter((c) => CATEGORY_IDS.includes(c));
  return wanted.length ? training.filter((t) => wanted.includes(t.lesson.category)) : training;
}

/** Same behaviour as GET /api/training/quiz on the Node server. */
function makeQuiz(training, params) {
  const pool = [];
  for (const t of pick(training, params.categories)) t.quiz.forEach((q, i) => pool.push({ t, q, i }));
  return shuffle(pool).slice(0, clamp(params.count, 10)).map(({ t, q, i }) => {
    const order = shuffle([0, 1, 2, 3]);
    return {
      key: `${t.lesson.id}:${i}`,
      lesson: t.lesson,
      question: q.question,
      options: { en: order.map((k) => q.options.en[k]), fa: order.map((k) => q.options.fa[k]) },
      answer: order.indexOf(q.answer),
      explanation: q.explanation,
    };
  });
}

/** Same behaviour as GET /api/training/match on the Node server. */
function makeMatch(training, params) {
  const all = training.map((t) => t.lesson);
  const pool = [];
  for (const t of pick(training, params.categories)) t.scenarios.forEach((s) => pool.push({ l: t.lesson, s }));
  return shuffle(pool).slice(0, clamp(params.count, 10)).map(({ l, s }) => {
    const same = shuffle(all.filter((o) => o.id !== l.id && o.category === l.category));
    const other = shuffle(all.filter((o) => o.id !== l.id && o.category !== l.category));
    const options = shuffle([l, ...[...same.slice(0, 2), ...other].slice(0, 3)]);
    return { scenario: s, options, answer: options.findIndex((o) => o.id === l.id), lesson: l };
  });
}

const serverApi = {
  meta: () => cached('api/meta'),
  lessons: () => cached('api/lessons'),
  lesson: (l) => cached(`api/lessons/${id(l)}`),
  solution: (l) => request(`api/lessons/${id(l)}/solution`),
  quiz: (params) => request(`api/training/quiz?${new URLSearchParams(params)}`),
  match: (params) => request(`api/training/match?${new URLSearchParams(params)}`),
};

const staticApi = {
  meta: () => cached('api/meta.json'),
  lessons: () => cached('api/lessons.json'),
  lesson: (l) => cached(`api/lessons/${id(l)}.json`).catch((e) => {
    // GitHub Pages answers unknown files with a 404 HTML page; keep the "not found" semantics.
    throw Object.assign(e, { status: 404 });
  }),
  solution: (l) => cached(`api/lessons/${id(l)}/solution.json`),
  quiz: async (params) => makeQuiz(await cached('api/training.json'), params),
  match: async (params) => makeMatch(await cached('api/training.json'), params),
};

export const api = isStatic ? staticApi : serverApi;
