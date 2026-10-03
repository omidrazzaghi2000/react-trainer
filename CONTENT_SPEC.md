# Lesson Content Specification

Every lesson lives in `content/lessons/<id>/` and consists of five files:

| File | Purpose |
|------|---------|
| `lesson.json` | All bilingual teaching text, quiz, diagram, exercise metadata |
| `example.jsx` | A complete, runnable demo of the concept (rendered live in the Code tab) |
| `exercise.jsx` | Starter code for the learner's challenge — loads and renders, but fails the tests |
| `solution.jsx` | Reference solution of the exercise (passes every test) |
| `tests.jsx` | The hidden checks, written with the built-in Testing-Library-style kit |

**The reference implementation is `content/lessons/use-state/` — match its depth, tone and format.**

Validate with:

```bash
node scripts/validate-content.js <id> [<id> ...]
```

A lesson is done only when it prints `[ OK ]`, or `[WARN]` where the only warnings are
`related[..] does not exist (yet)` for ids from the master list below.

The validator renders `example.jsx` in jsdom (no errors, **no `console.error` / `console.warn`** —
React's key/act/prop-type warnings count), runs `tests.jsx` against `solution.jsx` (every test passes,
no `console.error` / `console.warn`), and runs `tests.jsx` against the untouched `exercise.jsx`
(it must load, and **at least one test must fail**).

---

## Master list of lesson ids

| Category | ids in order (`order` field = position in the category, starting at 1) |
|----------|-----|
| `beginner` | `jsx`, `components-props`, `use-state`, `events`, `conditional-rendering`, `lists-keys`, `immutable-updates`, `controlled-forms` |
| `intermediate` | `lifting-state`, `use-effect`, `use-ref`, `use-reducer`, `context`, `custom-hooks`, `composition`, `data-fetching` |
| `advanced` | `memoization`, `refs-imperative`, `layout-effects`, `portals`, `error-boundaries`, `code-splitting`, `compound-components`, `external-stores` |
| `elite` | `reconciliation`, `use-transition`, `use-deferred-value`, `use-api`, `actions`, `use-optimistic`, `state-machines`, `headless-components` |

`related[].id` must come from this list.

### Scope of each lesson (stay inside it; link the neighbours with `related`)

