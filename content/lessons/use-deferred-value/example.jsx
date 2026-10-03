// useDeferredValue: a search box that stays snappy while a slow track list catches up.
import { useState, useDeferredValue, memo } from 'react';

const MOODS = ['jazz', 'rock', 'lo-fi', 'soul'];
const TRACKS = Array.from({ length: 200 }, (_, i) => `Track ${i + 1} · ${MOODS[i % 4]}`);

// Each row burns ~1 ms of CPU, like a row with heavy formatting or highlighting.
function SlowTrack({ title }) {
  const start = performance.now();
  while (performance.now() - start < 1) {
    // expensive work React can pause between rows
  }
  return <li>{title}</li>;
}

// memo is what makes deferring pay off: while you type, App re-renders with the
// OLD deferred query, and memo lets React skip this whole slow subtree.
const TrackList = memo(function TrackList({ query }) {
  if (query === null) return <p className="muted">Preparing the list…</p>;
  const matches = TRACKS.filter((t) => t.includes(query.trim().toLowerCase()));
  console.log(`TrackList rendered for "${query}" → ${matches.length} rows`);
  return (
    <ul className="list">
      {matches.map((title) => (
        <SlowTrack key={title} title={title} />
      ))}
    </ul>
  );
});

export default function App() {
  const [query, setQuery] = useState('');
  // First paint uses the cheap initialValue (null); then React renders `query`
  // in the background. While typing, it lags behind `query` on purpose.
  const deferredQuery = useDeferredValue(query, null);
  const isStale = query !== deferredQuery;

  return (
    <section className="card stack">
      <label>
        Search tracks{' '}
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="jazz" />
      </label>
      <p className="muted" aria-live="polite">
        {isStale ? 'Updating…' : `Showing results for "${deferredQuery}"`}
      </p>
      {/* Stale-while-updating: keep the old list, just fade it. */}
      <div style={{ opacity: isStale ? 0.5 : 1, transition: 'opacity 0.2s 0.1s' }}>
        <TrackList query={deferredQuery} />
      </div>
    </section>
  );
}
