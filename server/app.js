'use strict';

const path = require('path');
const express = require('express');
const content = require('./content');
const { buildSprite } = require('./icons');
const { reactBundle, reactVersion } = require('./bundle');
const { collectTestNames } = require('./checks');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const MODULES = path.join(ROOT, 'node_modules');

const APP_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // CodeMirror positions elements with inline styles
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const BASE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

/**
 * The preview sandbox runs learner code in an iframe with an opaque origin
 * (sandbox="allow-scripts allow-forms allow-modals", no allow-same-origin), so
 * it cannot touch the app, its storage or cookies. Its CSP names the server
 * origin explicitly because 'self' is ambiguous for opaque-origin documents,
 * allows blob: scripts (how learner modules are loaded, with exact line
 * numbers) and blocks every network request and real form navigation.
 */
function sandboxCsp(origin) {
  return [
    "default-src 'none'",
    `script-src ${origin} blob: 'unsafe-eval'`,
    `style-src ${origin} 'unsafe-inline'`,
    `img-src ${origin} data: blob:`,
    `font-src ${origin} data:`,
    `media-src ${origin} data: blob:`,
    "connect-src 'none'",
    `frame-ancestors ${origin}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

function shuffle(arr, rand = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** @param {{ library?: ReturnType<typeof content.loadLibrary> }} [deps] */
function createApp(deps = {}) {
  const library = deps.library || content.loadLibrary();
  const { categories, lessons, byId } = library;
  const summaries = lessons.map(content.summarize);
  const sprite = buildSprite([...categories.map((c) => c.icon), ...lessons.map((l) => l.icon)]);

  const app = express();
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set(BASE_HEADERS);
    if (req.path !== '/sandbox.html') res.set({ 'Content-Security-Policy': APP_CSP, 'X-Frame-Options': 'DENY' });
    next();
  });

  // ------------------------------------------------------------------ API
  const api = express.Router();

  api.get('/meta', (req, res) => {
    res.json({
      categories,
      lessonCount: lessons.length,
      questionCount: lessons.reduce((n, l) => n + (l.quiz ? l.quiz.length : 0), 0),
      exerciseCount: lessons.filter((l) => l.exercise).length,
      testCount: summaries.reduce((n, s) => n + s.testCount, 0),
      react: reactVersion(),
    });
  });

  api.get('/lessons', (req, res) => res.json(summaries));

  api.get('/lessons/:id', (req, res) => {
    const l = byId.get(req.params.id);
    if (!l) return res.status(404).json({ error: 'Lesson not found' });
    const payload = content.lessonPayload(l, library);
    payload.exercise.checks = collectTestNames(l.sources.tests);
    res.json(payload);
  });

  api.get('/lessons/:id/solution', (req, res) => {
    const l = byId.get(req.params.id);
    if (!l) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ code: l.sources.solution });
  });

  function pickLessons(query) {
    const wanted = String(query.categories || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => content.CATEGORY_IDS.includes(s));
    return wanted.length ? lessons.filter((l) => wanted.includes(l.category)) : lessons;
  }

  // Mixed quiz: random questions, options shuffled consistently for both languages.
  api.get('/training/quiz', (req, res) => {
    const count = clampInt(req.query.count, 1, 40, 10);
    const pool = [];
    for (const l of pickLessons(req.query)) {
      (l.quiz || []).forEach((q, i) => pool.push({ l, q, i }));
    }
    const questions = shuffle(pool).slice(0, count).map(({ l, q, i }) => {
      const order = shuffle([0, 1, 2, 3]);
      return {
        key: `${l.id}:${i}`,
        lesson: content.summarize(l),
        question: q.question,
        options: { en: order.map((k) => q.options.en[k]), fa: order.map((k) => q.options.fa[k]) },
        answer: order.indexOf(q.answer),
        explanation: q.explanation,
      };
    });
    res.json(questions);
  });

  // Concept match: read a scenario, pick the lesson. Distractors prefer the same level.
  api.get('/training/match', (req, res) => {
    const count = clampInt(req.query.count, 1, 40, 10);
    const pool = [];
    for (const l of pickLessons(req.query)) (l.scenarios || []).forEach((s) => pool.push({ l, s }));
    const rounds = shuffle(pool).slice(0, count).map(({ l, s }) => {
      const same = shuffle(lessons.filter((o) => o.id !== l.id && o.category === l.category));
      const other = shuffle(lessons.filter((o) => o.id !== l.id && o.category !== l.category));
      const distractors = [...same.slice(0, 2), ...other].slice(0, 3);
      const options = shuffle([l, ...distractors]).map(content.summarize);
      return { scenario: s, options, answer: options.findIndex((o) => o.id === l.id), lesson: content.summarize(l) };
    });
    res.json(rounds);
  });

  api.use((req, res) => res.status(404).json({ error: 'Not found' }));
  // eslint-disable-next-line no-unused-vars
  api.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
  });

  app.use('/api', api);

  // --------------------------------------------------------------- sandbox + vendor
  app.get('/sandbox.html', (req, res) => {
    const origin = `${req.protocol}://${req.get('host')}`;
    res.set({ 'Content-Security-Policy': sandboxCsp(origin), 'Cache-Control': 'no-cache' });
    res.sendFile(path.join(PUBLIC, 'sandbox.html'));
  });

  app.get('/vendor/react.js', (req, res) => {
    const bundle = reactBundle();
    res.set({ ETag: bundle.etag, 'Cache-Control': 'public, max-age=3600' });
    if (req.headers['if-none-match'] === bundle.etag) return res.status(304).end();
    res.type('application/javascript').send(bundle.code);
  });

  app.get('/icons.svg', (req, res) => {
    res.type('image/svg+xml').set('Cache-Control', 'public, max-age=3600').send(sprite);
  });
  app.use('/vendor/babel', express.static(path.join(MODULES, '@babel', 'standalone'), { maxAge: '7d' }));
  app.use('/vendor/codemirror', express.static(path.join(MODULES, 'codemirror'), { maxAge: '7d' }));
  app.use('/vendor/fonts', express.static(path.join(MODULES, '@fontsource'), { maxAge: '30d' }));
  app.use(express.static(PUBLIC, { extensions: ['html'], index: 'index.html' }));

  return app;
}

module.exports = { createApp, shuffle, sandboxCsp };
