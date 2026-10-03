// Runs learner code in a sandboxed iframe (see public/js/sandbox/runtime.js).
//   createPreview(host, handlers) – a visible, auto-sizing live preview
//   runTests(code, tests, opts)   – a hidden frame that runs the challenge tests
// Babel (≈3 MB) is only downloaded the first time code needs transpiling.

const SOURCE = 'react-trainer-sandbox';
const SANDBOX = 'allow-scripts allow-forms allow-modals';

let compilerPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  });
}

/** Resolves to transpile(source, { filename }) → { ok, code } | { ok: false, error }. */
export function loadCompiler() {
  if (!compilerPromise) {
    compilerPromise = Promise.all([
      window.TrainerTranspile ? null : loadScript('js/sandbox/transpile.js'),
      window.Babel ? null : loadScript('vendor/babel/babel.min.js'),
    ])
      .then(() => window.TrainerTranspile.create(window.Babel))
      .catch((err) => {
        compilerPromise = null;
        throw err;
      });
  }
  return compilerPromise;
}

export const compilerReady = () => Boolean(window.Babel && window.TrainerTranspile);

let seq = 0;

function makeFrame({ hidden = false, title = 'Preview' } = {}) {
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', SANDBOX);
  frame.setAttribute('title', title);
  frame.setAttribute('referrerpolicy', 'no-referrer');
  if (hidden) {
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.className = 'test-frame';
  } else {
    frame.className = 'preview-frame';
  }
  frame.src = 'sandbox.html';
  return frame;
}

/** Listens for messages from one frame until `dispose()` is called. */
function listen(frame, onMessage) {
  const handler = (e) => {
    if (e.source !== frame.contentWindow) return;
    const msg = e.data;
    if (msg && msg.source === SOURCE) onMessage(msg);
  };
  window.addEventListener('message', handler);
  return () => window.removeEventListener('message', handler);
}

/**
 * @param {HTMLElement} host   element that will contain the iframe
 * @param {{ onStart?: () => void, onConsole?: (entry) => void, onError?: (err) => void,
 *           onRendered?: () => void, onClear?: () => void, title?: string,
 *           minHeight?: number, maxHeight?: number }} handlers
 */
export function createPreview(host, handlers = {}) {
  const minHeight = handlers.minHeight ?? 160;
  const maxHeight = handlers.maxHeight ?? 640;
  let frame = null;
  let stop = null;
  let disposed = false;
  let current = 0;
  let storage = {}; // the preview's localStorage, kept across runs like a real browser tab

  function reset() {
    if (stop) stop();
    if (frame) frame.remove();
    frame = null;
    stop = null;
  }

  async function run(source) {
    const id = ++seq;
    current = id;
    if (handlers.onStart) handlers.onStart();
    let transpile;
    try {
      transpile = await loadCompiler();
    } catch (err) {
      if (handlers.onError) handlers.onError({ phase: 'loader', name: 'Error', message: err.message });
      return { ok: false };
    }
    if (disposed || current !== id) return { ok: false, stale: true };
    const compiled = transpile(source, { filename: 'App.jsx' });
    if (!compiled.ok) {
      if (handlers.onError) handlers.onError({ phase: 'transpile', ...compiled.error });
      return { ok: false };
    }

    reset();
    const f = makeFrame({ title: handlers.title });
    frame = f;
    f.style.height = `${minHeight}px`;
    let errored = false;
    const done = new Promise((resolve) => {
      stop = listen(f, (msg) => {
        if (msg.type === 'ready') {
          f.contentWindow.postMessage({ type: 'run', runId: id, mode: 'preview', code: compiled.code, storage }, '*');
          return;
        }
        if (msg.runId !== id) return;
        if (msg.type === 'console' && handlers.onConsole) handlers.onConsole({ level: msg.level, text: msg.text });
        else if (msg.type === 'console-clear' && handlers.onClear) handlers.onClear();
        else if (msg.type === 'storage' && msg.data && typeof msg.data === 'object') storage = msg.data;
        else if (msg.type === 'error') {
          errored = true;
          if (handlers.onError) handlers.onError(msg);
          resolve({ ok: false });
        } else if (msg.type === 'size') {
          f.style.height = `${Math.max(minHeight, Math.min(maxHeight, msg.height))}px`;
        } else if (msg.type === 'rendered') {
          if (handlers.onRendered && !errored) handlers.onRendered();
          resolve({ ok: !errored });
        }
      });
    });
    host.replaceChildren(f);
    return done;
  }

  return {
    run,
    get frame() { return frame; },
    dispose() {
      disposed = true;
      reset();
    },
  };
}

/**
 * Runs `tests` against `source` in a hidden frame.
 * @returns {Promise<{ ok: boolean, results: Array|null, error?: object }>}
 */
export async function runTests(source, tests, { onStart, onResult, timeoutMs = 45_000 } = {}) {
  const transpile = await loadCompiler();
  const app = transpile(source, { filename: 'App.jsx' });
  if (!app.ok) return { ok: false, results: null, error: { phase: 'transpile', ...app.error } };
  const spec = transpile(tests, { filename: 'tests.jsx' });
  if (!spec.ok) return { ok: false, results: null, error: { phase: 'tests', ...spec.error } };

  const id = ++seq;
  const frame = makeFrame({ hidden: true, title: 'Test runner' });
  document.body.appendChild(frame);
  let stop = null;
  let timer = null;
  const finish = (value) => {
    clearTimeout(timer);
    if (stop) stop();
    frame.remove();
    return value;
  };

  return new Promise((resolve) => {
    let moduleError = null;
    timer = setTimeout(() => resolve(finish({ ok: false, results: null, error: { phase: 'timeout', name: 'TimeoutError', message: `The tests did not finish within ${timeoutMs / 1000} s.` } })), timeoutMs);
    stop = listen(frame, (msg) => {
      if (msg.type === 'ready') {
        frame.contentWindow.postMessage({ type: 'run', runId: id, mode: 'test', code: app.code, tests: spec.code }, '*');
        return;
      }
      if (msg.runId !== id) return;
      if (msg.type === 'error') moduleError = msg;
      else if (msg.type === 'test-start' && onStart) onStart(msg.total);
      else if (msg.type === 'test-result' && onResult) onResult(msg.result, msg.index);
      else if (msg.type === 'test-done') {
        const results = msg.results;
        resolve(finish({ ok: Boolean(results && results.length && results.every((r) => r.ok)), results, error: moduleError }));
      }
    });
  });
}