| id | Name (en) | Must cover |
|----|-----------|------------|
| `jsx` | JSX: Markup in JavaScript | JSX → `jsx()` calls, one root / fragments `<>`, `{expressions}`, `className`, `style={{}}`, camelCase attributes, self-closing tags, comments, what can't go in braces (statements, objects as children) |
| `components-props` | Components & Props | function components, capitalized names, props as a read-only object, destructuring + defaults, `children`, composing small components, props are one-way |
| `use-state` | useState: Component Memory | *(reference lesson — done)* |
| `events` | Handling Events | `onClick`/`onChange`/`onSubmit`/`onKeyDown`, passing a function vs calling it, the synthetic event object, `e.preventDefault()`, `e.stopPropagation()`, bubbling, passing handlers as props (`onSomething`) |
| `conditional-rendering` | Conditional Rendering | `if` + early return, ternary, `&&` (and the `0 &&` pitfall), returning `null`, conditional classes/attributes, keeping state when hiding vs unmounting |
| `lists-keys` | Lists & Keys | `array.map` to elements, stable unique `key`, why index keys break (reordering/insertion with state inside items), `filter`/`sort` before render (copy first), Fragment with key |
| `immutable-updates` | Updating Objects & Arrays | spread for objects (nested too), add/remove/update/replace in arrays with `map`/`filter`/spread, never `push`/`splice`/assign in state, `structuredClone` vs spread, why reference equality matters |
| `controlled-forms` | Controlled Forms | `value` + `onChange`, checkbox `checked`, `select`, `textarea`, one handler with `name`, submit with `preventDefault`, simple validation messages, disabling submit, uncontrolled vs controlled warning |
| `lifting-state` | Lifting State Up | two siblings that must agree, move state to the closest common parent, pass value + `onChange` down, single source of truth, controlled vs uncontrolled components |
| `use-effect` | useEffect: Syncing with the Outside | effects run after paint, dependency array, cleanup, timers/subscriptions/document title, StrictMode double-invocation in dev, "you might not need an effect" (derived data, event logic) |
| `use-ref` | useRef: Escape Hatch | refs to DOM nodes (focus, scroll, measure), refs as mutable boxes that don't re-render (interval ids, previous value, render counts), never read/write `ref.current` during render |
| `use-reducer` | useReducer: State Logic in One Place | `(state, action) => newState`, `dispatch`, action objects with `type`, switch reducer, pure reducers, testing reducers, init function, when to prefer over `useState` |
| `context` | Context: Skipping Prop Drilling | `createContext`, `<Ctx value>` (React 19) / `Provider`, `useContext`, default value, overriding in subtrees, context + reducer, re-render cost & splitting contexts |
| `custom-hooks` | Custom Hooks | extract reusable stateful logic into `useSomething`, rules of hooks, hooks share logic not state, returning tuples vs objects, composing hooks (`useToggle`, `useLocalStorage`, `useDebounce`) |
| `composition` | Composition & Children | `children`, slot props (`header`, `footer`), render props (`renderItem`), wrappers/layout components, composition instead of inheritance, avoiding prop drilling with composition |
| `data-fetching` | Fetching Data | loading / error / data states, fetching in effects, race conditions + `ignore` flag / `AbortController`, refetch on dependency change, why libraries (TanStack Query, SWR) exist. Use a local fake async API (`setTimeout` + `Promise`), never the network |
| `memoization` | memo, useMemo & useCallback | when components re-render, `memo` with shallow prop compare, `useMemo` for expensive calculations, `useCallback` for stable callbacks passed to memoized children, measuring first, React Compiler |
| `refs-imperative` | Refs as Props & useImperativeHandle | React 19 `ref` as a normal prop (and `forwardRef` history), exposing a limited imperative API with `useImperativeHandle` (`focus()`, `scrollToTop()`, `play()`), ref callbacks + cleanup |
| `layout-effects` | useLayoutEffect & Measuring | effect vs layout effect timing, measure DOM before paint (tooltip placement), avoiding flicker, cost of blocking paint, `useInsertionEffect` note. jsdom has no layout: tests must stub measurements |
| `portals` | Portals | `createPortal(children, domNode)` for modals/toasts/tooltips, events still bubble through the React tree, context still works, focus management + Escape to close, accessibility (`role="dialog"`, `aria-modal`) |
| `error-boundaries` | Error Boundaries | class component with `static getDerivedStateFromError` + `componentDidCatch`, fallback UI, reset with `key` / retry button, what boundaries don't catch (event handlers, async), `onCaughtError` root option |
| `code-splitting` | lazy & Suspense | `lazy(() => import())` (simulate with a delayed Promise returning `{ default: Comp }`), `<Suspense fallback>`, nested boundaries, avoiding waterfalls, preloading on hover |
| `compound-components` | Compound Components | `<Tabs>`/`<Tabs.List>`/`<Tabs.Panel>` sharing implicit state through context, flexible markup, controlled + uncontrolled API, accessible roles/aria |
| `external-stores` | useSyncExternalStore | subscribe/getSnapshot contract, a tiny global store (like Zustand), browser APIs (online status, window size — guard missing APIs), selectors, tearing and why the hook exists |
| `reconciliation` | Reconciliation & Identity | render vs commit, same type + same position = same state, `key` to reset, changing component type resets subtree, never define components inside components, purity & StrictMode |
| `use-transition` | useTransition | urgent vs non-urgent updates, `startTransition`, `isPending`, keeping the old UI visible, transitions + Suspense, async transitions (React 19) |
| `use-deferred-value` | useDeferredValue | deferring an expensive derived render (search list), `initialValue`, stale-while-updating UI (`opacity` when `value !== deferred`), vs debounce, requires `memo` for the slow child |
| `use-api` | The use() API | `use(promise)` with Suspense (promise created outside render and cached), `use(context)` inside conditions, error handling with boundaries, why you can't create the promise during render |
| `actions` | Actions & useActionState | `<form action={fn}>`, `useActionState(action, initial)` returning `[state, formAction, isPending]`, `useFormStatus` in a child button, `FormData`, validation errors returned from the action, reset after success |
| `use-optimistic` | useOptimistic | show the expected result immediately, `useOptimistic(state, updateFn)`, automatic rollback when the action fails, pending markers ("Sending…"), pairing with actions/transitions |
| `state-machines` | State Machines with Reducers | model UI as finite states (`idle` → `loading` → `success`/`error`), make impossible states impossible, reducer that ignores invalid events per state, discriminated state objects, XState mention |
| `headless-components` | Headless Hooks & Prop Getters | logic-only hooks returning state + prop getters (`getToggleProps`, `getItemProps`), state reducer / control props for customization, accessibility baked in, Downshift/React Aria/TanStack style |

