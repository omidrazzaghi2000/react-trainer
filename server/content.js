'use strict';

// Loads the lesson library from content/ and validates it against the schema
// documented in CONTENT_SPEC.md.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const LESSONS_DIR = path.join(CONTENT_DIR, 'lessons');
const ICONS_DIR = path.join(ROOT, 'node_modules', 'lucide-static', 'icons');

const CATEGORY_IDS = ['beginner', 'intermediate', 'advanced', 'elite'];
const NODE_KINDS = ['component', 'hook', 'state', 'context', 'external', 'note'];
const EDGE_TYPES = ['renders', 'props', 'callback', 'uses', 'provides', 'subscribes', 'updates', 'triggers'];
const LANGS = ['en', 'fa'];
const PERSIAN_RE = /[؀-ۿ]/;
const FILES = { example: 'example.jsx', exercise: 'exercise.jsx', solution: 'solution.jsx', tests: 'tests.jsx' };

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadCategories() {
  return readJson(path.join(CONTENT_DIR, 'categories.json')).sort((a, b) => a.order - b.order);
}

function listLessonIds() {
  if (!fs.existsSync(LESSONS_DIR)) return [];
  return fs
    .readdirSync(LESSONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(LESSONS_DIR, d.name, 'lesson.json')))
    .map((d) => d.name);
}

