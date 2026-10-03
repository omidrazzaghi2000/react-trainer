'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp, sandboxCsp } = require('../server/app');
const { loadLibrary, validateLesson, CATEGORY_IDS } = require('../server/content');
const { collectTestNames } = require('../server/checks');
const { runJob } = require('../server/verify');

const library = loadLibrary();
const EXPECTED_LESSONS = 32;
let server;
let base;

before(async () => {
  const app = createApp({ library });
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

const get = (path) => fetch(base + path);

test('content library loads every lesson without schema errors or warnings', () => {
  assert.equal(library.lessons.length, EXPECTED_LESSONS);
  const known = new Set(library.byId.keys());
  for (const l of library.lessons) {
    const { errors, warnings } = validateLesson(l, { knownIds: known });
    assert.deepEqual(errors, [], `${l.id} has schema errors`);
    assert.deepEqual(warnings, [], `${l.id} has warnings`);
  }
});

test('every level has eight lessons with orders 1..8 and ids are unique', () => {
  for (const c of CATEGORY_IDS) {
    const orders = library.lessons.filter((l) => l.category === c).map((l) => l.order).sort((a, b) => a - b);
    assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7, 8], `level ${c}`);
  }
  assert.equal(new Set(library.lessons.map((l) => l.id)).size, library.lessons.length);
});

test('every tests.jsx exposes bilingual test names', () => {
  for (const l of library.lessons) {
    const names = collectTestNames(l.sources.tests);
    assert.ok(names && names.length >= 3, `${l.id}: could not read test names`);
    for (const n of names) assert.ok(n.en && /[؀-ۿ]/.test(n.fa), `${l.id}: "${n.en}" needs an en + fa name`);
  }
});

test('GET /api/meta reports counts and the React version', async () => {
  const meta = await (await get('/api/meta')).json();
  assert.equal(meta.lessonCount, EXPECTED_LESSONS);
  assert.equal(meta.questionCount, EXPECTED_LESSONS * 4);
  assert.equal(meta.exerciseCount, EXPECTED_LESSONS);
  assert.ok(meta.testCount >= EXPECTED_LESSONS * 3);
  assert.equal(meta.categories.length, 4);
  assert.match(meta.react, /^19\./);
});

test('GET /api/lessons returns bilingual summaries without sources', async () => {
  const list = await (await get('/api/lessons')).json();
  assert.equal(list.length, EXPECTED_LESSONS);
  for (const s of list) {
    assert.ok(s.name.en && s.name.fa && s.tagline.en && s.tagline.fa);
    assert.equal(s.sources, undefined);
    assert.ok(s.testCount >= 3);
  }
});

test('GET /api/lessons/:id has example, starter, tests and checks but never the solution', async () => {
  const res = await get('/api/lessons/use-state');
  assert.equal(res.status, 200);
  const l = await res.json();
  assert.match(l.example.code, /useState\('medium'\)/);
  assert.match(l.exercise.starter, /TODO 1/);
  assert.match(l.exercise.tests, /test\(/);
  assert.equal(l.exercise.checks.length, 5);
  assert.equal(l.exercise.checks[0].en, 'Both counters start at "Steps: 0"');
  assert.equal(l.sources, undefined);
  assert.equal(JSON.stringify(l).includes(library.byId.get('use-state').sources.solution), false);
  assert.equal(l.prev.id, 'components-props');
  assert.equal(l.next.id, 'events');
});

test('unknown lesson → 404; solution endpoint serves the reference solution', async () => {
  assert.equal((await get('/api/lessons/nope')).status, 404);
  const { code } = await (await get('/api/lessons/use-state/solution')).json();
  assert.equal(code, library.byId.get('use-state').sources.solution);
});

test('training quiz shuffles options consistently in both languages', async () => {
  const qs = await (await get('/api/training/quiz?count=40&categories=beginner')).json();
  assert.equal(qs.length, 32); // 8 beginner lessons × 4 questions
  for (const q of qs) {
    assert.equal(q.lesson.category, 'beginner');
    const [id, idx] = q.key.split(':');
    const original = library.byId.get(id).quiz[Number(idx)];
    assert.equal(q.options.en[q.answer], original.options.en[original.answer]);
    assert.equal(q.options.fa[q.answer], original.options.fa[original.answer]);
  }
});

test('concept match rounds contain the answer exactly once among 4 distinct options', async () => {
  const rounds = await (await get('/api/training/match?count=12')).json();
  assert.equal(rounds.length, 12);
  for (const r of rounds) {
    assert.equal(r.options.length, 4);
    assert.equal(new Set(r.options.map((o) => o.id)).size, 4);
    assert.equal(r.options[r.answer].id, r.lesson.id);
  }
});

test('app pages get a strict CSP; the sandbox gets an isolated one', async () => {
  const res = await get('/');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /script-src 'self'(;|$)/);
  assert.equal(res.headers.get('x-frame-options'), 'DENY');

  const sb = await get('/sandbox.html');
  assert.equal(sb.status, 200);
  const csp = sb.headers.get('content-security-policy');
  assert.match(csp, /connect-src 'none'/);
  assert.match(csp, /form-action 'none'/);
  assert.match(csp, /frame-ancestors http:\/\/127\.0\.0\.1:\d+/);
  assert.equal(sb.headers.get('x-frame-options'), null);
  assert.equal(sandboxCsp('http://x').includes("default-src 'none'"), true);
});

test('vendor assets are served: React bundle, Babel, CodeMirror JSX mode, fonts, icons', async () => {
  const react = await get('/vendor/react.js');
  assert.equal(react.status, 200);
  const code = await react.text();
  assert.match(code, /__TRAINER_MODULES__/);
  assert.equal((await get('/vendor/react.js', {})).headers.get('etag'), react.headers.get('etag'));
  assert.equal((await get('/vendor/babel/babel.min.js')).status, 200);
  assert.equal((await get('/vendor/codemirror/mode/jsx/jsx.js')).status, 200);
  assert.equal((await get('/vendor/fonts/vazirmatn/400.css')).status, 200);
  const sprite = await (await get('/icons.svg')).text();
  for (const l of library.lessons) assert.ok(sprite.includes(`id="i-${l.icon}"`), `icon ${l.icon} missing from sprite`);
});

test('jsdom round-trip: the reference solution passes, the starter fails, errors are located', async () => {
  const l = library.byId.get('use-state');
  const pass = await runJob({ mode: 'test', app: l.sources.solution, tests: l.sources.tests });
  assert.equal(pass.ok, true);
  assert.equal(pass.results.length, 5);

  const fail = await runJob({ mode: 'test', app: l.sources.exercise, tests: l.sources.tests });
  assert.equal(fail.ok, false);
  assert.ok(fail.results.some((r) => !r.ok));

  const syntax = await runJob({ mode: 'render', app: 'export default function App() {\n  return <div>;\n}' });
  assert.equal(syntax.stage, 'transpile');
  assert.equal(syntax.error.line, 2);

  const loop = await runJob({ mode: 'render', app: 'export default function App() {\n  while (true) {}\n}' });
  assert.equal(loop.ok, false);
  assert.match(loop.errors[0].message, /infinite loop on line 2/);
});
