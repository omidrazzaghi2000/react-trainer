'use strict';

// Runs learner programs and challenge tests in jsdom (see verify-worker.js),
// one child process per job with a hard timeout and a small concurrency gate.
// Used by the content validator and the test suite; the web app itself runs
// code in the browser sandbox instead.

const { spawn } = require('child_process');
const path = require('path');

const WORKER = path.join(__dirname, 'verify-worker.js');
const MAX_CONCURRENT = 4;
const MAX_OUTPUT = 2 * 1024 * 1024;

let active = 0;
const waiting = [];

async function withSlot(fn) {
  if (active >= MAX_CONCURRENT) await new Promise((resolve) => waiting.push(resolve));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    const next = waiting.shift();
    if (next) next();
  }
}

/**
 * @param {{ mode: 'render'|'test', app: string, tests?: string, settleMs?: number }} job
 * @returns {Promise<{ ok: boolean, stage: string, error?: object, errors?: object[], results?: object[], logs: object[], html?: string, timedOut?: boolean }>}
 */
function runJob(job, { timeoutMs = 30_000 } = {}) {
  return withSlot(() => new Promise((resolve) => {
    const child = spawn(process.execPath, [WORKER], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.on('data', (c) => { if (out.length < MAX_OUTPUT) out += c; });
    child.stderr.on('data', (c) => { if (err.length < 64 * 1024) err += c; });
    child.on('close', () => {
      clearTimeout(timer);
      if (timedOut) return resolve({ ok: false, stage: 'timeout', timedOut: true, error: { name: 'Error', message: `Timed out after ${timeoutMs / 1000}s` }, logs: [] });
      try {
        resolve(JSON.parse(out));
      } catch {
        resolve({ ok: false, stage: 'crash', error: { name: 'Error', message: (err || out || 'worker crashed').slice(0, 2000) }, logs: [] });
      }
    });
    child.stdin.end(JSON.stringify(job));
  }));
}

module.exports = { runJob };
