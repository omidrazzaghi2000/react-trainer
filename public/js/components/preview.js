// The "output" half of every workbench: a browser-like live preview with an
// error overlay, plus a console that collects console.* output from the sandbox.

import { t, num } from '../i18n.js';
import { esc, icon } from '../util.js';
import { createPreview } from './sandbox.js';

const LEVEL_ICON = { log: 'chevron-right', info: 'info', warn: 'triangle-alert', error: 'circle-x', debug: 'bug' };

/** HTML for the preview + console column. */
export function outputHTML(id, { url = 'localhost:5173' } = {}) {
  return `<div class="output" id="${id}">
    <section class="preview-panel" aria-label="${esc(t('preview.title'))}">
      <div class="preview-head">
        <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="url" dir="ltr">${icon('lock')}${esc(url)}</span>
        <span class="spacer"></span>
        <span class="preview-status" role="status"></span>
        <button type="button" class="icon-btn" data-out="reload" aria-label="${esc(t('preview.reload'))}" title="${esc(t('preview.reload'))}">${icon('refresh-cw')}</button>
      </div>
      <div class="preview-stage">
        <div class="preview-host"></div>
        <div class="preview-empty">${icon('monitor', 'icon--xl')}<p>${esc(t('preview.idle'))}</p></div>
        <div class="error-overlay" role="alert" hidden></div>
      </div>
    </section>
    <section class="console" aria-label="${esc(t('console.title'))}">
      <div class="console-head">
        ${icon('terminal')}<span>${esc(t('console.title'))}</span>
        <span class="console-counts" aria-live="polite"></span>
        <span class="spacer"></span>
        <button type="button" class="icon-btn icon-btn--dark" data-out="clear" aria-label="${esc(t('console.clear'))}" title="${esc(t('console.clear'))}">${icon('ban')}</button>
      </div>
      <ol class="console-list" dir="ltr"><li class="console-empty">${esc(t('console.empty'))}</li></ol>
    </section>
  </div>`;
}

/** Numbered source lines around `line`, with a caret under `column`. */
export function codeFrame(source, line, column) {
  if (!source || !line) return '';
  const lines = String(source).split('\n');
  const from = Math.max(1, line - 2);
  const to = Math.min(lines.length, line + 2);
  const width = String(to).length;
  const out = [];
  for (let n = from; n <= to; n++) {
    const mark = n === line ? '>' : ' ';
    out.push(`${mark} ${String(n).padStart(width)} | ${lines[n - 1]}`);
    if (n === line && column) out.push(`  ${' '.repeat(width)} | ${' '.repeat(Math.max(0, column - 1))}^`);
  }
  return out.join('\n');
}

/**
 * @param {HTMLElement} el   the `.output` element created by outputHTML()
 * @param {{ editor?: { markLine: Function, goTo: Function }, onError?: Function, onOk?: Function }} opts
 */