---

## Code rules (all four .jsx files)

- Single file, **ES module**, React 19. Import only from `'react'`, `'react-dom'` or `'react-dom/client'`.
  `tests.jsx` may also `import App, { named } from './App'` (the learner's module).
- `example.jsx`, `exercise.jsx` and `solution.jsx` must `export default` the root component
  (name it `App`). The trainer mounts it for you with `createRoot(...).render(<App />)` (no
  `StrictMode` wrapper). Note: a `<StrictMode>` placed *inside* `App` only double-runs effects of
  components that mount later (e.g. after a click), not on the first mount — tests can wrap the root
  themselves with `render(<StrictMode><App /></StrictMode>)`. Extra named
  exports are fine (e.g. `export function useToggle`, `export function reducer`) and tests can import them.
- Function components and hooks only, except where the lesson is about classes (error boundaries).
- **Deterministic**: no `Math.random()`, no real dates/times in output, no network (`fetch`) — fake
  async work with `new Promise((r) => setTimeout(r, ms))`. Nothing may keep running forever unless it
  is cleaned up (every `setInterval` needs a cleanup).
- Browser-only APIs that jsdom lacks must be guarded or avoided: `ResizeObserver`,
  `IntersectionObserver`, `matchMedia`, `scrollIntoView`, `HTMLDialogElement.showModal`. jsdom has **no
  layout**: `getBoundingClientRect()` and `offsetWidth` return 0.
- Examples must render without `console.error`/`console.warn` (keys, act, uncontrolled→controlled…).
  `console.log` is welcome — it shows up in the app's console panel and is a great teaching tool.
- Readable for learners: `example.jsx` 30–90 lines, meaningful names, short comments that explain
  *why*, a realistic mini-domain (coffee shop, todo, music player, chat, shop cart, weather, kanban…),
  2-space indent, max ~95 columns per line, single quotes.
- Start each file with a one-line comment: `// <Lesson topic>: <what this program shows>`.
- The preview is a small iframe (≈ 360–720 px wide). Keep UIs compact. Use the built-in classes below
  instead of long style objects; a small `style={{ … }}` is fine when styling *is* the point.
- No emoji in UI text — use words or simple characters (`−`, `+`, `×`, `✓`, `→`).
- `exercise.jsx` **must transpile and render as given**, but fail at least one test. Mark the work with
  `// TODO 1:`, `// TODO 2:` … comments. Keep the required edits small and focused on the lesson
  (typically 5–25 changed lines). Keep the markup (labels, roles, texts) that tests rely on already in
  the starter, so the learner only writes the React logic.
- `solution.jsx` is the starter with the TODOs completed (remove the TODO comments).

### Built-in preview stylesheet (available in every preview)

Elements get friendly defaults (system font, rounded `button`, `input`, `select`, `textarea`;
`button[aria-pressed="true"]` and `button[aria-selected="true"]` look selected; `:disabled` is dimmed).
Utility classes:

| Class | Effect |
|-------|--------|
| `card` | white box with border, radius and padding |
| `row` | horizontal flex, wraps, 8px gap, centered items |
| `stack` | vertical flex, 12px gap |
| `grid` | responsive grid of ≥ 150px columns |
| `muted` | secondary grey text |
| `error` / `success` / `warning` | red / green / amber text |
| `badge` | small pill label |
| `primary` / `danger` (on buttons) | filled blue / red button |
| `list` | unstyled list with dividers between items |
| `done` | strike-through, muted (completed todo) |
| `spinner` | small spinning circle (loading) |
| `overlay` + `modal` | full-screen dimmed backdrop + centered dialog box |
| `sr-only` | visually hidden, readable by screen readers |

---

## tests.jsx — the challenge checks

Tests read like React Testing Library + Jest. These names are **globals** (do not import them):

| Global | What it does |
|--------|--------------|
| `test(name, fn, { timeout }?)` | Registers a test. `name` **must be bilingual**: `{ en: '…', fa: '…' }`. `fn` may be async. Default timeout 4 s. |
| `render(<App />)` | Mounts into a fresh container (inside `act`). Returns `{ container, rerender, unmount }`. Every test starts clean — mounts are removed after each test. |
| `screen` | Queries on `document.body`: `getBy…`, `getAllBy…`, `queryBy…`, `queryAllBy…`, `findBy…`, `findAllBy…` for `Role`, `Text`, `LabelText`, `PlaceholderText`, `DisplayValue`, `AltText`, `Title`, `TestId`. Same semantics as Testing Library: `getByRole('button', { name: /save/i })`, `getByRole('heading', { level: 2 })`, `getByRole('checkbox', { checked: true })`, `getByText('Total: $3.00')` (own text of one element, whitespace-normalized; `{ exact: false }` for substring). `findBy…` waits up to 1.5 s. |
| `within(element)` | The same queries scoped to one element. |
| `user` | Async, wrapped in `act`: `click(el)`, `dblClick(el)`, `type(el, 'text{enter}')` (also `{backspace}`, `{escape}`, `{arrowdown}`, …), `clear(el)`, `selectOptions(select, valueOrLabel)`, `hover(el)`, `unhover(el)`, `keyboard('{Escape}')` (to the focused element), `tab()`. Always `await` them. |
| `fire(el, 'eventType', init?)` | Dispatch a raw DOM event (wrap in `act` yourself if it updates state). |
| `expect(value)` | Jest matchers: `toBe`, `toEqual`, `toBeTruthy`, `toBeFalsy`, `toBeNull`, `toBeDefined`, `toBeUndefined`, `toContain`, `toContainEqual`, `toMatch`, `toHaveLength`, `toHaveProperty`, `toBeGreaterThan(OrEqual)`, `toBeLessThan(OrEqual)`, `toBeInstanceOf`, `toThrow`, mock matchers `toHaveBeenCalled`, `toHaveBeenCalledTimes`, `toHaveBeenCalledWith`, `toHaveBeenLastCalledWith`, and jest-dom: `toBeInTheDocument`, `toHaveTextContent`, `toHaveValue`, `toHaveDisplayValue`, `toBeChecked`, `toBeDisabled`, `toBeEnabled`, `toHaveAttribute`, `toHaveClass`, `toHaveFocus`, `toBeVisible`, `toBeEmptyDOMElement`, `toContainElement`, `toHaveStyle`. All support `.not`. |
| `waitFor(fn, { timeout })` | Retries `fn` (inside `act`) until it stops throwing (default 1.5 s). |
| `wait(ms)` | `await wait(300)` lets real time pass in small `act` steps, so timers, state updates and the effects they trigger all keep running. |
| `act(fn)` | React's `act`. |
| `fn(impl?)` | A mock function (`.mock.calls`, `mockReturnValue`, `mockImplementation`, `mockResolvedValue`). |
| `logs(level = 'log')` | Lines printed with `console.log` (or `'warn'`, `'error'`, `'all'`) during the current test. |

Rules:

- 3–7 top-level `test(...)` calls, each **starting at the beginning of a line** (the app counts them).
- Test observable behaviour, the way a user would (roles, labels, visible text), not implementation
  details. Prefer `getByRole` with a name. Tests must pass for *any* reasonable correct solution, not only
  the reference one — don't assert on class names or exact markup unless the task demands them.
- Order tests from basic to advanced; the first one may pass on the starter (e.g. "renders the form").
- Test names are shown to the learner as a checklist, so write them as requirements:
  `{ en: 'Adding a todo clears the input', fa: 'افزودن کار جدید، ورودی را خالی می‌کند' }`.
- Keep simulated latency in the exercise small (≤ 300 ms) so `findBy…` and `waitFor` succeed.
- When a lesson is about timing (layout, transitions), test the observable outcome, not React internals.
- Module-level state (caches, stores, lazy chunks) survives from one test to the next within a run;
  export a reset or design tests so order doesn't matter. `localStorage`/`sessionStorage` and the DOM
  are cleared between tests.
- `render()` is synchronous (like Testing Library's): if the very first render suspends, React warns
  that act was not awaited — let suspending parts appear after an interaction, or `await act(…)`.

---

## lesson.json schema

All user-visible text is an object `{ "en": "...", "fa": "..." }`; lists are `{ "en": [..], "fa": [..] }`
with the **same number of items** in both languages.

Inline formatting allowed inside text: `` `inline code` `` and `**bold**`. Nothing else (no links, no
headings, no HTML).

```jsonc
{
  "id": "use-state",                 // = folder name, kebab-case
  "category": "beginner",            // beginner | intermediate | advanced | elite
  "order": 3,                        // position in the master list (per category)
  "icon": "toggle-right",            // file name (without .svg) in node_modules/lucide-static/icons/
  "name":    { "en": "useState: Component Memory", "fa": "useState: حافظهٔ کامپوننت" },  // <= 40 chars
  "aka":     { "en": "...", "fa": "..." },                                               // optional
  "tagline": { "en": "...", "fa": "..." },       // <= 90 chars, catchy
  "intent":  { "en": "...", "fa": "..." },       // "the big idea", 1–2 sentences (<= 320 chars)
  "problem": { "en": "...", "fa": "..." },       // concrete paragraph: what goes wrong without it
  "solution":{ "en": "...", "fa": "..." },       // paragraph: how React solves it
  "analogy": { "en": "...", "fa": "..." },       // real-world analogy
  "concepts": [ { "name": "useState(initial)", "role": { "en": "...", "fa": "..." } } ],   // 2–7 key APIs/ideas
  "diagram": { "nodes": [ … ], "edges": [ … ] },  // see below
  "steps":         { "en": [3–7 items], "fa": [...] },   // how to apply it
  "whenToUse":     { "en": [2–6], "fa": [...] },
  "bestPractices": { "en": [2–6], "fa": [...] },
  "pitfalls":      { "en": [2–6], "fa": [...] },          // common mistakes
  "proTips":       { "en": [2–6], "fa": [...] },          // expert insight: internals, perf, React 19, Compiler
  "realWorld":     { "en": [1–5], "fa": [...] },          // where it shows up: libraries, well-known apps
  "related": [ { "id": "use-reducer", "note": { "en": "how they differ / combine", "fa": "..." } } ],
  "example": {
    "title": {...}, "description": {...},
    "highlights": [ { "lines": [start, end], "note": {...} } ]   // 3–5 walkthrough notes, 1-based lines of example.jsx
  },
  "quiz": [ 4 × { "question": {...}, "options": { "en": [4], "fa": [4] }, "answer": 0-3, "explanation": {...} } ],
  "scenarios": [ 2 × { "en": "...", "fa": "..." } ],
  "exercise": {
    "title": {...}, "task": {...},
    "hints": { "en": [2–4], "fa": [...] }            // progressive: vague → specific
  }
}
```

### Diagram (component / data-flow diagram, rendered as clay blocks)

- Grid of **4 columns × 4 rows** (`col` 0–3, `row` 0–3), one node per cell. Put parents/owners on top
  (row 0) and children below; the outside world (DOM, events, servers, browser APIs) on the edges.
  3–7 nodes is ideal.
- `kind`: `component` (a React component), `hook` (a built-in or custom hook), `state` (a piece of state,
  a reducer's state, a store's data, a ref box), `context` (a context object/provider value), `external`
  (DOM node, browser API, server, event, timer, promise), `note`.
- `id` is also the displayed title (max ~22 chars). Optional `label` overrides the display text
  (e.g. `"id": "StateSlot", "label": "React state slot"`).
- `members` (optional, ≤ 4 entries, ≤ 30 chars each): props, state, returned values or key lines, e.g.
  `props: items, onSelect`, `state: query`, `→ [value, setValue]`, `useEffect(…, [id])`.
- Edge `type`:
  - `renders` – parent renders child (solid line, filled diamond at the parent)
  - `props` – passes data down as props (solid arrow)
  - `callback` – calls a callback / event flows up (dashed arrow)
  - `uses` – calls a hook / reads something (dashed arrow)
  - `provides` – provides a context value / resource (dotted arrow)
  - `subscribes` – subscribes to a store / event source (dashed arrow, circle at the subscriber)
  - `updates` – sets state / dispatches an action (solid arrow, filled head)
  - `triggers` – schedules a re-render / effect run (dashed arrow, filled head)
- Optional edge `label` ≤ 18 chars (`"onAdd"`, `"items"`, `"dispatch(add)"`).

### Quiz

- Exactly **4** questions: at least one conceptual ("what problem does it solve / what happens"), one
  about code (predict the output/behaviour of a snippet, spot the bug), one on trade-offs / when not to
  use it, one comparing with a related concept.
- 4 plausible options each; **vary the index of the correct answer** across questions (0–3).
- The Persian options must be in the **same order** as the English ones (same `answer` index).
- Explanations teach — say *why* the right answer is right.

### Scenarios

Two short real-world situations (1–2 sentences) for which this lesson's concept is the best fit. Used in
the "Concept match" game where the learner picks the lesson — **never mention the lesson's name** or an
obvious giveaway word (for `use-state` don't write "state"; for `portals` don't write "portal").

## Persian (fa) writing guidelines

- Natural, fluent, technical Persian as written by an experienced Iranian front-end developer — not a
  word-by-word translation. Use the zero-width non-joiner (ZWNJ, U+200C) correctly: `می‌شود`،
  `کامپوننت‌ها`، `پیاده‌سازی`، `به‌روزرسانی`.
- Keep established English technical terms in Latin script where Iranian developers do (e.g. `state`,
  `props`, `hook`, `render`, `effect`, `reducer`, `context`, `Suspense`, `key`, `callback`, `memoize`),
  optionally with a Persian equivalent in parentheses the first time. Code identifiers always in backticks.
- Write "React", "JSX" as Latin words (the app fixes bidi direction automatically). Don't reverse them.
- Lesson `name.fa`: keep the API name in Latin and add a short Persian description, e.g.
  `"useState: حافظهٔ کامپوننت"`, `"Context: عبور از prop drilling"`, `"پورتال‌ها (Portals)"`.
- Use Persian punctuation: `،` for commas, `؛` for semicolons, `«»` for quotes.
