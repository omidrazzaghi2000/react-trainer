import { t, L } from '../i18n.js';
import { api } from '../api.js';
import { store } from '../store.js';
import { esc, icon, tx, debounce } from '../util.js';
import { createEditor, codeToolbar } from '../components/editor.js';
import { outputHTML, mountOutput } from '../components/preview.js';

const BLANK = `import { useState } from 'react';

export default function App() {
  const [name, setName] = useState('React');
  console.log('rendered with', name);

  return (
    <main className="card stack">
      <h1>Hello, {name}!</h1>
      <label className="row">
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
    </main>
  );
}
`;
const DRAFT = 'playground';

export function render(ctx) {
  const { root, lessons, categories } = ctx;
  ctx.setTitle(t('playground.title'));

  root.innerHTML = `
    <header class="page-head">
      <h1>${tx('playground.title')}</h1>
      <p>${tx('playground.sub')}</p>
    </header>
    <div class="play-toolbar">
      <label class="select-wrap">
        <span class="sr-only">${esc(t('playground.load'))}</span>
        <select class="input" id="loader">
          <option value="">${esc(t('playground.load'))}…</option>
          <option value="__blank">${esc(t('playground.blank'))}</option>
          ${categories.map((c) => `<optgroup label="${esc(L(c.title))}">${lessons.filter((l) => l.category === c.id).map((l) => `<option value="${esc(l.id)}">${esc(L(l.name))}</option>`).join('')}</optgroup>`).join('')}
        </select>
        ${icon('chevron-down')}
      </label>
      <span class="chip" dir="ltr">${icon('atom')}React ${esc(ctx.meta.react || '')}</span>
    </div>
    <div class="play-layout">
      <div class="code-panel editor">
        ${codeToolbar({
          file: 'App.jsx',
          buttons: `<label class="switch"><input type="checkbox" data-act="autorun" ${store.pref('autorun', true) ? 'checked' : ''}><span class="track" aria-hidden="true"></span><span class="switch-label">${esc(t('code.autoRun'))}</span></label>
            <button type="button" class="btn btn--accent btn--sm" data-act="run">${icon('play')}<span>${esc(t('code.run'))}</span></button>`,
        })}
        <div class="cm-host" id="pg-editor"></div>
        <div class="editor-hint">${icon('keyboard')} ${esc(t('code.editorHint'))}</div>
      </div>
      ${outputHTML('pg-out')}
    </div>
    <p class="play-note">${icon('shield-check')}<span>${tx('playground.note')}</span></p>`;

  const autoRun = debounce(() => { if (store.pref('autorun', true)) run(); }, 850);
  const editor = createEditor(root.querySelector('#pg-editor'), {
    value: store.loadDraft(DRAFT) ?? BLANK,
    onChange: (v) => {
      store.saveDraft(DRAFT, v);
      autoRun();
    },
    onRun: () => run(true),
  });
  const out = mountOutput(root.querySelector('#pg-out'), { editor });

  function run(manual = false) {
    out.run(editor.getValue());
    if (manual) store.recordRun();
  }

  root.querySelector('[data-act="run"]').addEventListener('click', () => run(true));
  root.addEventListener('change', (e) => {
    if (e.target.matches('[data-act="autorun"]')) store.setPref('autorun', e.target.checked);
  });
  root.querySelector('#loader').addEventListener('change', async (e) => {
    const id = e.target.value;
    e.target.value = '';
    if (!id) return;
    const code = id === '__blank' ? BLANK : (await api.lesson(id)).example.code;
    editor.setValue(code);
    store.saveDraft(DRAFT, code);
    run();
    editor.focus();
  });
  requestAnimationFrame(() => editor.refresh());
  run();
  return () => out.dispose();
}