export function mountOutput(el, opts = {}) {
  const stage = el.querySelector('.preview-stage');
  const host = el.querySelector('.preview-host');
  const empty = el.querySelector('.preview-empty');
  const overlay = el.querySelector('.error-overlay');
  const status = el.querySelector('.preview-status');
  const list = el.querySelector('.console-list');
  const counts = el.querySelector('.console-counts');
  let lastSource = '';
  let entries = [];
  let lastEntry = null;

  function setStatus(kind, text, iconName) {
    status.className = `preview-status ${kind}`;
    status.innerHTML = text ? `${iconName ? icon(iconName, kind === 'busy' ? 'spin' : '') : ''}<span>${esc(text)}</span>` : '';
  }

  // ------------------------------------------------------------ console
  function drawCounts() {
    const w = entries.filter((e) => e.level === 'warn').reduce((n, e) => n + e.count, 0);
    const er = entries.filter((e) => e.level === 'error').reduce((n, e) => n + e.count, 0);
    counts.innerHTML = [
      er ? `<span class="count err">${icon('circle-x')}${num(er)}</span>` : '',
      w ? `<span class="count warn">${icon('triangle-alert')}${num(w)}</span>` : '',
    ].join('');
  }

  function clearConsole() {
    entries = [];
    lastEntry = null;
    list.innerHTML = `<li class="console-empty">${esc(t('console.empty'))}</li>`;
    drawCounts();
  }

  function log(level, text) {
    if (lastEntry && lastEntry.level === level && lastEntry.text === text) {
      lastEntry.count += 1;
      lastEntry.el.querySelector('.log-count').textContent = `×${lastEntry.count}`;
      lastEntry.el.querySelector('.log-count').hidden = false;
      drawCounts();
      return;
    }
    if (!entries.length) list.innerHTML = '';
    const li = document.createElement('li');
    li.className = `log level-${level}`;
    li.innerHTML = `<span class="log-icon">${icon(LEVEL_ICON[level] || 'chevron-right')}</span><pre class="log-text">${esc(text)}</pre><span class="log-count" hidden></span>`;
    list.appendChild(li);
    lastEntry = { level, text, count: 1, el: li };
    entries.push(lastEntry);
    if (entries.length > 300) entries.shift().el.remove();
    list.scrollTop = list.scrollHeight;
    drawCounts();
  }

  // ------------------------------------------------------------ errors
  function phaseLabel(phase) {
    const key = `preview.phase.${phase}`;
    const label = t(key);
    return label === key ? t('preview.phase.runtime') : label;
  }

  function showError(err, source = lastSource) {
    const file = err.file || (err.phase === 'transpile' ? 'App.jsx' : '');
    const frame = err.line && (!file || file === 'App.jsx') ? codeFrame(source, err.line, err.column) : '';
    overlay.innerHTML = `
      <div class="eo-head">${icon('octagon-x')}<strong>${esc(phaseLabel(err.phase))}</strong></div>
      <p class="eo-msg" dir="ltr"><b>${esc(err.name || 'Error')}:</b> ${esc(err.message || '')}</p>
      ${err.line ? `<button type="button" class="eo-loc" data-out="goto" data-line="${err.line}" data-col="${err.column || 1}" dir="ltr">${icon('file-code')}${esc(`${file || 'App.jsx'}:${err.line}${err.column ? `:${err.column}` : ''}`)}</button>` : ''}
      ${frame ? `<pre class="eo-frame" dir="ltr">${esc(frame)}</pre>` : ''}
      ${err.componentStack ? `<details class="eo-stack"><summary>${esc(t('preview.componentStack'))}</summary><pre dir="ltr">${esc(err.componentStack)}</pre></details>` : ''}
      <p class="eo-hint">${icon('lightbulb')}<span>${esc(t('preview.fixHint'))}</span></p>`;
    overlay.hidden = false;
    stage.classList.add('has-error');
    setStatus('err', t('preview.error'), 'circle-x');
    if (opts.editor && err.line && (!file || file === 'App.jsx')) opts.editor.markLine(err.line);
    log('error', `${err.name || 'Error'}: ${err.message}${err.line ? `  (${file || 'App.jsx'}:${err.line})` : ''}`);
    if (opts.onError) opts.onError(err);
  }

  function hideError() {
    overlay.hidden = true;
    overlay.innerHTML = '';
    stage.classList.remove('has-error');
    if (opts.editor) opts.editor.markLine(null);
  }

  // ------------------------------------------------------------ preview
  const preview = createPreview(host, {
    title: t('preview.title'),
    onStart: () => {
      setStatus('busy', t(window.Babel ? 'preview.running' : 'preview.loadingCompiler'), 'loader-circle');
    },
    onConsole: ({ level, text }) => log(level, text),
    onClear: clearConsole,
    onError: (err) => showError(err),
    onRendered: () => {
      setStatus('ok', t('preview.live'), 'circle-dot');
      if (opts.onOk) opts.onOk();
    },
  });

  async function run(source) {
    lastSource = source;
    hideError();
    clearConsole();
    empty.hidden = true;
    return preview.run(source);
  }

  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-out]');
    if (!b) return;
    if (b.dataset.out === 'clear') clearConsole();
    if (b.dataset.out === 'reload' && lastSource) run(lastSource);
    if (b.dataset.out === 'goto' && opts.editor) opts.editor.goTo(Number(b.dataset.line), Number(b.dataset.col));
  });

  return {
    run,
    log,
    clearConsole,
    showError,
    hideError,
    dispose: () => preview.dispose(),
  };
}
