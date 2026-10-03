#!/usr/bin/env node
'use strict';

// Validates lesson content.
//   node scripts/validate-content.js               # every lesson
//   node scripts/validate-content.js use-state context
//   node scripts/validate-content.js --no-run      # schema only
//
// Besides the JSON schema, it renders example.jsx in jsdom (no errors, no
// console.error/warn), runs tests.jsx against solution.jsx (every test must
// pass, with no console.error/warn) and against the untouched exercise.jsx
// starter (it must load, but at least one test must fail).

const { listLessonIds, loadLesson, validateLesson, countTests } = require('../server/content');
const { runJob } = require('../server/verify');

const args = process.argv.slice(2);
const noRun = args.includes('--no-run');
const requested = args.filter((a) => !a.startsWith('--'));

const noisy = (logs) => (logs || []).filter((l) => l.level === 'error' || l.level === 'warn');
const indent = (s) => String(s).trimEnd().split('\n').map((l) => `      ${l}`).join('\n');
const where = (e) => (e && e.line ? ` (line ${e.line}${e.column ? `:${e.column}` : ''})` : '');

async function checkExample(src) {
  const r = await runJob({ mode: 'render', app: src });
  if (!r.ok) {
    const e = r.error || (r.errors && r.errors[0]) || {};
    return [`example.jsx: ${r.stage} failed — ${e.message}${where(e)}${e.stack ? `\n${indent(e.stack)}` : ''}`];
  }
  const bad = noisy(r.logs);
  return bad.length ? [`example.jsx: logged ${bad.length} console error/warning(s):\n${indent(bad.map((l) => `[${l.level}] ${l.text}`).join('\n'))}`] : [];
}

async function checkSolution(src, tests, expected) {
  const r = await runJob({ mode: 'test', app: src, tests });
  if (!r.results) {
    const e = r.error || {};
    return [`solution.jsx: ${r.stage} failed — ${e.message}${where(e)}`];
  }
  const out = [];
  if (r.results.length !== expected) out.push(`tests.jsx: registered ${r.results.length} tests but ${expected} test( calls were counted — keep one test() per top-level call`);
  for (const t of r.results.filter((x) => !x.ok)) out.push(`solution.jsx fails "${t.name.en}":\n${indent(t.error.message)}`);
  const bad = r.results.flatMap((t) => noisy(t.logs).map((l) => `"${t.name.en}" [${l.level}] ${l.text}`));
  if (bad.length) out.push(`solution.jsx: console errors/warnings during tests:\n${indent(bad.join('\n'))}`);
  const unnamed = r.results.filter((t) => !t.name || !t.name.en || !t.name.fa || !/[؀-ۿ]/.test(t.name.fa));
  if (unnamed.length) out.push(`tests.jsx: every test needs a bilingual name { en, fa } (${unnamed.length} missing)`);
  return out;
}

async function checkStarter(src, tests) {
  const r = await runJob({ mode: 'test', app: src, tests });
  if (!r.results) {
    const e = r.error || {};
    return [`exercise.jsx: the starter must transpile and load — ${r.stage} failed: ${e.message}${where(e)}`];
  }
  if (r.results.every((t) => t.ok)) return ['exercise.jsx: the untouched starter already passes every test — the challenge needs work to pass'];
  return [];
}

(async () => {
  const all = listLessonIds();
  const ids = requested.length ? requested : all;
  const known = new Set(all);
  const missing = ids.filter((id) => !known.has(id));
  if (missing.length) {
    console.error(`Unknown lesson id(s): ${missing.join(', ')}`);
    process.exit(2);
  }

  let failed = 0;
  await Promise.all(ids.map(async (id) => {
    let l;
    const errors = [];
    let warnings = [];
    try {
      l = loadLesson(id);
      const v = validateLesson(l, { knownIds: known });
      errors.push(...v.errors);
      warnings = v.warnings;
    } catch (e) {
      errors.push(`cannot load: ${e.message}`);
    }
    if (l && !noRun && l.sources) {
      const s = l.sources;
      const [a, b, c] = await Promise.all([
        s.example ? checkExample(s.example) : [],
        s.solution && s.tests ? checkSolution(s.solution, s.tests, countTests(s.tests)) : [],
        s.exercise && s.tests ? checkStarter(s.exercise, s.tests) : [],
      ]);
      errors.push(...a, ...b, ...c);
    }
    return { id, errors, warnings };
  })).then((reports) => {
    for (const { id, errors, warnings } of reports) {
      if (errors.length) failed++;
      const status = errors.length ? 'FAIL' : warnings.length ? 'WARN' : ' OK ';
      console.log(`[${status}] ${id}`);
      for (const e of errors) console.log(`   ✗ ${e}`);
      for (const w of warnings) console.log(`   ! ${w}`);
    }
  });
  console.log(`\n${ids.length - failed}/${ids.length} lessons valid.`);
  process.exit(failed ? 1 : 0);
})();
