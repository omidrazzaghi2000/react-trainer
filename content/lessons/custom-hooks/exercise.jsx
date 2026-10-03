// Exercise: build three custom hooks for a reader settings panel.
import { useEffect, useState } from 'react';

export function useToggle(initial = false) {
  // TODO 1: keep `on` in state and return [on, toggle], where toggle flips it.
  const on = initial;
  const toggle = () => {};
  return [on, toggle];
}

export function useLocalStorage(key, initial) {
  // TODO 2: use a lazy initializer that returns the saved value
  //         (JSON.parse of localStorage.getItem(key)), or `initial` when nothing is saved.
  const [value, setValue] = useState(initial);

  // TODO 3: after every change, save it: localStorage.setItem(key, JSON.stringify(value)).

  return [value, setValue];
}

export function usePersistentToggle(key, initial = false) {
  // TODO 4: build this hook from useLocalStorage(key, initial) so the choice is remembered.
  return useToggle(initial);
}

export default function App() {
  const [dark, toggleDark] = usePersistentToggle('reader-dark', false);
  const [largeText, toggleLargeText] = useToggle(false);
  const [name, setName] = useLocalStorage('reader-name', '');

  return (
    <section
      className="card stack"
      style={{ background: dark ? '#1e293b' : undefined, color: dark ? '#f1f5f9' : undefined }}
    >
      <h2>Reader settings</h2>
      <label className="stack">
        Your name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="row">
        <button aria-pressed={dark} onClick={toggleDark}>Dark mode</button>
        <button aria-pressed={largeText} onClick={toggleLargeText}>Large text</button>
      </div>
      <p style={{ fontSize: largeText ? 20 : 14 }}>
        {name ? `Welcome back, ${name}!` : 'Welcome, reader!'}
      </p>
    </section>
  );
}
