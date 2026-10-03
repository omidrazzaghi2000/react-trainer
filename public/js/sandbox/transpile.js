/* JSX → CommonJS transpiler, shared by the browser app and the Node validator.
 *
 * Learner code is a single ES module (`App.jsx`). Babel turns JSX into
 * `jsxDEV()` calls, turns `import`/`export` into `require()`/`exports`, keeps
 * every line on its original line number (so error locations match the
 * editor) and inserts `__loopGuard()` at the top of every loop so an
 * accidental `while (true)` throws instead of freezing the tab. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TrainerTranspile = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Bare module specifiers the sandbox can resolve.
  const MODULES = ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'];

  function loopGuardPlugin({ types: t }) {
    const guard = (path) => {
      const line = path.node.loc ? path.node.loc.start.line : 0;
      const call = t.expressionStatement(t.callExpression(t.identifier('__loopGuard'), [t.numericLiteral(line)]));
      const body = path.get('body');
      if (body.isBlockStatement()) body.unshiftContainer('body', call);
      else body.replaceWith(t.blockStatement([call, body.node]));
    };
    return { visitor: { WhileStatement: guard, DoWhileStatement: guard, ForStatement: guard } };
  }

  /** Splits Babel's "file: message (l:c)\n\n<code frame>" into a clean message. */
  function cleanMessage(message, filename) {
    const first = String(message || 'Syntax error').split('\n')[0];
    return first.replace(/^\/?[\w.-]+:\s*/, (m) => (m.includes(filename) ? '' : m)).replace(/\s*\(\d+:\d+\)$/, '');
  }

  /** @param {typeof import('@babel/standalone')} Babel */
  function create(Babel) {
    return function transpile(source, { filename = 'App.jsx' } = {}) {
      try {
        const out = Babel.transform(String(source), {
          filename,
          sourceType: 'module',
          retainLines: true,
          compact: false,
          presets: [['react', { runtime: 'automatic', development: true }]],
          plugins: ['transform-modules-commonjs', loopGuardPlugin],
        });
        return { ok: true, code: out.code };
      } catch (err) {
        const loc = err.loc || {};
        return {
          ok: false,
          error: {
            name: 'SyntaxError',
            message: cleanMessage(err.message, filename),
            file: filename,
            line: Number.isInteger(loc.line) ? loc.line : null,
            column: Number.isInteger(loc.column) ? loc.column + 1 : null,
          },
        };
      }
    };
  }

  /** Throws when a loop has been spinning for too long in one task. */
  function createLoopGuard({ now, schedule, limitMs = 1500 }) {
    let started = 0;
    return function __loopGuard(line) {
      if (!started) {
        started = now();
        schedule(() => { started = 0; });
        return;
      }
      if (now() - started > limitMs) {
        started = 0;
        throw new RangeError(`Possible infinite loop on line ${line}: it ran for more than ${limitMs / 1000}s and was stopped.`);
      }
    };
  }

  return { create, createLoopGuard, MODULES };
});
