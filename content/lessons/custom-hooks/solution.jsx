// Exercise: build three custom hooks for a reader settings panel.
import { useEffect, useState } from 'react';

export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle];
}

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved === null ? initial : JSON.parse(saved);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

export function usePersistentToggle(key, initial = false) {
  const [on, setOn] = useLocalStorage(key, initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle];
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
