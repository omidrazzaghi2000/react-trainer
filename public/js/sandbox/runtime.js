/* Runs inside the preview iframe (opaque origin, see server/app.js).
 *
 * Protocol with the parent window (all messages carry source: 'react-trainer-sandbox'):
 *   → parent   { type: 'ready' }
 *   ← parent   { type: 'run', runId, mode: 'preview', code }            (transpiled App.jsx)
 *   ← parent   { type: 'run', runId, mode: 'test', code, tests }        (+ transpiled tests.jsx)
 *   → parent   { type: 'console', level, text }
 *   → parent   { type: 'error', phase, name, message, file, line, column, componentStack }
 *   → parent   { type: 'rendered' } | { type: 'size', height }
 *   → parent   { type: 'test-start', total } / { type: 'test-result', index, result } / { type: 'test-done', results }
 *
 * The parent reloads the iframe before every run, so each run starts from a clean page. */
(function () {
  'use strict';

  const modules = globalThis.__TRAINER_MODULES__;
  const React = modules.react;
  const ReactDOMClient = modules['react-dom/client'];
  const { format, createTestKit, GLOBAL_NAMES } = globalThis.TrainerTestKit;
  const { createLoopGuard } = globalThis.TrainerTranspile;
  const SOURCE = 'react-trainer-sandbox';

  let runId = null;
  let mode = 'preview';
  const post = (msg) => {
    try {
      window.parent.postMessage({ source: SOURCE, runId, ...msg }, '*');
    } catch {
      /* the message could not be cloned; drop it */
    }
  };

  // ------------------------------------------------------------ console
  const original = {};
  ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
    original[level] = console[level].bind(console);
    console[level] = (...args) => {
      post({ type: 'console', level, text: format(args) });
      original[level](...args);
    };
  });
  console.table = (data) => console.log(data);
  console.clear = () => post({ type: 'console-clear' });

  // ------------------------------------------------------------ error locations
  const files = new Map(); // blob URL → file name

  function locate(err) {
    const stack = String((err && err.stack) || '');
    const re = /(blob:\S+?):(\d+):(\d+)/g;
    let m;
    while ((m = re.exec(stack))) {
      if (files.has(m[1])) return { file: files.get(m[1]), line: Number(m[2]), column: Number(m[3]) };
    }
    const named = stack.match(/(App\.jsx|tests\.jsx):(\d+):(\d+)/);
    return named ? { file: named[1], line: Number(named[2]), column: Number(named[3]) } : {};
  }

  function reportError(phase, err, componentStack) {
    const e = err instanceof Error ? err : new Error(String(err));
    post({
      type: 'error',
      phase,
      name: e.name || 'Error',
      message: String(e.message || e),
      componentStack: componentStack ? String(componentStack).split('\n').filter((l) => l.trim()).slice(0, 8).join('\n') : '',
      ...locate(e),
    });
  }

  window.addEventListener('error', (e) => {
    if (mode === 'test') return; // the test kit reports these per test
    reportError('runtime', e.error || new Error(e.message));
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (mode === 'test') return;
    reportError('promise', e.reason instanceof Error ? e.reason : new Error(`Unhandled promise rejection: ${format([e.reason])}`));
  });

  // A real page would reload on these; keep the preview alive and explain why.
  window.addEventListener('submit', (e) => {
    if (e.defaultPrevented || mode === 'test') return; // tests see exactly what jsdom sees
    e.preventDefault();
    console.warn('A <form> was submitted without event.preventDefault(). In a real page this reloads everything — the preview blocked it.');
  });
  window.addEventListener('click', (e) => {
    const a = e.target instanceof Element && e.target.closest('a[href]');
    if (!a || e.defaultPrevented) return;
    const href = a.getAttribute('href');
    if (href.startsWith('#')) return;
    e.preventDefault();
    console.info(`Navigation to "${href}" is disabled in the preview.`);
  });

  // ------------------------------------------------------------ storage
  // An opaque-origin frame may not touch the real localStorage (it throws a
  // SecurityError), so both storages are replaced by in-memory versions. The
  // parent keeps a copy of localStorage, so it survives "Reload preview".
  function createStorage(seed, onChange) {
    const data = new Map(Object.entries(seed || {}).map(([k, v]) => [k, String(v)]));
    const changed = () => { if (onChange) onChange(Object.fromEntries(data)); };
    const api = {
      get length() { return data.size; },
      key: (i) => [...data.keys()][i] ?? null,
      getItem: (k) => (data.has(String(k)) ? data.get(String(k)) : null),
      setItem: (k, v) => { data.set(String(k), String(v)); changed(); },
      removeItem: (k) => { data.delete(String(k)); changed(); },
      clear: () => { data.clear(); changed(); },
    };
    return api;
  }

  function installStorage(seed, onChange) {
    for (const [name, store] of [['localStorage', createStorage(seed, onChange)], ['sessionStorage', createStorage({})]]) {
      try {
        Object.defineProperty(window, name, { value: store, configurable: true, enumerable: true });
      } catch {
        /* the browser refused; learner code will see the native behaviour */
      }
    }
  }

  // ------------------------------------------------------------ module loading
  const loopGuard = createLoopGuard({ now: () => performance.now(), schedule: (f) => setTimeout(f, 0) });

  /** Loads transpiled code as a blob: script so stack traces keep exact line numbers. */
  function compile(code, filename, params) {
    const header = `__trainerDefine(function (${params.join(', ')}) {`;
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(new Blob([`${header}${code}\n});`], { type: 'text/javascript' }));
      files.set(url, filename);
      let settled = false;
      window.__trainerDefine = (factory) => {
        settled = true;
        resolve(factory);
      };
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => { if (!settled) reject(new Error(`${filename} could not be loaded`)); };
      script.onerror = () => {
        // Fallback for browsers that refuse blob: scripts in sandboxed frames.
        try {
          // eslint-disable-next-line no-new-func
          resolve(new Function(...params, `${code}\n//# sourceURL=${filename}`));
        } catch (err) {
          reject(err);
        }
      };
      document.head.appendChild(script);
    });
  }

  let appExports = null;

  function requireModule(name) {
    if (Object.prototype.hasOwnProperty.call(modules, name)) return modules[name];
    if (/^\.\/App(\.jsx?)?$/.test(name) && appExports) return appExports;
    throw new Error(`Cannot find module '${name}'. In the trainer you can import from 'react', 'react-dom' and 'react-dom/client'.`);
  }

  async function evaluate(code, filename, extraNames = [], extraValues = []) {
    const factory = await compile(code, filename, ['require', 'module', 'exports', '__loopGuard', ...extraNames]);
    const mod = { exports: {} };
    factory(requireModule, mod, mod.exports, loopGuard, ...extraValues);
    return mod.exports;
  }

  // ------------------------------------------------------------ size reporting
  // Chromium pauses rendering work (rAF, ResizeObserver) in off-screen
  // cross-origin frames, so DOM mutations also trigger a (debounced) measure.
  let lastHeight = 0;
  let sizeTimer = 0;
  function reportSize() {
    const h = Math.ceil(document.body ? document.body.scrollHeight : 0);
    if (h && h !== lastHeight) {
      lastHeight = h;
      post({ type: 'size', height: h });
    }
  }
  const scheduleSize = () => {
    clearTimeout(sizeTimer);
    sizeTimer = setTimeout(reportSize, 30);
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(scheduleSize).observe(document.documentElement);
  new MutationObserver(scheduleSize).observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });

  // ------------------------------------------------------------ runs
  async function runPreview(code) {
    try {
      appExports = await evaluate(code, 'App.jsx');
    } catch (err) {
      reportError('module', err);
      return;
    }
    const App = appExports.default;
    if (typeof App !== 'function' && !(App && typeof App === 'object' && App.$$typeof)) {
      reportError('module', new Error('App.jsx must `export default` a component, e.g. `export default function App() { … }`.'));
      return;
    }
    const root = ReactDOMClient.createRoot(document.getElementById('root'), {
      onUncaughtError: (error, info) => reportError('render', error, info && info.componentStack),
      onCaughtError: (error) => post({ type: 'console', level: 'info', text: `An error boundary caught: ${error && error.name}: ${error && error.message}` }),
      onRecoverableError: (error) => post({ type: 'console', level: 'warn', text: `React recovered from: ${error && error.message}` }),
    });
    try {
      // Render synchronously so the first commit (or its error) is known right away.
      modules['react-dom'].flushSync(() => root.render(React.createElement(App)));
    } catch (err) {
      reportError('render', err);
    }
    post({ type: 'rendered' });
    scheduleSize();
  }

  async function runTests(code, tests) {
    mode = 'test';
    const kit = createTestKit({ React, ReactDOMClient, window });
    try {
      appExports = await evaluate(code, 'App.jsx');
    } catch (err) {
      reportError('module', err);
      post({ type: 'test-done', results: null });
      return;
    }
    try {
      await evaluate(tests, 'tests.jsx', GLOBAL_NAMES, GLOBAL_NAMES.map((n) => kit.globals[n]));
    } catch (err) {
      reportError('tests', err);
      post({ type: 'test-done', results: null });
      return;
    }
    post({ type: 'test-start', total: kit.tests.length });
    const results = await kit.run({
      onResult: (result, index) => post({ type: 'test-result', index: index - 1, result: { ...result, error: result.error ? { ...result.error, ...locate(result.error) } : undefined } }),
    });
    post({
      type: 'test-done',
      results: results.map((r) => ({ ...r, error: r.error ? { ...r.error, ...locate(r.error) } : undefined })),
    });
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window.parent) return;
    const msg = e.data;
    if (!msg || msg.type !== 'run' || runId !== null) return; // one run per page load
    runId = msg.runId;
    installStorage(msg.mode === 'test' ? {} : msg.storage, msg.mode === 'test' ? null : (data) => post({ type: 'storage', data }));
    if (msg.mode === 'test') runTests(msg.code, msg.tests);
    else runPreview(msg.code);
  });

  // The script runs in <head>; only announce readiness once #root exists.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => post({ type: 'ready' }), { once: true });
  else post({ type: 'ready' });
})();
