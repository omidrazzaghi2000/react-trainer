/* A tiny Testing Library + Jest look-alike, shared by the browser sandbox and
 * the Node (jsdom) validator, so a challenge is judged the same way in both.
 *
 *   test({ en, fa }, async () => {
 *     render(<App />);
 *     await user.click(screen.getByRole('button', { name: /add/i }));
 *     expect(screen.getByText('1 item')).toBeInTheDocument();
 *   });
 *
 * Queries follow Testing Library's semantics (getBy / queryBy / findBy /
 * getAllBy …), `user` wraps realistic DOM events in React's act(), and
 * `expect` covers the common Jest and jest-dom matchers. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TrainerTestKit = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ------------------------------------------------------------ formatting
  const MAX_DEPTH = 3;

  function isElementLike(v) {
    return v && typeof v === 'object' && typeof v.nodeType === 'number' && typeof v.nodeName === 'string';
  }

  function isReactElement(v) {
    return v && typeof v === 'object' && typeof v.$$typeof === 'symbol' && 'type' in v && 'props' in v;
  }

  function typeName(t) {
    if (typeof t === 'string') return t;
    if (typeof t === 'function') return t.displayName || t.name || 'Anonymous';
    if (t && typeof t === 'object') return t.displayName || (t.render && (t.render.displayName || t.render.name)) || 'Component';
    return String(t);
  }

  /** A compact, safe, human-readable rendering of any value (like Node's util.inspect). */
  function inspect(value, depth = 0, seen = new Set()) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    const type = typeof value;
    if (type === 'string') return depth === 0 ? value : JSON.stringify(value);
    if (type === 'number' || type === 'boolean' || type === 'bigint') return String(value);
    if (type === 'symbol') return value.toString();
    if (type === 'function') return `ƒ ${value.name || 'anonymous'}()`;
    if (value instanceof Error) return depth === 0 ? `${value.name}: ${value.message}` : `[${value.name}: ${value.message}]`;
    if (isElementLike(value)) {
      if (value.nodeType === 3) return JSON.stringify(value.textContent);
      const id = value.id ? `#${value.id}` : '';
      const cls = typeof value.className === 'string' && value.className ? `.${value.className.trim().split(/\s+/).join('.')}` : '';
      return `<${value.nodeName.toLowerCase()}${id}${cls}>`;
    }
    if (isReactElement(value)) return `<${typeName(value.type)} />`;
    if (seen.has(value)) return '[Circular]';
    if (depth >= MAX_DEPTH) return Array.isArray(value) ? '[Array]' : '[Object]';
    seen.add(value);
    try {
      if (Array.isArray(value)) {
        const items = value.slice(0, 30).map((v) => inspect(v, depth + 1, seen));
        if (value.length > 30) items.push(`… ${value.length - 30} more`);
        return `[${items.join(', ')}]`;
      }
      if (value instanceof Map) return `Map(${value.size}) {${[...value].slice(0, 20).map(([k, v]) => `${inspect(k, depth + 1, seen)} => ${inspect(v, depth + 1, seen)}`).join(', ')}}`;
      if (value instanceof Set) return `Set(${value.size}) {${[...value].slice(0, 20).map((v) => inspect(v, depth + 1, seen)).join(', ')}}`;
      if (value instanceof Date) return isNaN(value) ? 'Invalid Date' : value.toISOString();
      if (typeof value.then === 'function') return 'Promise {…}';
      const keys = Object.keys(value);
      const ctor = value.constructor && value.constructor.name && value.constructor.name !== 'Object' ? `${value.constructor.name} ` : '';
      if (!keys.length) return `${ctor}{}`;
      const body = keys.slice(0, 30).map((k) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${inspect(value[k], depth + 1, seen)}`);
      if (keys.length > 30) body.push(`… ${keys.length - 30} more`);
      return `${ctor}{ ${body.join(', ')} }`;
    } finally {
      seen.delete(value);
    }
  }

  /** console.* argument formatting, including %s / %d / %o / %c substitutions. */
  function format(args) {
    const list = Array.from(args);
    let out = '';
    if (typeof list[0] === 'string' && /%[sdifoOc%]/.test(list[0])) {
      const fmt = list.shift();
      out = fmt.replace(/%([sdifoOc%])/g, (m, k) => {
        if (k === '%') return '%';
        if (!list.length) return m;
        const v = list.shift();
        if (k === 'c') return '';
        if (k === 's') return typeof v === 'string' ? v : inspect(v, 1);
        if (k === 'd' || k === 'i') return String(parseInt(v, 10));
        if (k === 'f') return String(parseFloat(v));
        return inspect(v, 1);
      });
    }
    const rest = list.map((v) => inspect(v));
    return [out, ...rest].filter((s, i) => i > 0 || s !== '').join(' ');
  }

  // ------------------------------------------------------------ deep equality
  function equals(a, b, seen = []) {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
    if (seen.some(([x, y]) => x === a && y === b)) return true;
    seen.push([a, b]);
    if (a instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof RegExp) return String(a) === String(b);
    if (a instanceof Map || a instanceof Set) {
      if (a.size !== b.size) return false;
      const bi = [...b];
      return [...a].every((x, i) => equals(x, bi[i], seen));
    }
    if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => equals(x, b[i], seen));
    const ka = Object.keys(a).filter((k) => a[k] !== undefined);
    const kb = Object.keys(b).filter((k) => b[k] !== undefined);
    return ka.length === kb.length && ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && equals(a[k], b[k], seen));
  }

  // ------------------------------------------------------------ the kit
  /**
   * @param {{ React: any, ReactDOMClient: any, window: Window, timeoutMs?: number }} env
   */
  function createTestKit(env) {
    const { React, ReactDOMClient } = env;
    const win = env.window;
    const doc = win.document;
    const act = React.act;
    const DEFAULT_TIMEOUT = env.timeoutMs || 4000;
    const FIND_TIMEOUT = 1500;

    const tests = [];
    const mounted = [];
    let captured = [];
    let uncaught = [];

    const normalize = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // ------------------------------------------------------------ render
    function render(ui, { container } = {}) {
      const host = container || doc.body.appendChild(doc.createElement('div'));
      const root = ReactDOMClient.createRoot(host, {
        onUncaughtError: (error) => { uncaught.push(error); },
        // An error boundary did its job: note it quietly instead of React's default console.error.
        onCaughtError: (error) => { captured.push({ level: 'caught', text: `${error && error.name}: ${error && error.message}` }); },
      });
      const entry = { root, host, owned: !container };
      mounted.push(entry);
      act(() => root.render(ui));
      rethrowUncaught();
      return {
        container: host,
        rerender(next) {
          act(() => root.render(next));
          rethrowUncaught();
        },
        unmount() {
          act(() => root.unmount());
          entry.unmounted = true;
        },
      };
    }

    function rethrowUncaught() {
      if (uncaught.length) {
        const err = uncaught[0];
        uncaught = [];
        throw err;
      }
    }

    function cleanup() {
      while (mounted.length) {
        const m = mounted.pop();
        try {
          if (!m.unmounted) act(() => m.root.unmount());
        } catch { /* ignore */ }
        if (m.owned && m.host.parentNode) m.host.parentNode.removeChild(m.host);
      }
      doc.body.innerHTML = '';
      // Every test starts like a fresh page.
      try { win.localStorage.clear(); } catch { /* unavailable */ }
      try { win.sessionStorage.clear(); } catch { /* unavailable */ }
    }

    // ------------------------------------------------------------ accessibility helpers
    function isInaccessible(el) {
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        if (n.hidden || n.getAttribute('aria-hidden') === 'true') return true;
        const style = win.getComputedStyle(n);
        if (style.display === 'none' || (n === el && style.visibility === 'hidden')) return true;
      }
      return false;
    }

    function implicitRole(el) {
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || '').toLowerCase();
      switch (tag) {
        case 'button': return 'button';
        case 'a': case 'area': return el.hasAttribute('href') ? 'link' : null;
        case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return 'heading';
        case 'input':
          if (['button', 'submit', 'reset', 'image'].includes(type)) return 'button';
          if (type === 'checkbox') return 'checkbox';
          if (type === 'radio') return 'radio';
          if (type === 'number') return 'spinbutton';
          if (type === 'range') return 'slider';
          if (type === 'search') return el.hasAttribute('list') ? 'combobox' : 'searchbox';
          if (['', 'text', 'email', 'tel', 'url'].includes(type)) return el.hasAttribute('list') ? 'combobox' : 'textbox';
          return null;
        case 'textarea': return 'textbox';
        case 'select': return el.multiple || el.size > 1 ? 'listbox' : 'combobox';
        case 'option': return 'option';
        case 'ul': case 'ol': case 'menu': return 'list';
        case 'li': return 'listitem';
        case 'img': return el.getAttribute('alt') === '' ? 'presentation' : 'img';
        case 'nav': return 'navigation';
        case 'main': return 'main';
        case 'aside': return 'complementary';
        case 'header': return el.closest('article, aside, main, nav, section') ? null : 'banner';
        case 'footer': return el.closest('article, aside, main, nav, section') ? null : 'contentinfo';
        case 'form': return 'form';
        case 'section': return el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') ? 'region' : null;
        case 'article': return 'article';
        case 'dialog': return 'dialog';
        case 'table': return 'table';
        case 'thead': case 'tbody': case 'tfoot': return 'rowgroup';
        case 'tr': return 'row';
        case 'td': return 'cell';
        case 'th': return 'columnheader';
        case 'progress': return 'progressbar';
        case 'meter': return 'meter';
        case 'output': return 'status';
        case 'hr': return 'separator';
        case 'fieldset': case 'details': return 'group';
        case 'p': return 'paragraph';
        case 'strong': return 'strong';
        case 'em': return 'emphasis';
        case 'code': return 'code';
        default: return null;
      }
    }

    function roleOf(el) {
      const explicit = (el.getAttribute('role') || '').trim().split(/\s+/)[0];
      return explicit || implicitRole(el);
    }

    const NAME_FROM_CONTENT = new Set(['button', 'link', 'heading', 'checkbox', 'radio', 'switch', 'option', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'cell', 'columnheader', 'rowheader', 'row', 'tooltip', 'treeitem', 'gridcell']);

    function textFrom(node) {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1) return '';
      if (node.hidden || node.getAttribute('aria-hidden') === 'true') return '';
      const tag = node.tagName.toLowerCase();
      if (tag === 'script' || tag === 'style') return '';
      if (node.hasAttribute('aria-label')) return ` ${node.getAttribute('aria-label')} `;
      if (tag === 'img') return node.getAttribute('alt') || '';
      if (tag === 'input' && ['button', 'submit', 'reset'].includes((node.getAttribute('type') || '').toLowerCase())) return node.value;
      let out = '';
      node.childNodes.forEach((c) => { out += textFrom(c); });
      const block = /^(div|p|li|ul|ol|h[1-6]|section|article|header|footer|br|tr|td|th|table)$/.test(tag);
      return block ? ` ${out} ` : out;
    }

    /** A label's text as Testing Library reads it: form controls inside it contribute nothing. */
    function labelText(node) {
      if (node.nodeType === 3) return node.textContent;
      if (node.nodeType !== 1) return '';
      if (/^(BUTTON|METER|OUTPUT|PROGRESS|SELECT|TEXTAREA|INPUT)$/.test(node.tagName)) return '';
      let out = '';
      node.childNodes.forEach((c) => { out += labelText(c); });
      return out;
    }

    function labelsOf(el) {
      if (el.labels && el.labels.length) return Array.from(el.labels);
      const id = el.id;
      return id ? Array.from(doc.querySelectorAll('label')).filter((l) => l.htmlFor === id) : [];
    }

    function accessibleName(el) {
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const text = labelledBy.split(/\s+/).map((id) => doc.getElementById(id)).filter(Boolean).map((n) => textFrom(n)).join(' ');
        if (normalize(text)) return normalize(text);
      }
      const aria = el.getAttribute('aria-label');
      if (aria && aria.trim()) return normalize(aria);
      const tag = el.tagName.toLowerCase();
      if (['input', 'select', 'textarea', 'meter', 'progress', 'output'].includes(tag)) {
        const labels = labelsOf(el);
        if (labels.length) return normalize(labels.map((l) => labelText(l)).join(' '));
        const type = (el.getAttribute('type') || '').toLowerCase();
        if (tag === 'input' && ['button', 'submit', 'reset'].includes(type)) return normalize(el.value || (type === 'submit' ? 'Submit' : type === 'reset' ? 'Reset' : ''));
      }
      if (tag === 'img' || (tag === 'input' && el.type === 'image')) return normalize(el.getAttribute('alt') || el.getAttribute('title') || '');
      if (tag === 'fieldset') {
        const legend = el.querySelector('legend');
        if (legend) return normalize(textFrom(legend));
      }
      if (tag === 'table') {
        const caption = el.querySelector('caption');
        if (caption) return normalize(textFrom(caption));
      }
      const role = roleOf(el);
      if (NAME_FROM_CONTENT.has(role)) {
        const text = normalize(Array.from(el.childNodes).map((c) => textFrom(c)).join(''));
        if (text) return text;
      }
      return normalize(el.getAttribute('title') || (['input', 'textarea'].includes(tag) ? el.getAttribute('placeholder') || '' : ''));
    }

    // ------------------------------------------------------------ matching
    function matches(text, matcher, el, { exact = true } = {}) {
      if (text == null) return false;
      const value = normalize(text);
      if (matcher instanceof RegExp) {
        matcher.lastIndex = 0;
        return matcher.test(value);
      }
      if (typeof matcher === 'function') return Boolean(matcher(value, el));
      const want = normalize(matcher);
      return exact ? value === want : value.toLowerCase().includes(want.toLowerCase());
    }

    const describeMatcher = (m) => (m instanceof RegExp ? String(m) : typeof m === 'function' ? 'a custom function' : JSON.stringify(String(m)));

    function ownText(el) {
      return Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
    }

    function all(container, selector) {
      return Array.from(container.querySelectorAll(selector));
    }

    const QUERIES = {
      Text: {
        find: (c, text, opts = {}) => all(c, opts.selector || '*').filter((el) => !/^(SCRIPT|STYLE)$/.test(el.tagName) && matches(ownText(el), text, el, opts)),
        describe: (text) => `the text: ${describeMatcher(text)}`,
      },
      Role: {
        find: (c, role, opts = {}) => all(c, '*').filter((el) => {
          if (roleOf(el) !== role) return false;
          if (!opts.hidden && isInaccessible(el)) return false;
          if (opts.level !== undefined && role === 'heading' && Number(el.getAttribute('aria-level') || el.tagName.slice(1)) !== opts.level) return false;
          if (opts.checked !== undefined && Boolean(el.checked || el.getAttribute('aria-checked') === 'true') !== opts.checked) return false;
          if (opts.pressed !== undefined && (el.getAttribute('aria-pressed') === 'true') !== opts.pressed) return false;
          if (opts.selected !== undefined && Boolean(el.selected || el.getAttribute('aria-selected') === 'true') !== opts.selected) return false;
          if (opts.expanded !== undefined && (el.getAttribute('aria-expanded') === 'true') !== opts.expanded) return false;
          if (opts.name !== undefined && !matches(accessibleName(el), opts.name, el)) return false;
          return true;
        }),
        describe: (role, opts = {}) => `the role "${role}"${opts.name !== undefined ? ` and name ${describeMatcher(opts.name)}` : ''}`,
      },
      LabelText: {
        find: (c, text, opts = {}) => {
          const found = new Set();
          all(c, 'label').forEach((label) => {
            if (!matches(labelText(label), text, label, opts)) return;
            const control = label.control || (label.htmlFor && doc.getElementById(label.htmlFor)) || label.querySelector('input, select, textarea, button');
            if (control) found.add(control);
          });
          all(c, '[aria-label]').forEach((el) => { if (matches(el.getAttribute('aria-label'), text, el, opts)) found.add(el); });
          all(c, '[aria-labelledby]').forEach((el) => {
            const t = el.getAttribute('aria-labelledby').split(/\s+/).map((id) => doc.getElementById(id)).filter(Boolean).map((n) => textFrom(n)).join(' ');
            if (matches(t, text, el, opts)) found.add(el);
          });
          return [...found];
        },
        describe: (text) => `the label: ${describeMatcher(text)}`,
      },
      PlaceholderText: {
        find: (c, text, opts) => all(c, '[placeholder]').filter((el) => matches(el.getAttribute('placeholder'), text, el, opts)),
        describe: (text) => `the placeholder text: ${describeMatcher(text)}`,
      },
      DisplayValue: {
        find: (c, text, opts) => all(c, 'input, select, textarea').filter((el) => {
          if (el.tagName === 'SELECT') return Array.from(el.selectedOptions).some((o) => matches(o.textContent, text, o, opts));
          return matches(el.value, text, el, opts);
        }),
        describe: (text) => `the display value: ${describeMatcher(text)}`,
      },
      AltText: {
        find: (c, text, opts) => all(c, 'img, input[type="image"], area').filter((el) => matches(el.getAttribute('alt'), text, el, opts)),
        describe: (text) => `the alt text: ${describeMatcher(text)}`,
      },
      Title: {
        find: (c, text, opts) => all(c, '[title]').filter((el) => matches(el.getAttribute('title'), text, el, opts)),
        describe: (text) => `the title: ${describeMatcher(text)}`,
      },
      TestId: {
        find: (c, id) => all(c, '[data-testid]').filter((el) => matches(el.getAttribute('data-testid'), id, el)),
        describe: (id) => `the test id: ${describeMatcher(id)}`,
      },
    };

    function prettyDOM(node = doc.body, max = 1800) {
      const lines = [];
      const walk = (n, depth) => {
        const pad = '  '.repeat(depth);
        if (n.nodeType === 3) {
          const text = n.textContent.replace(/\s+/g, ' ').trim();
          if (text) lines.push(pad + text);
          return;
        }
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toLowerCase();
        const attrs = Array.from(n.attributes).filter((a) => a.name !== 'style' || a.value.length < 60).map((a) => ` ${a.name}="${a.value}"`).join('');
        if (!n.childNodes.length) { lines.push(`${pad}<${tag}${attrs} />`); return; }
        lines.push(`${pad}<${tag}${attrs}>`);
        n.childNodes.forEach((c) => walk(c, depth + 1));
        lines.push(`${pad}</${tag}>`);
      };
      walk(node, 0);
      const out = lines.join('\n');
      return out.length > max ? `${out.slice(0, max)}\n…` : out;
    }

    function queriesFor(container) {
      const api = {};
      for (const [name, q] of Object.entries(QUERIES)) {
        const findAll = (...args) => q.find(container, ...args);
        const notFound = (...args) => new Error(`Unable to find an element with ${q.describe(...args)}\n\n${prettyDOM(container)}`);
        const tooMany = (n, ...args) => new Error(`Found ${n} elements with ${q.describe(...args)}, but expected exactly one. Use getAllBy${name} if that is intentional.`);
        api[`queryAllBy${name}`] = findAll;
        api[`queryBy${name}`] = (...args) => {
          const r = findAll(...args);
          if (r.length > 1) throw tooMany(r.length, ...args);
          return r[0] || null;
        };
        api[`getAllBy${name}`] = (...args) => {
          const r = findAll(...args);
          if (!r.length) throw notFound(...args);
          return r;
        };
        api[`getBy${name}`] = (...args) => {
          const r = findAll(...args);
          if (!r.length) throw notFound(...args);
          if (r.length > 1) throw tooMany(r.length, ...args);
          return r[0];
        };
        api[`findAllBy${name}`] = (...args) => waitFor(() => api[`getAllBy${name}`](...args));
        api[`findBy${name}`] = (...args) => waitFor(() => api[`getBy${name}`](...args));
      }
      api.debug = (el = container) => console.log(prettyDOM(el));
      return api;
    }

    const screen = queriesFor(doc.body);
    const within = (el) => queriesFor(el);

    // ------------------------------------------------------------ waiting
    async function waitFor(callback, { timeout = FIND_TIMEOUT, interval = 20 } = {}) {
      const start = Date.now();
      let lastError;
      for (;;) {
        try {
          let result;
          await act(async () => { result = await callback(); });
          return result;
        } catch (err) {
          lastError = err;
        }
        if (Date.now() - start >= timeout) throw lastError;
        await act(() => sleep(interval));
      }
    }

    /** Lets real time pass in small act() steps, so timer → state → effect chains keep flowing. */
    async function wait(ms = 0) {
      const end = Date.now() + ms;
      do {
        await act(() => sleep(Math.max(0, Math.min(20, end - Date.now()))));
      } while (Date.now() < end);
    }

    // ------------------------------------------------------------ user events
    function assertElement(el, action) {
      if (!el || el.nodeType !== 1) throw new TypeError(`user.${action}() needs a DOM element, received ${inspect(el)}`);
    }

    function isDisabled(el) {
      return Boolean(el.disabled || el.closest('fieldset[disabled]'));
    }

    function fire(el, type, init = {}) {
      const { MouseEvent, KeyboardEvent, FocusEvent, InputEvent, Event } = win;
      const base = { bubbles: true, cancelable: true, composed: true, ...init };
      let ev;
      if (/^(click|dblclick|mouse|pointer|contextmenu)/.test(type)) ev = new (win.PointerEvent && type.startsWith('pointer') ? win.PointerEvent : MouseEvent)(type, { view: win, button: 0, ...base });
      else if (/^key/.test(type)) ev = new KeyboardEvent(type, base);
      else if (/^(focus|blur)/.test(type)) ev = new FocusEvent(type, base);
      else if (type === 'input' && InputEvent) ev = new InputEvent(type, base);
      else ev = new Event(type, base);
      return el.dispatchEvent(ev);
    }

    function setNativeValue(el, value) {
      const proto = Object.getPrototypeOf(el);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc && desc.set) desc.set.call(el, value);
      else el.value = value;
    }

    function focusEl(el) {
      if (doc.activeElement === el) return;
      if (doc.activeElement && doc.activeElement !== doc.body) {
        const prev = doc.activeElement;
        if (typeof prev.blur === 'function') prev.blur();
        fire(prev, 'focusout', { bubbles: true });
      }
      if (typeof el.focus === 'function') el.focus();
      fire(el, 'focusin', { bubbles: true });
    }

    const KEY_NAMES = { enter: 'Enter', escape: 'Escape', esc: 'Escape', backspace: 'Backspace', tab: 'Tab', space: ' ', arrowup: 'ArrowUp', arrowdown: 'ArrowDown', arrowleft: 'ArrowLeft', arrowright: 'ArrowRight', delete: 'Delete', home: 'Home', end: 'End' };

    function pressKey(el, key) {
      const init = { key, code: key.length === 1 ? `Key${key.toUpperCase()}` : key };
      const go = fire(el, 'keydown', init);
      if (go && key === 'Enter') {
        if (el.tagName === 'INPUT' && el.form) {
          const submitter = el.form.querySelector('button:not([type]), button[type="submit"], input[type="submit"]');
          if (submitter && !isDisabled(submitter)) submitter.click();
          else if (typeof el.form.requestSubmit === 'function') el.form.requestSubmit();
        } else if (el.tagName === 'BUTTON' || (el.tagName === 'A' && el.href)) {
          el.click();
        }
      }
      if (go && key === 'Backspace' && 'value' in el && el.tagName !== 'SELECT') {
        setNativeValue(el, String(el.value).slice(0, -1));
        fire(el, 'input');
      }
      if (go && key === ' ' && (el.tagName === 'BUTTON' || (el.tagName === 'INPUT' && /^(checkbox|radio)$/.test(el.type)))) el.click();
      fire(el, 'keyup', init);
    }

    /** Splits "ab{enter}c" into ['a', 'b', {key:'Enter'}, 'c']. */
    function tokens(text) {
      const out = [];
      const re = /\{([a-z]+)\}|([\s\S])/gi;
      let m;
      while ((m = re.exec(text))) {
        if (m[1]) out.push({ key: KEY_NAMES[m[1].toLowerCase()] || m[1] });
        else out.push(m[2]);
      }
      return out;
    }

    const user = {
      async click(el) {
        assertElement(el, 'click');
        if (isDisabled(el)) throw new Error(`Cannot click ${inspect(el)} because it is disabled.`);
        await act(async () => {
          fire(el, 'pointerdown');
          fire(el, 'mousedown');
          focusEl(el);
          fire(el, 'pointerup');
          fire(el, 'mouseup');
          el.click();
        });
      },
      async dblClick(el) {
        await user.click(el);
        await user.click(el);
        await act(async () => { fire(el, 'dblclick'); });
      },
      async hover(el) {
        assertElement(el, 'hover');
        await act(async () => {
          fire(el, 'pointerover');
          fire(el, 'pointerenter', { bubbles: false });
          fire(el, 'mouseover');
          fire(el, 'mouseenter', { bubbles: false });
        });
      },
      async unhover(el) {
        assertElement(el, 'unhover');
        await act(async () => {
          fire(el, 'pointerout');
          fire(el, 'pointerleave', { bubbles: false });
          fire(el, 'mouseout');
          fire(el, 'mouseleave', { bubbles: false });
        });
      },
      async type(el, text) {
        assertElement(el, 'type');
        if (isDisabled(el)) throw new Error(`Cannot type into ${inspect(el)} because it is disabled.`);
        await act(async () => { focusEl(el); });
        for (const tk of tokens(String(text))) {
          await act(async () => {
            if (typeof tk === 'object') { pressKey(el, tk.key); return; }
            const go = fire(el, 'keydown', { key: tk });
            if (!go) { fire(el, 'keyup', { key: tk }); return; }
            fire(el, 'keypress', { key: tk, charCode: tk.charCodeAt(0) });
            if (el.isContentEditable) el.textContent += tk;
            else if (!el.readOnly) setNativeValue(el, `${el.value}${tk}`);
            fire(el, 'input', { data: tk, inputType: 'insertText' });
            fire(el, 'keyup', { key: tk });
          });
        }
      },
      async clear(el) {
        assertElement(el, 'clear');
        await act(async () => {
          focusEl(el);
          setNativeValue(el, '');
          fire(el, 'input', { inputType: 'deleteContentBackward' });
        });
      },
      async selectOptions(el, values) {
        assertElement(el, 'selectOptions');
        const wanted = [].concat(values).map(String);
        await act(async () => {
          focusEl(el);
          const options = Array.from(el.options);
          const picked = options.filter((o) => wanted.includes(o.value) || wanted.includes(normalize(o.textContent)));
          if (!picked.length) throw new Error(`Value ${JSON.stringify(wanted)} not found in <select> options: ${options.map((o) => JSON.stringify(o.value)).join(', ')}`);
          if (el.multiple) options.forEach((o) => { o.selected = picked.includes(o); });
          else setNativeValue(el, picked[0].value);
          fire(el, 'input');
          fire(el, 'change');
        });
      },
      async keyboard(text) {
        for (const tk of tokens(String(text))) {
          await act(async () => pressKey(doc.activeElement || doc.body, typeof tk === 'object' ? tk.key : tk));
        }
      },
      async tab({ shift = false } = {}) {
        const focusable = all(doc.body, 'a[href], button, input, select, textarea, [tabindex]').filter((el) => !isDisabled(el) && el.tabIndex >= 0 && !isInaccessible(el));
        if (!focusable.length) return;
        const i = focusable.indexOf(doc.activeElement);
        const next = focusable[(i + (shift ? -1 : 1) + focusable.length) % focusable.length];
        await act(async () => focusEl(next));
      },
    };

    // ------------------------------------------------------------ mocks
    function fn(impl) {
      let implementation = impl;
      const mock = function (...args) {
        mock.mock.calls.push(args);
        try {
          const value = implementation ? implementation.apply(this, args) : undefined;
          mock.mock.results.push({ type: 'return', value });
          return value;
        } catch (err) {
          mock.mock.results.push({ type: 'throw', value: err });
          throw err;
        }
      };
      mock._isMockFunction = true;
      mock.mock = { calls: [], results: [] };
      mock.mockImplementation = (f) => { implementation = f; return mock; };
      mock.mockReturnValue = (v) => { implementation = () => v; return mock; };
      mock.mockResolvedValue = (v) => { implementation = () => Promise.resolve(v); return mock; };
      mock.mockClear = () => { mock.mock.calls = []; mock.mock.results = []; return mock; };
      return mock;
    }

    // ------------------------------------------------------------ expect
    class AssertionError extends Error {
      constructor(message) {
        super(message);
        this.name = 'AssertionError';
      }
    }

    const show = (v) => inspect(v, 1);

    function textOf(el) {
      return normalize(el.textContent);
    }

    function valueOf(el) {
      if (el.tagName === 'SELECT') return el.multiple ? Array.from(el.selectedOptions).map((o) => o.value) : el.value;
      if (el.tagName === 'INPUT' && (el.type === 'number' || el.type === 'range')) return el.value === '' ? null : Number(el.value);
      if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) return el.checked;
      return el.value;
    }

    function requireElement(v, matcher) {
      if (!isElementLike(v)) throw new AssertionError(`${matcher}() expects a DOM element, received ${show(v)}`);
    }

    function requireMock(v, matcher) {
      if (!v || !v._isMockFunction) throw new AssertionError(`${matcher}() expects a mock created with fn(), received ${show(v)}`);
    }

    function makeMatchers(actual, negate) {
      const check = (pass, message, notMessage) => {
        if (negate ? pass : !pass) throw new AssertionError(negate ? notMessage : message);
      };
      const m = {
        toBe: (expected) => check(Object.is(actual, expected), `Expected ${show(actual)} to be ${show(expected)}`, `Expected ${show(actual)} not to be ${show(expected)}`),
        toEqual: (expected) => check(equals(actual, expected), `Expected ${show(actual)} to equal ${show(expected)}`, `Expected ${show(actual)} not to equal ${show(expected)}`),
        toStrictEqual: (expected) => m.toEqual(expected),
        toBeTruthy: () => check(Boolean(actual), `Expected ${show(actual)} to be truthy`, `Expected ${show(actual)} to be falsy`),
        toBeFalsy: () => check(!actual, `Expected ${show(actual)} to be falsy`, `Expected ${show(actual)} to be truthy`),
        toBeNull: () => check(actual === null, `Expected ${show(actual)} to be null`, 'Expected value not to be null'),
        toBeUndefined: () => check(actual === undefined, `Expected ${show(actual)} to be undefined`, 'Expected value not to be undefined'),
        toBeDefined: () => check(actual !== undefined, 'Expected value to be defined', `Expected ${show(actual)} to be undefined`),
        toBeGreaterThan: (n) => check(actual > n, `Expected ${show(actual)} to be greater than ${n}`, `Expected ${show(actual)} not to be greater than ${n}`),
        toBeGreaterThanOrEqual: (n) => check(actual >= n, `Expected ${show(actual)} to be ≥ ${n}`, `Expected ${show(actual)} not to be ≥ ${n}`),
        toBeLessThan: (n) => check(actual < n, `Expected ${show(actual)} to be less than ${n}`, `Expected ${show(actual)} not to be less than ${n}`),
        toBeLessThanOrEqual: (n) => check(actual <= n, `Expected ${show(actual)} to be ≤ ${n}`, `Expected ${show(actual)} not to be ≤ ${n}`),
        toBeInstanceOf: (C) => check(actual instanceof C, `Expected ${show(actual)} to be an instance of ${C && C.name}`, `Expected ${show(actual)} not to be an instance of ${C && C.name}`),
        toContain: (item) => check(actual != null && typeof actual.includes === 'function' && actual.includes(item), `Expected ${show(actual)} to contain ${show(item)}`, `Expected ${show(actual)} not to contain ${show(item)}`),
        toContainEqual: (item) => check(Array.isArray(actual) && actual.some((x) => equals(x, item)), `Expected ${show(actual)} to contain an item equal to ${show(item)}`, `Expected ${show(actual)} not to contain ${show(item)}`),
        toMatch: (re) => check(typeof actual === 'string' && (re instanceof RegExp ? re.test(actual) : actual.includes(re)), `Expected ${show(actual)} to match ${String(re)}`, `Expected ${show(actual)} not to match ${String(re)}`),
        toHaveLength: (n) => check(actual != null && actual.length === n, `Expected length ${n}, received ${actual == null ? show(actual) : actual.length}`, `Expected length not to be ${n}`),
        toHaveProperty: (key, value) => {
          const has = actual != null && Object.prototype.hasOwnProperty.call(Object(actual), key);
          check(has && (value === undefined || equals(actual[key], value)), `Expected ${show(actual)} to have property "${key}"${value === undefined ? '' : ` equal to ${show(value)}`}`, `Expected ${show(actual)} not to have property "${key}"`);
        },
        toThrow: (expected) => {
          let thrown = null;
          try { actual(); } catch (e) { thrown = e; }
          const ok = thrown !== null && (expected === undefined || (expected instanceof RegExp ? expected.test(thrown.message) : String(thrown.message).includes(expected)));
          check(ok, `Expected the function to throw${expected ? ` ${String(expected)}` : ''}${thrown ? `, but it threw: ${thrown.message}` : ''}`, `Expected the function not to throw, but it threw: ${thrown && thrown.message}`);
        },
        // --- mocks
        toHaveBeenCalled: () => { requireMock(actual, 'toHaveBeenCalled'); check(actual.mock.calls.length > 0, 'Expected the mock to have been called', `Expected the mock not to be called, but it was called ${actual.mock.calls.length} time(s)`); },
        toHaveBeenCalledTimes: (n) => { requireMock(actual, 'toHaveBeenCalledTimes'); check(actual.mock.calls.length === n, `Expected the mock to be called ${n} time(s), but it was called ${actual.mock.calls.length} time(s)`, `Expected the mock not to be called ${n} time(s)`); },
        toHaveBeenCalledWith: (...args) => { requireMock(actual, 'toHaveBeenCalledWith'); check(actual.mock.calls.some((c) => equals(c, args)), `Expected the mock to be called with ${show(args)}; calls were: ${show(actual.mock.calls)}`, `Expected the mock not to be called with ${show(args)}`); },
        toHaveBeenLastCalledWith: (...args) => { requireMock(actual, 'toHaveBeenLastCalledWith'); const last = actual.mock.calls[actual.mock.calls.length - 1]; check(equals(last, args), `Expected the last call to be ${show(args)}, but it was ${show(last)}`, `Expected the last call not to be ${show(args)}`); },
        // --- DOM (jest-dom)
        toBeInTheDocument: () => {
          if (actual !== null) requireElement(actual, 'toBeInTheDocument');
          check(actual !== null && doc.body.contains(actual), `Expected the element to be in the document${actual === null ? ' (received null — the query found nothing)' : ''}`, `Expected ${show(actual)} not to be in the document`);
        },
        toHaveTextContent: (text) => {
          requireElement(actual, 'toHaveTextContent');
          const content = textOf(actual);
          const pass = text instanceof RegExp ? text.test(content) : content.includes(normalize(text));
          check(pass, `Expected element to have text ${text instanceof RegExp ? String(text) : JSON.stringify(text)}, but its text is ${JSON.stringify(content)}`, `Expected element not to have text ${String(text)}; its text is ${JSON.stringify(content)}`);
        },
        toHaveValue: (value) => {
          requireElement(actual, 'toHaveValue');
          const v = valueOf(actual);
          check(equals(v, value), `Expected element to have value ${show(value)}, but it is ${show(v)}`, `Expected element not to have value ${show(value)}`);
        },
        toHaveDisplayValue: (value) => {
          requireElement(actual, 'toHaveDisplayValue');
          const v = actual.tagName === 'SELECT' ? normalize(actual.selectedOptions[0] && actual.selectedOptions[0].textContent) : actual.value;
          check(value instanceof RegExp ? value.test(v) : v === value, `Expected display value ${show(value)}, but it is ${show(v)}`, `Expected display value not to be ${show(value)}`);
        },
        toBeChecked: () => {
          requireElement(actual, 'toBeChecked');
          const on = 'checked' in actual && /^(checkbox|radio)$/.test(actual.type) ? actual.checked : actual.getAttribute('aria-checked') === 'true';
          check(on, `Expected ${show(actual)} to be checked`, `Expected ${show(actual)} not to be checked`);
        },
        toBeDisabled: () => { requireElement(actual, 'toBeDisabled'); check(isDisabled(actual), `Expected ${show(actual)} to be disabled`, `Expected ${show(actual)} to be enabled`); },
        toBeEnabled: () => { requireElement(actual, 'toBeEnabled'); check(!isDisabled(actual), `Expected ${show(actual)} to be enabled`, `Expected ${show(actual)} to be disabled`); },
        toHaveAttribute: (name, value) => {
          requireElement(actual, 'toHaveAttribute');
          const has = actual.hasAttribute(name);
          const v = actual.getAttribute(name);
          check(has && (value === undefined || v === String(value)), `Expected ${show(actual)} to have attribute ${name}${value === undefined ? '' : `="${value}"`}${has ? ` (it is "${v}")` : ''}`, `Expected ${show(actual)} not to have attribute ${name}`);
        },
        toHaveClass: (...names) => {
          requireElement(actual, 'toHaveClass');
          const list = names.flatMap((n) => String(n).split(/\s+/)).filter(Boolean);
          check(list.length > 0 && list.every((n) => actual.classList.contains(n)), `Expected ${show(actual)} to have class ${list.join(' ')}; it has "${actual.className}"`, `Expected ${show(actual)} not to have class ${list.join(' ')}`);
        },
        toHaveFocus: () => { requireElement(actual, 'toHaveFocus'); check(doc.activeElement === actual, `Expected ${show(actual)} to have focus; focus is on ${show(doc.activeElement)}`, `Expected ${show(actual)} not to have focus`); },
        toBeVisible: () => { requireElement(actual, 'toBeVisible'); check(doc.body.contains(actual) && !isInaccessible(actual), `Expected ${show(actual)} to be visible`, `Expected ${show(actual)} not to be visible`); },
        toBeEmptyDOMElement: () => { requireElement(actual, 'toBeEmptyDOMElement'); check(actual.childNodes.length === 0, `Expected ${show(actual)} to be empty, it contains: ${prettyDOM(actual, 300)}`, `Expected ${show(actual)} not to be empty`); },
        toContainElement: (child) => { requireElement(actual, 'toContainElement'); check(child != null && actual.contains(child), `Expected ${show(actual)} to contain ${show(child)}`, `Expected ${show(actual)} not to contain ${show(child)}`); },
        toHaveStyle: (styles) => {
          requireElement(actual, 'toHaveStyle');
          const computed = win.getComputedStyle(actual);
          const probe = doc.createElement('div');
          const bad = Object.entries(styles).filter(([k, v]) => {
            const prop = k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
            probe.style.setProperty(prop, typeof v === 'number' && !/opacity|z-index|flex|weight|line-height|order/.test(prop) ? `${v}px` : String(v));
            const want = probe.style.getPropertyValue(prop);
            // Browsers resolve computed values (25% → 187.5px) while jsdom keeps them,
            // so an inline style that matches counts as a match everywhere.
            return actual.style.getPropertyValue(prop) !== want && computed.getPropertyValue(prop) !== want;
          });
          check(bad.length === 0, `Expected ${show(actual)} to have style ${show(Object.fromEntries(bad))}`, `Expected ${show(actual)} not to have style ${show(styles)}`);
        },
      };
      return m;
    }

    function expect(actual) {
      const positive = makeMatchers(actual, false);
      positive.not = makeMatchers(actual, true);
      return positive;
    }

    // ------------------------------------------------------------ console capture
    function logs(level = 'log') {
      return captured.filter((c) => level === 'all' || c.level === level).map((c) => c.text);
    }

    function captureConsole() {
      const originals = {};
      ['log', 'info', 'warn', 'error', 'debug'].forEach((level) => {
        originals[level] = console[level];
        console[level] = function (...args) {
          captured.push({ level, text: format(args) });
          return originals[level].apply(console, args);
        };
      });
      return () => Object.assign(console, originals);
    }

    // ------------------------------------------------------------ runner
    function test(name, body, opts = {}) {
      if (typeof body !== 'function') throw new TypeError('test(name, fn): fn must be a function');
      tests.push({ name: typeof name === 'string' ? { en: name, fa: name } : name, body, timeout: opts.timeout || DEFAULT_TIMEOUT });
    }

    function serializeError(err) {
      if (!err || typeof err !== 'object') return { name: 'Error', message: String(err) };
      return { name: err.name || 'Error', message: String(err.message || err), stack: String(err.stack || '') };
    }

    /** Runs every registered test in order; resolves to [{ name, ok, error?, ms, logs }]. */
    async function run({ onResult } = {}) {
      const previousActEnv = globalThis.IS_REACT_ACT_ENVIRONMENT;
      globalThis.IS_REACT_ACT_ENVIRONMENT = true;
      const results = [];
      const onWindowError = (e) => { uncaught.push(e.error || new Error(e.message)); };
      const onRejection = (e) => { uncaught.push(e.reason instanceof Error ? e.reason : new Error(String(e.reason))); };
      win.addEventListener('error', onWindowError);
      win.addEventListener('unhandledrejection', onRejection);
      const restoreConsole = captureConsole();
      try {
        for (const t of tests) {
          captured = [];
          uncaught = [];
          const started = Date.now();
          let error = null;
          let timer;
          try {
            await Promise.race([
              Promise.resolve().then(() => t.body()),
              new Promise((_, reject) => {
                timer = setTimeout(() => reject(new Error(`Test timed out after ${t.timeout} ms (an awaited update never happened?)`)), t.timeout);
              }),
            ]);
            rethrowUncaught();
          } catch (err) {
            error = serializeError(err);
          } finally {
            clearTimeout(timer);
          }
          try { cleanup(); } catch { /* ignore */ }
          const result = { name: t.name, ok: !error, ms: Date.now() - started, logs: captured.slice(0, 50) };
          if (error) result.error = error;
          results.push(result);
          if (onResult) onResult(result, results.length, tests.length);
        }
      } finally {
        restoreConsole();
        win.removeEventListener('error', onWindowError);
        win.removeEventListener('unhandledrejection', onRejection);
        globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnv;
      }
      return results;
    }

    const globals = { test, it: test, render, screen, within, user, fire, expect, waitFor, wait, act, fn, logs, cleanup, prettyDOM };
    return { globals, run, tests, cleanup };
  }

  /** Names injected into a tests file, in parameter order. */
  const GLOBAL_NAMES = ['test', 'it', 'render', 'screen', 'within', 'user', 'fire', 'expect', 'waitFor', 'wait', 'act', 'fn', 'logs', 'cleanup', 'prettyDOM'];

  return { createTestKit, format, inspect, GLOBAL_NAMES };
});