function readSource(id, file) {
  const p = path.join(LESSONS_DIR, id, file);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function loadLesson(id) {
  const data = readJson(path.join(LESSONS_DIR, id, 'lesson.json'));
  const sources = {};
  for (const [key, file] of Object.entries(FILES)) sources[key] = readSource(id, file);
  return { ...data, sources };
}

/** Loads every lesson; returns { categories, lessons (ordered array), byId (Map), problems }. */
function loadLibrary() {
  const categories = loadCategories();
  const catOrder = Object.fromEntries(categories.map((c) => [c.id, c.order]));
  const problems = [];
  const lessons = [];
  for (const id of listLessonIds()) {
    try {
      lessons.push(loadLesson(id));
    } catch (err) {
      problems.push({ id, errors: [`failed to load: ${err.message}`], warnings: [] });
    }
  }
  lessons.sort((a, b) => (catOrder[a.category] ?? 99) - (catOrder[b.category] ?? 99) || (a.order ?? 99) - (b.order ?? 99) || a.id.localeCompare(b.id));
  const byId = new Map(lessons.map((l) => [l.id, l]));
  for (const l of lessons) {
    const { errors, warnings } = validateLesson(l, { knownIds: new Set(byId.keys()) });
    if (errors.length || warnings.length) problems.push({ id: l.id, errors, warnings });
  }
  return { categories, lessons, byId, problems };
}

function countTests(source) {
  return source ? (source.match(/^\s*(?:test|it)\(/gm) || []).length : 0;
}

function summarize(l) {
  return {
    id: l.id,
    category: l.category,
    order: l.order,
    icon: l.icon,
    name: l.name,
    tagline: l.tagline,
    intent: l.intent,
    quizCount: Array.isArray(l.quiz) ? l.quiz.length : 0,
    testCount: countTests(l.sources && l.sources.tests),
    exerciseTitle: l.exercise ? l.exercise.title : null,
  };
}

/** The JSON a lesson page receives: content + example code + starter + tests (never the solution). */
function lessonPayload(l, { lessons, byId }) {
  const idx = lessons.indexOf(l);
  const { sources, ...rest } = l;
  return {
    ...rest,
    example: { ...l.example, code: sources.example },
    exercise: { ...l.exercise, starter: sources.exercise, tests: sources.tests },
    prev: idx > 0 ? summarize(lessons[idx - 1]) : null,
    next: idx < lessons.length - 1 ? summarize(lessons[idx + 1]) : null,
    related: (l.related || []).map((r) => ({ ...r, lesson: byId.has(r.id) ? summarize(byId.get(r.id)) : null })),
  };
}

// ---------------------------------------------------------------- validation

function validateLesson(l, { knownIds = null } = {}) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  const text = (value, where, { max } = {}) => {
    if (!value || typeof value !== 'object') return err(`${where}: expected { en, fa } object`);
    for (const lang of LANGS) {
      if (typeof value[lang] !== 'string' || !value[lang].trim()) err(`${where}.${lang}: missing text`);
      else if (max && value[lang].length > max) warn(`${where}.${lang}: longer than ${max} chars`);
    }
    if (typeof value.fa === 'string' && value.fa.trim() && !PERSIAN_RE.test(value.fa)) err(`${where}.fa: contains no Persian text`);
  };

  const list = (value, where, { min = 1, max = 8 } = {}) => {
    if (!value || typeof value !== 'object') return err(`${where}: expected { en: [], fa: [] }`);
    for (const lang of LANGS) {
      const arr = value[lang];
      if (!Array.isArray(arr)) { err(`${where}.${lang}: expected array`); continue; }
      if (arr.length < min || arr.length > max) err(`${where}.${lang}: expected ${min}-${max} items, got ${arr.length}`);
      arr.forEach((s, i) => { if (typeof s !== 'string' || !s.trim()) err(`${where}.${lang}[${i}]: empty`); });
    }
    if (Array.isArray(value.en) && Array.isArray(value.fa) && value.en.length !== value.fa.length) {
      err(`${where}: en has ${value.en.length} items but fa has ${value.fa.length}`);
    }
    if (Array.isArray(value.fa) && value.fa.some((s) => typeof s === 'string' && !PERSIAN_RE.test(s))) err(`${where}.fa: an item contains no Persian text`);
  };

  if (typeof l.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.id)) err('id: must be kebab-case');
  if (!CATEGORY_IDS.includes(l.category)) err(`category: must be one of ${CATEGORY_IDS.join(', ')}`);
  if (!Number.isInteger(l.order) || l.order < 1) err('order: positive integer required');
  if (typeof l.icon !== 'string' || !fs.existsSync(path.join(ICONS_DIR, `${l.icon}.svg`))) err(`icon: "${l.icon}" is not a lucide-static icon`);

  text(l.name, 'name', { max: 40 });
  if (l.aka) text(l.aka, 'aka');
  text(l.tagline, 'tagline', { max: 90 });
  text(l.intent, 'intent', { max: 320 });
  text(l.problem, 'problem');
  text(l.solution, 'solution');
  text(l.analogy, 'analogy');
  list(l.steps, 'steps', { min: 3, max: 7 });
  list(l.whenToUse, 'whenToUse', { min: 2, max: 6 });
  list(l.bestPractices, 'bestPractices', { min: 2, max: 6 });
  list(l.pitfalls, 'pitfalls', { min: 2, max: 6 });
  list(l.proTips, 'proTips', { min: 2, max: 6 });
  list(l.realWorld, 'realWorld', { min: 1, max: 5 });

  // key APIs / concepts
  if (!Array.isArray(l.concepts) || l.concepts.length < 2 || l.concepts.length > 7) err('concepts: 2-7 entries required');
  else l.concepts.forEach((c, i) => {
    if (typeof c.name !== 'string' || !c.name.trim()) err(`concepts[${i}].name: missing`);
    else if (c.name.length > 48) warn(`concepts[${i}].name: longer than 48 chars`);
    text(c.role, `concepts[${i}].role`);
  });

  // diagram
  const d = l.diagram;
  if (!d || !Array.isArray(d.nodes) || !Array.isArray(d.edges)) err('diagram: { nodes: [], edges: [] } required');
  else {
    const ids = new Set();
    const cells = new Set();
    d.nodes.forEach((n, i) => {
      const w = `diagram.nodes[${i}]`;
      if (typeof n.id !== 'string' || !n.id) err(`${w}.id: missing`);
      else if (ids.has(n.id)) err(`${w}.id: duplicate "${n.id}"`);
      else ids.add(n.id);
      if (!NODE_KINDS.includes(n.kind)) err(`${w}.kind: must be one of ${NODE_KINDS.join(', ')}`);
      if (!Number.isInteger(n.col) || n.col < 0 || n.col > 3) err(`${w}.col: integer 0-3`);
      if (!Number.isInteger(n.row) || n.row < 0 || n.row > 3) err(`${w}.row: integer 0-3`);
      const cell = `${n.col},${n.row}`;
      if (cells.has(cell)) err(`${w}: cell (${cell}) already used by another node`);
      cells.add(cell);
      if (n.members !== undefined) {
        if (!Array.isArray(n.members) || n.members.length > 4) err(`${w}.members: array of at most 4 strings`);
        else n.members.forEach((m, j) => { if (typeof m !== 'string' || m.length > 30) err(`${w}.members[${j}]: string of at most 30 chars`); });
      }
      const label = n.label || n.id;
      if (typeof label === 'string' && label.length > 22) warn(`${w}: display name longer than 22 chars; add a shorter "label"`);
    });
    if (d.nodes.length < 2) err('diagram: at least 2 nodes');
    if (d.edges.length < 1) err('diagram: at least 1 edge');
    d.edges.forEach((e, i) => {
      const w = `diagram.edges[${i}]`;
      if (!ids.has(e.from)) err(`${w}.from: unknown node "${e.from}"`);
      if (!ids.has(e.to)) err(`${w}.to: unknown node "${e.to}"`);
      if (e.from === e.to) err(`${w}: self-edges are not supported`);
      if (!EDGE_TYPES.includes(e.type)) err(`${w}.type: must be one of ${EDGE_TYPES.join(', ')}`);
      if (e.label !== undefined && (typeof e.label !== 'string' || e.label.length > 18)) err(`${w}.label: string of at most 18 chars`);
    });
  }

  // related
  if (!Array.isArray(l.related) || l.related.length < 1) err('related: at least one entry');
  else l.related.forEach((r, i) => {
    if (typeof r.id !== 'string') err(`related[${i}].id: missing`);
    else if (knownIds && !knownIds.has(r.id)) warn(`related[${i}].id: "${r.id}" does not exist (yet)`);
    if (r.id === l.id) err(`related[${i}]: cannot relate to itself`);
    text(r.note, `related[${i}].note`);
  });

  // example
  const ex = l.example;
  const src = l.sources && l.sources.example;
  if (!ex) err('example: required');
  else {
    text(ex.title, 'example.title');
    text(ex.description, 'example.description');
    if (!src) err('example.jsx: file missing');
    const lineCount = src ? src.replace(/\n$/, '').split('\n').length : 0;
    if (src && (lineCount < 20 || lineCount > 110)) warn(`example.jsx: ${lineCount} lines (aim for 25-90)`);
    if (!Array.isArray(ex.highlights) || ex.highlights.length < 2) err('example.highlights: at least 2 entries');
    else ex.highlights.forEach((h, i) => {
      const w = `example.highlights[${i}]`;
      if (!Array.isArray(h.lines) || h.lines.length !== 2 || !h.lines.every(Number.isInteger) || h.lines[0] < 1 || h.lines[1] < h.lines[0]) err(`${w}.lines: [start, end] 1-based, start <= end`);
      else if (src && h.lines[1] > lineCount) err(`${w}.lines: end ${h.lines[1]} beyond file length ${lineCount}`);
      text(h.note, `${w}.note`);
    });
  }
  for (const [key, file] of Object.entries(FILES)) {
    const s = l.sources && l.sources[key];
    if (!s) continue;
    if (!/export\s+default\b/.test(s) && key !== 'tests') err(`${file}: must \`export default\` the root component`);
    if (/^\s*import\s[^;]*from\s+['"](?!react(?:-dom)?(?:\/client)?['"]|\.\/App['"])[^'"]+['"]/m.test(s)) err(`${file}: only 'react', 'react-dom', 'react-dom/client'${key === 'tests' ? " and './App'" : ''} can be imported`);
  }

  // quiz
  if (!Array.isArray(l.quiz) || l.quiz.length !== 4) err('quiz: exactly 4 questions required');
  else l.quiz.forEach((q, i) => {
    const w = `quiz[${i}]`;
    text(q.question, `${w}.question`);
    text(q.explanation, `${w}.explanation`);
    if (!q.options || !Array.isArray(q.options.en) || !Array.isArray(q.options.fa) || q.options.en.length !== 4 || q.options.fa.length !== 4) err(`${w}.options: { en: [4], fa: [4] } required`);
    else {
      [...q.options.en, ...q.options.fa].forEach((o, j) => { if (typeof o !== 'string' || !o.trim()) err(`${w}.options: option ${j} empty`); });
      if (new Set(q.options.en).size !== 4) err(`${w}.options.en: duplicate options`);
    }
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) err(`${w}.answer: index 0-3`);
  });
  if (Array.isArray(l.quiz) && l.quiz.length === 4 && l.quiz.every((q) => q.answer === l.quiz[0].answer)) warn('quiz: every answer has the same index — vary the correct option position');

  // scenarios
  if (!Array.isArray(l.scenarios) || l.scenarios.length !== 2) err('scenarios: exactly 2 required');
  else l.scenarios.forEach((s, i) => {
    text(s, `scenarios[${i}]`);
    const nameEn = l.name && l.name.en ? l.name.en.toLowerCase() : null;
    if (nameEn && s && typeof s.en === 'string' && s.en.toLowerCase().includes(nameEn)) err(`scenarios[${i}].en: must not reveal the lesson name`);
  });

  // exercise
  const x = l.exercise;
  if (!x) err('exercise: required');
  else {
    text(x.title, 'exercise.title');
    text(x.task, 'exercise.task');
    list(x.hints, 'exercise.hints', { min: 2, max: 4 });
    if (!l.sources || !l.sources.exercise) err('exercise.jsx: file missing');
    if (!l.sources || !l.sources.solution) err('solution.jsx: file missing');
    if (!l.sources || !l.sources.tests) err('tests.jsx: file missing');
    else {
      const n = countTests(l.sources.tests);
      if (n < 3 || n > 7) err(`tests.jsx: expected 3-7 top-level test() calls, found ${n}`);
    }
    if (l.sources && l.sources.exercise && !/TODO/.test(l.sources.exercise)) warn('exercise.jsx: no TODO markers');
  }

  return { errors, warnings };
}

module.exports = {
  CONTENT_DIR, LESSONS_DIR, ICONS_DIR, CATEGORY_IDS, NODE_KINDS, EDGE_TYPES,
  loadCategories, listLessonIds, loadLesson, loadLibrary, summarize, lessonPayload, validateLesson, countTests,
};
