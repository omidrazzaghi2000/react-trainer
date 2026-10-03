'use strict';

// Child process that renders a learner program (or runs its tests) inside
// jsdom, exactly the way the browser sandbox does. Reads one JSON job from
// stdin and writes one JSON result to stdout:
//
//   { mode: 'render', app: '<App.jsx source>', settleMs?: 400 }
//   { mode: 'test',   app: '<App.jsx source>', tests: '<tests.jsx source>' }
//
// It is spawned by verify.js with a hard timeout, so runaway code is killed.

const { JSDOM, VirtualConsole } = require('jsdom');
const Babel = require('@babel/standalone');
const TrainerTranspile = require('../public/js/sandbox/transpile');
const { createTestKit, format, GLOBAL_NAMES } = require('../public/js/sandbox/testkit');

const transpile = TrainerTranspile.create(Babel);
const logs = [];
const errors = [];

// Everything the program prints is captured; stdout is reserved for the result.
for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
  console[level] = (...args) => { logs.push({ level, text: format(args) }); };
}

function finish(result) {
  process.stdout.write(JSON.stringify({ ...result, logs: logs.slice(0, 200) }), () => process.exit(0));
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => { data += c; });
    process.stdin.on('end', () => resolve(data));
  });
}

function installDom() {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (e) => { logs.push({ level: 'error', text: `[jsdom] ${e.message}` }); });
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
    virtualConsole,
  });
  const win = dom.window;
  global.window = win;
  global.document = win.document;
  for (const key of Object.getOwnPropertyNames(win)) {
    if (key in global || key.startsWith('_')) continue;
    try { global[key] = win[key]; } catch { /* read-only */ }
  }
  // Node has its own versions of these; DOM code (React's form Actions build a
  // FormData from a <form>, learner code dispatches Events on DOM nodes) needs jsdom's.
  for (const key of ['FormData', 'Event', 'EventTarget', 'CustomEvent', 'MessageEvent', 'Blob', 'File', 'FileList', 'DOMException', 'AbortController', 'AbortSignal', 'navigator']) {
    if (win[key]) Object.defineProperty(global, key, { value: win[key], configurable: true, writable: true });
  }
  return win;
}

function serialize(err) {
  if (!err || typeof err !== 'object') return { name: 'Error', message: String(err) };
  return { name: err.name || 'Error', message: String(err.message), stack: String(err.stack || '').split('\n').slice(0, 6).join('\n') };
}

(async () => {
  const job = JSON.parse(await readStdin());
  const win = installDom();
  process.on('uncaughtException', (e) => errors.push(serialize(e)));
  process.on('unhandledRejection', (e) => errors.push(serialize(e)));

  const React = require('react');
  const ReactDOM = require('react-dom');
  const ReactDOMClient = require('react-dom/client');
  const JSXDev = require('react/jsx-dev-runtime');
  const JSX = require('react/jsx-runtime');
  const loopGuard = TrainerTranspile.createLoopGuard({ now: () => Date.now(), schedule: (f) => setTimeout(f, 0) });

  const compiled = transpile(job.app, { filename: 'App.jsx' });
  if (!compiled.ok) return finish({ ok: false, stage: 'transpile', error: compiled.error });

  let appExports = null;
  const modules = { react: React, 'react-dom': ReactDOM, 'react-dom/client': ReactDOMClient, 'react/jsx-runtime': JSX, 'react/jsx-dev-runtime': JSXDev };
  const requireShim = (name) => {
    if (Object.prototype.hasOwnProperty.call(modules, name)) return modules[name];
    if (/^\.\/App(\.jsx?)?$/.test(name) && appExports) return appExports;
    throw new Error(`Cannot find module '${name}'. Only react, react-dom and react-dom/client are available.`);
  };
  const evaluate = (code, names = [], values = []) => {
    const mod = { exports: {} };
    // eslint-disable-next-line no-new-func
    new Function('require', 'module', 'exports', '__loopGuard', ...names, code)(requireShim, mod, mod.exports, loopGuard, ...values);
    return mod.exports;
  };

  try {
    appExports = evaluate(compiled.code);
  } catch (err) {
    return finish({ ok: false, stage: 'module', error: serialize(err) });
  }

  if (job.mode === 'render') {
    const App = appExports.default;
    const valid = typeof App === 'function' || (App && typeof App === 'object' && App.$$typeof);
    if (!valid) return finish({ ok: false, stage: 'module', error: { name: 'Error', message: 'App.jsx must `export default` a component.' } });
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const container = win.document.getElementById('root');
    const root = ReactDOMClient.createRoot(container, {
      onUncaughtError: (e) => errors.push(serialize(e)),
      onCaughtError: (e) => logs.push({ level: 'caught', text: `${e.name}: ${e.message}` }),
    });
    try {
      // Awaited, so an app that suspends on its first render can resolve (as it does in the browser).
      await React.act(async () => root.render(React.createElement(App)));
      await React.act(() => new Promise((r) => setTimeout(r, job.settleMs ?? 400)));
    } catch (err) {
      errors.push(serialize(err));
    }
    return finish({ ok: errors.length === 0, stage: 'render', errors, html: container.innerHTML.slice(0, 6000) });
  }

  if (job.mode === 'test') {
    const compiledTests = transpile(job.tests, { filename: 'tests.jsx' });
    if (!compiledTests.ok) return finish({ ok: false, stage: 'tests-transpile', error: compiledTests.error });
    const kit = createTestKit({ React, ReactDOMClient, window: win });
    try {
      evaluate(compiledTests.code, GLOBAL_NAMES, GLOBAL_NAMES.map((n) => kit.globals[n]));
    } catch (err) {
      return finish({ ok: false, stage: 'tests-module', error: serialize(err) });
    }
    const results = await kit.run();
    return finish({ ok: results.length > 0 && results.every((r) => r.ok), stage: 'test', results, errors });
  }

  return finish({ ok: false, stage: 'job', error: { name: 'Error', message: `unknown mode ${job.mode}` } });
})().catch((err) => finish({ ok: false, stage: 'internal', error: serialize(err) }));
