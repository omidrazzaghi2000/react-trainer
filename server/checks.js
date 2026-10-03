'use strict';

// Reads the bilingual test names out of a lesson's tests.jsx without running
// any test, so the Challenge tab can show the checklist before the first run.
// Only trusted, bundled content is evaluated here: every test-kit global is a
// no-op except test()/it(), which just record their names.

const TrainerTranspile = require('../public/js/sandbox/transpile');
const { GLOBAL_NAMES } = require('../public/js/sandbox/testkit');

let transpile = null;
const cache = new Map();

function noop() {
  return inert;
}
const inert = new Proxy(noop, { get: (target, key) => (key === Symbol.toPrimitive ? () => '' : inert), apply: () => inert });

/** @returns {{ en: string, fa: string }[] | null} */
function collectTestNames(source) {
  if (!source) return null;
  if (cache.has(source)) return cache.get(source);
  if (!transpile) transpile = TrainerTranspile.create(require('@babel/standalone'));
  let names = null;
  const compiled = transpile(source, { filename: 'tests.jsx' });
  if (compiled.ok) {
    const found = [];
    const record = (name) => { found.push(typeof name === 'string' ? { en: name, fa: name } : { en: String(name && name.en), fa: String(name && (name.fa || name.en)) }); };
    const requireShim = (name) => (/^\.\/App/.test(name) ? inert : require(name));
    try {
      const mod = { exports: {} };
      // eslint-disable-next-line no-new-func
      new Function('require', 'module', 'exports', '__loopGuard', ...GLOBAL_NAMES, compiled.code)(
        requireShim, mod, mod.exports, () => {},
        ...GLOBAL_NAMES.map((n) => (n === 'test' || n === 'it' ? record : inert)),
      );
      names = found;
    } catch {
      names = null;
    }
  }
  cache.set(source, names);
  return names;
}

module.exports = { collectTestNames };
