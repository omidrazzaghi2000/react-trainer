// CodeMirror 5 wrapper (JSX mode) used by the Code, Challenge and Playground views.

import { t } from '../i18n.js';
import { esc } from '../util.js';

/**
 * @param {HTMLElement} host
 * @param {{ value: string, readOnly?: boolean, onChange?: (v: string) => void, onRun?: () => void,
 *           label?: string, minLines?: number }} opts
 */
export function createEditor(host, { value, readOnly = false, onChange, onRun, label }) {
  if (!window.CodeMirror) {
    // Fallback: plain textarea / pre if CodeMirror failed to load.
    host.innerHTML = readOnly
      ? `<pre class="code-fallback">${esc(value)}</pre>`
      : `<textarea class="code-fallback" spellcheck="false" aria-label="${esc(label || t('code.editorLabel'))}">${esc(value)}</textarea>`;
    const ta = host.querySelector('textarea');
    if (ta && onChange) ta.addEventListener('input', () => onChange(ta.value));
    if (ta && onRun) ta.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onRun(); });
    return {
      getValue: () => (ta ? ta.value : value),
      setValue: (v) => { if (ta) ta.value = v; },
      highlight: () => {},
      markLine: () => {},
      refresh: () => {},
      focus: () => ta && ta.focus(),
      goTo: () => {},
    };
  }

  const runKey = () => { if (onRun) onRun(); };
  const cm = window.CodeMirror(host, {
    value,
    mode: 'jsx',
    theme: 'clay',
    lineNumbers: true,
    readOnly,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    matchBrackets: true,
    autoCloseBrackets: !readOnly,
    autoCloseTags: !readOnly,
    styleActiveLine: !readOnly,
    viewportMargin: Infinity,
    direction: 'ltr',
    screenReaderLabel: label || t('code.editorLabel'),
    extraKeys: readOnly
      ? { Tab: false, 'Shift-Tab': false }
      : {
          'Ctrl-Enter': runKey,
          'Cmd-Enter': runKey,
          'Ctrl-S': runKey,
          'Cmd-S': runKey,
          'Ctrl-/': 'toggleComment',
          'Cmd-/': 'toggleComment',
          Esc: (ed) => { ed.state.tabEscape = true; },
          Tab: (ed) => {
            if (ed.state.tabEscape) { ed.state.tabEscape = false; return window.CodeMirror.Pass; }
            if (ed.somethingSelected()) ed.indentSelection('add');
            else ed.replaceSelection(' '.repeat(ed.getOption('indentUnit')), 'end');
            return undefined;
          },
          'Shift-Tab': (ed) => {
            if (ed.state.tabEscape) { ed.state.tabEscape = false; return window.CodeMirror.Pass; }
            ed.indentSelection('subtract');
            return undefined;
          },
        },
  });
  cm.on('keydown', (ed, e) => {
    if (e.key !== 'Escape' && e.key !== 'Tab' && e.key !== 'Shift') ed.state.tabEscape = false;
  });
  if (onChange) cm.on('change', (ed, change) => { if (change.origin !== 'setValue') onChange(cm.getValue()); });

  let marked = [];
  let errorLine = null;
  const scrollToLine = (line) => {
    const top = cm.charCoords({ line: line - 1, ch: 0 }, 'page').top;
    const rect = host.getBoundingClientRect();
    if (top < window.scrollY + 90 || top > window.scrollY + window.innerHeight - 80 || rect.top < 0) {
      window.scrollTo({ top: Math.max(0, top - 160), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  return {
    cm,
    getValue: () => cm.getValue(),
    setValue: (v) => cm.setValue(v),
    focus: () => cm.focus(),
    refresh: () => cm.refresh(),
    /** Highlights a 1-based inclusive line range, or clears when range is null. */
    highlight(range) {
      marked.forEach((ln) => cm.removeLineClass(ln, 'background', 'cm-hl'));
      marked = [];
      if (!range) return;
      const [a, b] = range;
      for (let ln = a - 1; ln <= b - 1 && ln < cm.lineCount(); ln++) {
        cm.addLineClass(ln, 'background', 'cm-hl');
        marked.push(ln);
      }
      scrollToLine(a);
    },
    /** Marks the line of an error (1-based) or clears it with null. */
    markLine(line) {
      if (errorLine !== null) cm.removeLineClass(errorLine, 'background', 'cm-err');
      errorLine = null;
      if (!line || line < 1 || line > cm.lineCount()) return;
      errorLine = line - 1;
      cm.addLineClass(errorLine, 'background', 'cm-err');
    },
    goTo(line, column = 1) {
      if (!line) return;
      cm.focus();
      cm.setCursor({ line: line - 1, ch: Math.max(0, column - 1) });
      scrollToLine(line);
    },
  };
}

export function codeToolbar({ file, buttons }) {
  return `<div class="code-toolbar">
    <span class="file-chip" dir="ltr"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>${esc(file)}</span>
    ${buttons}
  </div>`;
}
