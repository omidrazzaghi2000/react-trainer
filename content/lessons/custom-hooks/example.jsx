// Custom hooks: a podcast finder built from small, reusable hooks.
import { useEffect, useState } from 'react';

// A custom hook is a plain function whose name starts with "use" and that calls hooks.
export function useToggle(initial = false) {
  const [on, setOn] = useState(initial);
  const toggle = () => setOn((v) => !v);
  return [on, toggle]; // a tuple: every caller picks its own names
}

export function useLocalStorage(key, initial) {
  // Lazy initializer: storage is read once, on the first render only.
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key);
    return saved === null ? initial : JSON.parse(saved);
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id); // a new keystroke cancels the pending timer
  }, [value, delay]);
  return debounced;
}

const EPISODES = [
  { title: 'Inside the React Compiler', minutes: 42 },
  { title: 'State machines 101', minutes: 35 },
  { title: 'Suspense in practice', minutes: 51 },
  { title: 'Testing custom hooks', minutes: 28 },
];

// Hooks compose: this one is built on useDebounce and returns an object.
function useEpisodeSearch(query) {
  const debounced = useDebounce(query, 300);
  useEffect(() => {
    console.log('searching for', JSON.stringify(debounced));
  }, [debounced]);
  const q = debounced.toLowerCase();
  const results = EPISODES.filter((e) => e.title.toLowerCase().includes(q));
  return { results, isStale: query !== debounced };
}

export default function App() {
  const [query, setQuery] = useLocalStorage('podcast-query', '');
  const { results, isStale } = useEpisodeSearch(query);
  // Two calls → two independent states. Hooks share logic, never state.
  const [showLength, toggleLength] = useToggle(true);
  const [newestFirst, toggleOrder] = useToggle(false);
  const list = newestFirst ? [...results].reverse() : results;

  return (
    <section className="card stack">
      <h2>Podcast finder</h2>
      <input
        aria-label="Search episodes"
        placeholder="Search episodes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="row">
        <button aria-pressed={showLength} onClick={toggleLength}>Durations</button>
        <button aria-pressed={newestFirst} onClick={toggleOrder}>Newest first</button>
        {isStale && <span className="muted">Searching…</span>}
      </div>
      <ul className="list">
        {list.map((e) => (
          <li key={e.title}>
            {e.title} {showLength && <span className="muted">· {e.minutes} min</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
