'use strict';

// React 19 ships CommonJS only (no UMD builds), so the browser sandbox gets a
// small in-memory bundle built with esbuild on first request. It exposes the
// modules learner code may import through `globalThis.__TRAINER_MODULES__`.
// The development build is used on purpose: its warnings (missing keys,
// invalid hooks, …) are part of what the trainer teaches.

const crypto = require('crypto');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const ENTRY = `
globalThis.__TRAINER_MODULES__ = {
  'react': require('react'),
  'react-dom': require('react-dom'),
  'react-dom/client': require('react-dom/client'),
  'react/jsx-runtime': require('react/jsx-runtime'),
  'react/jsx-dev-runtime': require('react/jsx-dev-runtime'),
};
`;

let cached = null;

function reactVersion() {
  return require('react/package.json').version;
}

/** @returns {{ code: string, etag: string, version: string }} */
function reactBundle() {
  if (cached) return cached;
  const esbuild = require('esbuild');
  const result = esbuild.buildSync({
    stdin: { contents: ENTRY, resolveDir: ROOT, sourcefile: 'react-vendor.js', loader: 'js' },
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    write: false,
    minifyWhitespace: true,
    minifySyntax: true,
    legalComments: 'none',
    define: { 'process.env.NODE_ENV': '"development"' },
  });
  const version = reactVersion();
  const code = `/* React ${version} (development build) — bundled for React Trainer */\n${result.outputFiles[0].text}`;
  cached = { code, version, etag: `"${crypto.createHash('sha1').update(code).digest('hex').slice(0, 16)}"` };
  return cached;
}

module.exports = { reactBundle, reactVersion };
