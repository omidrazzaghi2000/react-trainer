import { t, L, other, num, lang } from '../i18n.js';
import { api } from '../api.js';
import { store } from '../store.js';
import { esc, icon, rich, toast, confetti, confirmDialog, copyText, debounce } from '../util.js';
import { renderDiagram, renderLegend } from '../components/diagram.js';
import { mountQuiz } from '../components/quiz.js';
import { createEditor, codeToolbar } from '../components/editor.js';
import { outputHTML, mountOutput } from '../components/preview.js';
import { runTests } from '../components/sandbox.js';

const TABS = [
  { id: 'overview', icon: 'book-open' },
  { id: 'structure', icon: 'network' },
  { id: 'code', icon: 'code-xml' },
  { id: 'quiz', icon: 'list-checks' },
  { id: 'challenge', icon: 'puzzle' },
];

// Per-lesson UI state that should survive re-renders (e.g. language switch).
const quizStates = new Map();
const hintsShown = new Map();
const exampleEdits = new Map();
const checkResults = new Map();

export function render(ctx) {
  const { root, params, catById } = ctx;
  const id = params.id;
  let disposed = false;
  let panelCleanup = null;

  root.innerHTML = `<div class="skeleton" style="height:260px"></div><div class="skeleton" style="height:64px;margin-top:24px;border-radius:999px"></div><div class="skeleton" style="height:320px;margin-top:24px"></div>`;

  api.lesson(id).then((p) => {
    if (disposed) return;
    const cat = catById.get(p.category);
    ctx.setTitle(L(p.name));
    const tab = TABS.some((x) => x.id === params.tab) ? params.tab : 'overview';
    const levelIndex = ctx.categories.findIndex((c) => c.id === p.category) + 1;

    root.innerHTML = `
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="#/lessons">${esc(t('nav.lessons'))}</a>${icon('chevron-right', 'flip-rtl')}
        <a href="#/lessons?cat=${esc(p.category)}">${rich(L(cat.name))}</a>${icon('chevron-right', 'flip-rtl')}
        <span aria-current="page">${rich(L(p.name))}</span>
      </nav>
      <section class="block phero" data-cat="${esc(p.category)}" aria-labelledby="p-title">
        <span class="phero-icon" aria-hidden="true">${icon(p.icon)}</span>
        <div>
          <div class="phero-meta">
            <span class="chip chip--light">${icon(cat.icon)}${esc(t('home.levelN', { n: levelIndex }))} · ${rich(L(cat.name))}</span>
            <span class="chip chip--light">${icon('flask-conical')}${esc(t('training.checks', { n: (p.exercise.checks || []).length }))}</span>
          </div>
          <h1 id="p-title">${rich(L(p.name))}</h1>
          <p class="alt-name" lang="${lang() === 'fa' ? 'en' : 'fa'}">${esc(other(p.name))}</p>
          <p class="tagline">${rich(L(p.tagline))}</p>
          <div class="journey" id="journey"></div>
        </div>
        <div class="phero-actions">
          <button type="button" class="btn btn--light" id="learned-btn"></button>
        </div>
      </section>
      <div class="tabs-wrap">
        <div class="tabs" role="tablist" aria-label="${esc(t('lesson.tabsLabel'))}" data-cat="${esc(p.category)}">
          ${TABS.map((x) => `<button type="button" role="tab" class="tab" id="tab-${x.id}" data-tab="${x.id}" aria-controls="panel" aria-selected="${x.id === tab}" tabindex="${x.id === tab ? 0 : -1}">${icon(x.icon)}<span>${esc(t(`lesson.tabs.${x.id}`))}</span></button>`).join('')}
        </div>
      </div>
      <div id="panel" class="tabpanel" role="tabpanel" tabindex="-1" data-cat="${esc(p.category)}"></div>
      <nav class="pager" aria-label="${esc(t('lesson.prev'))} / ${esc(t('lesson.next'))}">
        ${p.prev ? `<a href="#/l/${esc(p.prev.id)}" data-cat="${esc(p.prev.category)}">${icon('arrow-left', 'flip-rtl')}<span class="icon-tile" aria-hidden="true">${icon(p.prev.icon)}</span><span><small>${esc(t('lesson.prev'))}</small><strong>${rich(L(p.prev.name))}</strong></span></a>` : '<span></span>'}
        ${p.next ? `<a class="next" href="#/l/${esc(p.next.id)}" data-cat="${esc(p.next.category)}"><span><small>${esc(t('lesson.next'))}</small><strong>${rich(L(p.next.name))}</strong></span><span class="icon-tile" aria-hidden="true">${icon(p.next.icon)}</span>${icon('arrow-right', 'flip-rtl')}</a>` : ''}
      </nav>`;

    const panel = root.querySelector('#panel');
    const learnedBtn = root.querySelector('#learned-btn');

    function updateHeroState() {
      const learned = store.isLearned(p.id);
      learnedBtn.setAttribute('aria-pressed', String(learned));
      learnedBtn.innerHTML = `${icon(learned ? 'bookmark-check' : 'bookmark')}${esc(t(learned ? 'lesson.learned' : 'lesson.markLearned'))}`;
      const q = store.quizBest(p.id);
      const solved = store.isSolved(p.id);
      root.querySelector('#journey').innerHTML = [
        { done: learned, icon: 'book-open', label: t('lesson.journey.read') },
        { done: q && q.best === q.total, icon: 'list-checks', label: q ? `${t('lesson.journey.quiz')} ${num(q.best)}/${num(q.total)}` : t('lesson.journey.quiz') },
        { done: solved, icon: 'puzzle', label: t('lesson.journey.challenge') },
      ].map((s) => `<span class="journey-step ${s.done ? 'done' : ''}">${icon(s.done ? 'circle-check' : s.icon)}<span>${esc(s.label)}</span></span>`).join('');
    }
    updateHeroState();

    learnedBtn.addEventListener('click', () => {
      const wasLearned = store.isLearned(p.id);
      store.toggleLearned(p.id);
      updateHeroState();
      if (!wasLearned) toast(t('toast.learned'), { iconName: 'bookmark-check', tone: 'green', timeout: 2000 });
    });

    function selectTab(next, { focusPanel = false, push = true } = {}) {
      if (typeof panelCleanup === 'function') panelCleanup();
      panelCleanup = null;
      root.querySelectorAll('[role="tab"]').forEach((b) => {
        const on = b.dataset.tab === next;
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', `tab-${next}`);
      if (push) history.replaceState(null, '', `#/l/${p.id}${next === 'overview' ? '' : `/${next}`}`);
      panel.style.animation = 'none';
      void panel.offsetWidth; // restart the entrance animation
      panel.style.animation = '';
      // A fresh host per tab, so listeners from the previous tab are dropped with it.
      const host = document.createElement('div');
      panel.replaceChildren(host);
      panelCleanup = PANELS[next](host, p, { updateHeroState, selectTab });
      if (focusPanel) panel.focus({ preventScroll: true });
    }

    const tablist = root.querySelector('[role="tablist"]');
    tablist.addEventListener('click', (e) => {
      const b = e.target.closest('[role="tab"]');
      if (!b) return;
      selectTab(b.dataset.tab);
      const top = root.querySelector('.tabs-wrap').getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo({ top });
    });
    tablist.addEventListener('keydown', (e) => {
      const tabs = [...tablist.querySelectorAll('[role="tab"]')];
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const rtl = document.documentElement.dir === 'rtl';
      let j = null;
      if (e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) j = (i + 1) % tabs.length;
      else if (e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      tabs[j].focus();
      selectTab(tabs[j].dataset.tab);
    });

    selectTab(tab, { push: false });
  }).catch((err) => {
    if (disposed) return;
    console.error(err);
    ctx.setTitle(t('lesson.notFound'));
    root.innerHTML = `<div class="clay empty-state" style="padding:32px">${icon('circle-help', 'icon--xl')}<h1>${esc(err.status === 404 ? t('lesson.notFound') : t('loadFailed'))}</h1><a class="btn btn--primary" href="#/lessons">${icon('arrow-left', 'flip-rtl')}${esc(t('lesson.backToLibrary'))}</a></div>`;
  });

  return () => {
    disposed = true;
    if (typeof panelCleanup === 'function') panelCleanup();
  };
}

// ------------------------------------------------------------------ helpers

function listCard(title, iconName, tone, items, itemIcon) {
  return `<article class="card tone-${tone}">
    <h3><span class="card-title-icon">${icon(iconName)}</span>${esc(title)}</h3>
    <ul class="list-clean">${items.map((s) => `<li>${icon(itemIcon)}<span>${rich(s)}</span></li>`).join('')}</ul>
  </article>`;
}

function autoRunToggle() {
  const on = store.pref('autorun', true);
  return `<label class="switch" title="${esc(t('code.autoRun'))}"><input type="checkbox" data-act="autorun" ${on ? 'checked' : ''}><span class="track" aria-hidden="true"></span><span class="switch-label">${esc(t('code.autoRun'))}</span></label>`;
}

/** Wires an editable editor to an output panel: Run, Ctrl+Enter and debounced auto-run. */
function workbench(panel, { editorHost, outputEl, value, onChange, onManualRun }) {
  let out = null;
  const autoRun = debounce(() => {
    if (store.pref('autorun', true)) run();
  }, 850);
  const editor = createEditor(editorHost, {
    value,
    onChange: (v) => {
      if (onChange) onChange(v);
      autoRun();
    },
    onRun: () => run({ manual: true }),
  });
  out = mountOutput(outputEl, { editor });
  function run({ manual = false } = {}) {
    const result = out.run(editor.getValue());
    if (manual && onManualRun) onManualRun();
    return result;
  }
  panel.addEventListener('change', (e) => {
    if (e.target.matches('[data-act="autorun"]')) store.setPref('autorun', e.target.checked);
  });
  return { editor, out, run };
}

// ------------------------------------------------------------------ panels

const PANELS = {
  overview(panel, p) {
    panel.innerHTML = `<div class="stack">
      <section class="block intent-card" data-cat="${esc(p.category)}">
        <span class="label">${icon('target')}${esc(t('lesson.intent'))}</span>
        <p class="intent-text">${rich(L(p.intent))}</p>
        ${p.aka ? `<p style="margin:16px 0 0;opacity:.95"><strong>${esc(t('lesson.aka'))}:</strong> ${rich(L(p.aka))}</p>` : ''}
      </section>
      <div class="grid-2">
        <article class="card tone-red"><h3><span class="card-title-icon">${icon('triangle-alert')}</span>${esc(t('lesson.problem'))}</h3><div class="prose"><p>${rich(L(p.problem))}</p></div></article>
        <article class="card tone-green"><h3><span class="card-title-icon">${icon('lightbulb')}</span>${esc(t('lesson.solution'))}</h3><div class="prose"><p>${rich(L(p.solution))}</p></div></article>
      </div>
      <article class="card tone-pink"><h3><span class="card-title-icon">${icon('heart')}</span>${esc(t('lesson.analogy'))}</h3><div class="prose"><p>${rich(L(p.analogy))}</p></div></article>
      <div class="grid-3">
        ${listCard(t('lesson.whenToUse'), 'circle-help', 'indigo', L(p.whenToUse), 'check')}
        ${listCard(t('lesson.bestPractices'), 'thumbs-up', 'green', L(p.bestPractices), 'check')}
        ${listCard(t('lesson.pitfalls'), 'bug', 'red', L(p.pitfalls), 'x')}
      </div>
      <article class="card tone-violet">
        <h3><span class="card-title-icon">${icon('zap')}</span>${esc(t('lesson.proTips'))}</h3>
        <ol class="tips-list">${L(p.proTips).map((s) => `<li>${rich(s)}</li>`).join('')}</ol>
      </article>
      <article class="card tone-amber">
        <h3><span class="card-title-icon">${icon('map')}</span>${esc(t('lesson.realWorld'))}</h3>
        <ul class="list-clean">${L(p.realWorld).map((s) => `<li>${icon('arrow-up-right', 'flip-rtl')}<span>${rich(s)}</span></li>`).join('')}</ul>
      </article>
      ${p.related && p.related.some((r) => r.lesson) ? `<section>
        <h2 style="display:flex;gap:10px;align-items:center">${icon('git-compare')}${esc(t('lesson.related'))}</h2>
        <div class="related-grid">${p.related.filter((r) => r.lesson).map((r) => `<a class="related-card" data-cat="${esc(r.lesson.category)}" href="#/l/${esc(r.id)}">
          <span class="icon-tile" aria-hidden="true">${icon(r.lesson.icon)}</span>
          <span><h4>${rich(L(r.lesson.name))}</h4><p>${rich(L(r.note))}</p></span>
        </a>`).join('')}</div>
      </section>` : ''}
    </div>`;
  },

  structure(panel, p) {
    const legend = t('lesson.legend');
    panel.innerHTML = `<div class="stack">
      <section class="card diagram-card">
        <h2 style="display:flex;gap:10px;align-items:center">${icon('network')}${esc(t('lesson.diagram'))}</h2>
        <div class="diagram-scroll">${renderDiagram(p.diagram, { category: p.category, title: t('lesson.diagramLabel', { name: L(p.name) }) })}</div>
        <div class="diagram-legend">${renderLegend(p.diagram, legend)}</div>
      </section>
      <section class="card">
        <h2 style="display:flex;gap:10px;align-items:center">${icon('component')}${esc(t('lesson.concepts'))}</h2>
        <div class="participants">${p.concepts.map((c) => `<div class="participant"><code dir="ltr">${esc(c.name)}</code><p>${rich(L(c.role))}</p></div>`).join('')}</div>
      </section>
      <section class="card">
        <h2 style="display:flex;gap:10px;align-items:center">${icon('list-ordered')}${esc(t('lesson.steps'))}</h2>
        <ol class="steps-list">${L(p.steps).map((s) => `<li><p>${rich(s)}</p></li>`).join('')}</ol>
      </section>
    </div>`;
  },

  code(panel, p) {
    const ex = p.example;
    const value = exampleEdits.get(p.id) ?? ex.code;
    panel.innerHTML = `<div class="stack">
      <header>
        <h2>${rich(L(ex.title))}</h2>
        <p class="prose" style="color:var(--color-muted-foreground)">${rich(L(ex.description))}</p>
      </header>
      <div class="code-layout">
        <div class="code-main">
          <div class="code-panel editor">
            ${codeToolbar({
              file: 'App.jsx',
              buttons: `${autoRunToggle()}
                <button type="button" class="btn btn--ghost btn--sm" data-act="copy">${icon('copy')}<span>${esc(t('code.copy'))}</span></button>
                <button type="button" class="btn btn--ghost btn--sm" data-act="reset">${icon('rotate-ccw')}<span>${esc(t('code.reset'))}</span></button>
                <button type="button" class="btn btn--accent btn--sm" data-act="run">${icon('play')}<span>${esc(t('code.run'))}</span></button>`,
            })}
            <div class="cm-host" id="ex-editor"></div>
            <div class="editor-hint">${icon('keyboard')} ${esc(t('code.editorHint'))}</div>
          </div>
          <p class="edited-note" id="edited" ${value === ex.code ? 'hidden' : ''}>${icon('info')}<span>${esc(t('code.edited'))}</span></p>
          ${outputHTML('ex-out')}
        </div>
        <aside class="card walkthrough" aria-labelledby="walk-title">
          <h3 id="walk-title"><span class="card-title-icon">${icon('footprints')}</span>${esc(t('lesson.walkthrough'))}</h3>
          <p style="color:var(--color-muted-foreground);font-size:.92rem">${esc(t('lesson.walkHint'))}</p>
          <ol class="walk-list">${ex.highlights.map((h, i) => `<li><button type="button" class="walk-btn" data-hl="${i}" aria-pressed="false">
            <span class="lines" dir="ltr">${esc(`L${h.lines[0]}–${h.lines[1]}`)}</span><span>${rich(L(h.note))}</span>
          </button></li>`).join('')}</ol>
        </aside>
      </div>
    </div>`;

    const edited = panel.querySelector('#edited');
    const wb = workbench(panel, {
      editorHost: panel.querySelector('#ex-editor'),
      outputEl: panel.querySelector('#ex-out'),
      value,
      onChange: (v) => {
        exampleEdits.set(p.id, v);
        edited.hidden = v === ex.code;
      },
      onManualRun: () => store.recordRun(),
    });
    wb.run();

    panel.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]');
      if (act && act.dataset.act === 'run') {
        wb.run({ manual: true });
      }
      if (act && act.dataset.act === 'reset') {
        wb.editor.setValue(ex.code);
        exampleEdits.delete(p.id);
        edited.hidden = true;
        wb.run();
      }
      if (act && act.dataset.act === 'copy') {
        if (await copyText(wb.editor.getValue())) {
          const label = act.querySelector('span');
          label.textContent = t('code.copied');
          setTimeout(() => { label.textContent = t('code.copy'); }, 1600);
        }
      }
      const hl = e.target.closest('[data-hl]');
      if (hl) {
        const on = hl.getAttribute('aria-pressed') !== 'true';
        panel.querySelectorAll('[data-hl]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
        hl.setAttribute('aria-pressed', String(on));
        wb.editor.highlight(on ? ex.highlights[Number(hl.dataset.hl)].lines : null);
      }
    });
    requestAnimationFrame(() => wb.editor.refresh());
    return () => wb.out.dispose();
  },

  quiz(panel, p, { updateHeroState }) {
    if (!quizStates.has(p.id)) quizStates.set(p.id, { index: 0, picks: [] });
    const best = store.quizBest(p.id);
    panel.innerHTML = `<p class="prose" style="text-align:center;margin-inline:auto;color:var(--color-muted-foreground)">${esc(t('lesson.quizIntro'))}${best ? ` <strong>${esc(t('lesson.bestScore', { n: best.best, m: best.total }))}</strong>` : ''}</p><div id="quiz-root"></div>`;
    mountQuiz(panel.querySelector('#quiz-root'), {
      questions: p.quiz,
      state: quizStates.get(p.id),
      category: p.category,
      onComplete: (score, total) => {
        store.recordQuiz(p.id, score, total);
        updateHeroState();
      },
      extraResultButtons: `<a class="btn btn--accent" href="#/l/${esc(p.id)}/challenge">${icon('puzzle')}${esc(t('lesson.tabs.challenge'))}</a>`,
    });
  },

  challenge(panel, p, { updateHeroState }) {
    const x = p.exercise;
    const draftKey = `ex.${p.id}`;
    const hints = L(x.hints);
    const names = x.checks || [];
    if (!hintsShown.has(p.id)) hintsShown.set(p.id, 0);

    panel.innerHTML = `<div class="challenge-grid">
      <div class="challenge-side stack">
        <section class="card">
          <span class="chip chip--cat" style="margin-bottom:12px">${icon('puzzle')}${esc(t('challenge.task'))}</span>${store.isSolved(p.id) ? ` <span class="chip chip--success" style="margin-bottom:12px">${icon('circle-check')}${esc(t('challenge.alreadySolved'))}</span>` : ''}
          <h2>${rich(L(x.title))}</h2>
          <p>${rich(L(x.task))}</p>
        </section>
        <section class="card checks-card" aria-labelledby="checks-title">
          <h3 id="checks-title"><span class="card-title-icon">${icon('flask-conical')}</span>${esc(t('challenge.checks'))}</h3>
          <p class="checks-sub" id="checks-summary" aria-live="polite">${esc(t('challenge.checksSub'))}</p>
          <ol class="check-list" id="checks"></ol>
          <button type="button" class="btn btn--light btn--sm" data-act="tests" aria-expanded="false" style="margin-top:14px">${icon('eye')}<span>${esc(t('challenge.viewTests'))}</span></button>
        </section>
        <section class="card">
          <h3><span class="card-title-icon tone-amber">${icon('lightbulb')}</span>${esc(t('challenge.hints'))}</h3>
          <ol class="hint-list" id="hints"></ol>
          <button type="button" class="btn btn--light btn--sm" id="hint-btn" style="margin-top:16px"></button>
        </section>
      </div>
      <div class="challenge-main">
        <div class="code-panel editor">
          ${codeToolbar({
            file: 'App.jsx',
            buttons: `${autoRunToggle()}
              <button type="button" class="btn btn--ghost btn--sm" data-act="reset">${icon('rotate-ccw')}<span>${esc(t('code.reset'))}</span></button>
              <button type="button" class="btn btn--ghost btn--sm" data-act="solution">${icon('eye')}<span>${esc(t('challenge.solution'))}</span></button>
              <button type="button" class="btn btn--primary btn--sm" data-act="run">${icon('play')}<span>${esc(t('code.run'))}</span></button>
              <button type="button" class="btn btn--success btn--sm" data-act="check">${icon('check-check')}<span>${esc(t('challenge.check'))}</span></button>`,
          })}
          <div class="cm-host" id="x-editor"></div>
          <div class="editor-hint">${icon('keyboard')} ${esc(t('code.editorHint'))}</div>
        </div>
        <div id="pass-slot" aria-live="polite"></div>
        <section class="card tests-view" id="tests-view" hidden>
          <h3>${icon('file-code')}<span dir="ltr">${esc(t('challenge.testsTitle'))}</span></h3>
          <p class="checks-sub">${esc(t('challenge.testsNote'))}</p>
          <div class="code-panel"><div class="cm-host" id="tests-editor"></div></div>
        </section>
        ${outputHTML('x-out')}
      </div>
    </div>`;

    const checksEl = panel.querySelector('#checks');
    const summaryEl = panel.querySelector('#checks-summary');

    function drawChecks(results = checkResults.get(p.id), running = false) {
      const count = Math.max(names.length, results ? results.length : 0);
      if (!count) {
        checksEl.innerHTML = `<li class="check pending">${icon('circle')}<span>${esc(t('challenge.noChecks'))}</span></li>`;
        return;
      }
      checksEl.innerHTML = Array.from({ length: count }, (_, i) => {
        const r = results && results[i];
        const name = (r && r.name) || names[i] || { en: `Test ${i + 1}`, fa: `تست ${i + 1}` };
        const state = r ? (r.ok ? 'pass' : 'fail') : running ? 'running' : 'pending';
        const iconName = { pass: 'circle-check', fail: 'circle-x', running: 'loader-circle', pending: 'circle' }[state];
        const body = `${icon(iconName, state === 'running' ? 'spin' : '')}<span class="check-name">${rich(L(name))}</span>`;
        if (state === 'fail' && r.error) {
          return `<li class="check fail"><details><summary>${body}</summary><pre class="check-error" dir="ltr">${esc(r.error.message)}${r.error.line ? `\n  at ${esc(r.error.file || 'App.jsx')}:${r.error.line}` : ''}</pre></details></li>`;
        }
        return `<li class="check ${state}">${body}${r ? `<span class="check-ms">${esc(t('challenge.ms', { n: r.ms }))}</span>` : ''}</li>`;
      }).join('');
      if (results && results.length && !running) {
        const passed = results.filter((r) => r.ok).length;
        summaryEl.innerHTML = `<strong class="${passed === results.length ? 'ok' : 'bad'}">${esc(t('challenge.summary', { n: passed, m: results.length }))}</strong>${passed < results.length ? ` · ${esc(t('challenge.failedHint'))}` : ''}`;
      }
    }
    drawChecks();

    const hintList = panel.querySelector('#hints');
    const hintBtn = panel.querySelector('#hint-btn');
    function drawHints() {
      const n = hintsShown.get(p.id);
      hintList.innerHTML = hints.slice(0, n).map((h) => `<li>${icon('lightbulb')}<span>${rich(h)}</span></li>`).join('');
      hintList.hidden = n === 0;
      if (n >= hints.length) {
        hintBtn.disabled = true;
        hintBtn.innerHTML = `${icon('check')}${esc(t('challenge.noMoreHints'))}`;
      } else {
        hintBtn.disabled = false;
        hintBtn.innerHTML = `${icon('lightbulb')}${esc(t('challenge.showHint', { n: n + 1, m: hints.length }))}`;
      }
    }
    drawHints();
    hintBtn.addEventListener('click', () => {
      hintsShown.set(p.id, Math.min(hints.length, hintsShown.get(p.id) + 1));
      drawHints();
    });

    const wb = workbench(panel, {
      editorHost: panel.querySelector('#x-editor'),
      outputEl: panel.querySelector('#x-out'),
      value: store.loadDraft(draftKey) ?? x.starter,
      onChange: (v) => store.saveDraft(draftKey, v),
      onManualRun: () => store.recordRun(),
    });
    wb.run();

    let testsEditor = null;
    const buttons = panel.querySelectorAll('.code-toolbar button');
    let checking = false;

    async function check() {
      if (checking) return;
      checking = true;
      buttons.forEach((b) => { b.disabled = true; });
      const checkBtn = panel.querySelector('[data-act="check"] span');
      checkBtn.textContent = t('challenge.checking');
      const slot = panel.querySelector('#pass-slot');
      slot.innerHTML = '';
      const code = wb.editor.getValue();
      const live = [];
      drawChecks(null, true);
      summaryEl.textContent = t('challenge.checking');
      wb.run();
      try {
        const res = await runTests(code, x.tests, {
          onResult: (r, i) => {
            live[i] = r;
            drawChecks(live, true);
          },
        });
        if (res.error && !res.results) {
          wb.out.showError(res.error, code);
          const failed = (names.length ? names : [{ en: 'Test', fa: 'تست' }]).map((name) => ({ name, ok: false, ms: 0, error: { message: `${res.error.name || 'Error'}: ${res.error.message}` } }));
          checkResults.set(p.id, failed);
        } else {
          checkResults.set(p.id, res.results);
        }
        drawChecks();
        if (res.ok) {
          slot.innerHTML = `<div class="pass-banner">${icon('trophy')}<div><h3>${esc(t('challenge.passed'))}</h3><p>${esc(t('challenge.passedBody'))}</p></div></div>`;
          confetti();
          store.recordExercise(p.id);
          updateHeroState();
        }
      } catch (err) {
        wb.out.showError({ phase: 'loader', name: err.name, message: err.message });
        drawChecks(null);
      } finally {
        checking = false;
        buttons.forEach((b) => { b.disabled = false; });
        checkBtn.textContent = t('challenge.check');
      }
    }

    panel.addEventListener('click', async (e) => {
      const act = e.target.closest('[data-act]');
      if (!act) return;
      if (act.dataset.act === 'run') wb.run({ manual: true });
      if (act.dataset.act === 'check') check();
      if (act.dataset.act === 'tests') {
        const view = panel.querySelector('#tests-view');
        view.hidden = !view.hidden;
        act.setAttribute('aria-expanded', String(!view.hidden));
        act.querySelector('span').textContent = t(view.hidden ? 'challenge.viewTests' : 'challenge.hideTests');
        if (!view.hidden && !testsEditor) testsEditor = createEditor(panel.querySelector('#tests-editor'), { value: x.tests, readOnly: true });
        if (!view.hidden) {
          testsEditor.refresh();
          view.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
      if (act.dataset.act === 'reset') {
        if (await confirmDialog({ title: t('challenge.resetTitle'), body: t('challenge.resetBody'), confirmLabel: t('code.reset'), danger: true })) {
          wb.editor.setValue(x.starter);
          store.clearDraft(draftKey);
          wb.run();
        }
      }
      if (act.dataset.act === 'solution') {
        if (await confirmDialog({ title: t('challenge.solutionTitle'), body: t('challenge.solutionBody'), confirmLabel: t('challenge.solution') })) {
          const { code } = await api.solution(p.id);
          wb.editor.setValue(code);
          store.saveDraft(draftKey, code);
          wb.run();
        }
      }
    });
    wb.editor.cm && wb.editor.cm.setOption('extraKeys', {
      ...wb.editor.cm.getOption('extraKeys'),
      'Shift-Ctrl-Enter': () => check(),
      'Shift-Cmd-Enter': () => check(),
    });
    requestAnimationFrame(() => wb.editor.refresh());
    return () => wb.out.dispose();
  },
};
