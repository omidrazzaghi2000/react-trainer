#!/usr/bin/env node
'use strict';

// Builds a fully static copy of the trainer into dist/ (for GitHub Pages or any
// static host). Lesson data is pre-rendered to JSON, React is bundled, vendor
// files are copied from node_modules, and the page switches to "static" mode.
// Nothing is lost: learner code always runs in the browser sandbox anyway.
//
//   npm run build:static     → dist/
//   npm run preview:static   → serves dist/ on http://127.0.0.1:4001/react-trainer/
//
// Static hosts cannot send headers, so both pages get their CSP from a <meta>
// tag. SITE_ORIGIN (e.g. https://user.github.io) is added to the sandbox's
// sources, because 'self' is ambiguous for opaque-origin (sandboxed) documents.

const fs = require('fs');
const path = require('path');
const content = require('../server/content');
const { buildSprite } = require('../server/icons');
const { reactBundle } = require('../server/bundle');
const { collectTestNames } = require('../server/checks');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const MODULES = path.join(ROOT, 'node_modules');
const ORIGIN = (process.env.SITE_ORIGIN || '').replace(/\/+$/, '');

const APP_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const src = ["'self'", ORIGIN].filter(Boolean).join(' ');
const SANDBOX_CSP = [
  "default-src 'none'",
  `script-src ${src} blob: 'unsafe-eval'`,
  `style-src ${src} 'unsafe-inline'`,
  `img-src ${src} data: blob:`,
  `font-src ${src} data:`,
  `media-src ${src} data: blob:`,
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

function writeFile(rel, data) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
}

const writeJson = (rel, data) => writeFile(rel, JSON.stringify(data));

function injectMeta(rel, marker, meta) {
  const file = path.join(OUT, rel);
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes(marker)) throw new Error(`${rel} is missing ${marker}`);
  fs.writeFileSync(file, html.replace(marker, `${marker}\n  ${meta}`));
}

function main() {
  const library = content.loadLibrary();
  const errors = library.problems.filter((p) => p.errors.length);
  if (errors.length) {
    for (const p of errors) console.error(`${p.id}: ${p.errors.join('; ')}`);
    process.exit(1);
  }
  const { categories, lessons } = library;

  fs.rmSync(OUT, { recursive: true, force: true });
  copy(path.join(ROOT, 'public'), OUT);
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

  // index.html → static mode + CSP; sandbox.html → its own isolated CSP
  const indexFile = path.join(OUT, 'index.html');
  const index = fs.readFileSync(indexFile, 'utf8');
  if (!index.includes('<meta name="app-mode" content="server">')) throw new Error('index.html is missing the app-mode meta tag');
  fs.writeFileSync(indexFile, index.replace('<meta name="app-mode" content="server">', '<meta name="app-mode" content="static">'));
  injectMeta('index.html', '<meta charset="utf-8">', `<meta http-equiv="Content-Security-Policy" content="${APP_CSP}">`);
  injectMeta('sandbox.html', '<meta charset="utf-8">', `<meta http-equiv="Content-Security-Policy" content="${SANDBOX_CSP}">`);

  // React (bundled), Babel, CodeMirror: only the files the pages load
  const bundle = reactBundle();
  writeFile('vendor/react.js', bundle.code);
  copy(path.join(MODULES, 'react', 'LICENSE'), path.join(OUT, 'vendor/react.LICENSE'));
  copy(path.join(MODULES, '@babel/standalone/babel.min.js'), path.join(OUT, 'vendor/babel/babel.min.js'));
  copy(path.join(MODULES, '@babel/standalone/LICENSE'), path.join(OUT, 'vendor/babel/LICENSE'));
  const cm = path.join(MODULES, 'codemirror');
  for (const rel of [
    'lib/codemirror.js', 'lib/codemirror.css', 'mode/xml/xml.js', 'mode/javascript/javascript.js', 'mode/jsx/jsx.js',
    'addon/edit/matchbrackets.js', 'addon/edit/closebrackets.js', 'addon/edit/closetag.js',
    'addon/comment/comment.js', 'addon/selection/active-line.js', 'LICENSE',
  ]) {
    copy(path.join(cm, rel), path.join(OUT, 'vendor/codemirror', rel));
  }

  // Fonts: each CSS file imported by public/css/fonts.css, plus the font files it references
  const fontsCss = fs.readFileSync(path.join(ROOT, 'public/css/fonts.css'), 'utf8');
  let fontFiles = 0;
  for (const [, rel] of fontsCss.matchAll(/url\('\.\.\/vendor\/fonts\/([^']+)'\)/g)) {
    const from = path.join(MODULES, '@fontsource', rel);
    const css = fs.readFileSync(from, 'utf8');
    copy(from, path.join(OUT, 'vendor/fonts', rel));
    for (const [, file] of css.matchAll(/url\(\.\/(files\/[^)]+)\)/g)) {
      const to = path.join(OUT, 'vendor/fonts', path.dirname(rel), file);
      if (!fs.existsSync(to)) {
        copy(path.join(path.dirname(from), file), to);
        fontFiles++;
      }
    }
    const pkg = rel.split('/')[0];
    const license = path.join(MODULES, '@fontsource', pkg, 'LICENSE');
    if (fs.existsSync(license)) copy(license, path.join(OUT, 'vendor/fonts', pkg, 'LICENSE'));
  }

  writeFile('icons.svg', buildSprite([...categories.map((c) => c.icon), ...lessons.map((l) => l.icon)]));

  // Pre-rendered API (same shapes as server/app.js)
  const summaries = lessons.map(content.summarize);
  writeJson('api/meta.json', {
    categories,
    lessonCount: lessons.length,
    questionCount: lessons.reduce((n, l) => n + l.quiz.length, 0),
    exerciseCount: lessons.filter((l) => l.exercise).length,
    testCount: summaries.reduce((n, s) => n + s.testCount, 0),
    react: bundle.version,
  });
  writeJson('api/lessons.json', summaries);
  for (const l of lessons) {
    const payload = content.lessonPayload(l, library);
    payload.exercise.checks = collectTestNames(l.sources.tests);
    writeJson(`api/lessons/${l.id}.json`, payload);
    writeJson(`api/lessons/${l.id}/solution.json`, { code: l.sources.solution });
  }
  writeJson('api/training.json', lessons.map((l) => ({ lesson: content.summarize(l), quiz: l.quiz, scenarios: l.scenarios })));

  const size = dirSize(OUT);
  console.log(`dist/ built: ${lessons.length} lessons, ${fontFiles} font files, ${(size / 1024 / 1024).toFixed(1)} MB${ORIGIN ? ` (sandbox origin ${ORIGIN})` : ''}`);
}

function dirSize(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((n, e) => {
    const p = path.join(dir, e.name);
    return n + (e.isDirectory() ? dirSize(p) : fs.statSync(p).size);
  }, 0);
}

main();
