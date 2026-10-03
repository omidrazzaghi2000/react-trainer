// lazy & Suspense: a dashboard that downloads its heavy report widgets only on demand.
import { lazy, Suspense, useState } from 'react';

// Pretend these two components live in their own files (their own chunks).
function SalesChart() {
  return (
    <div className="stack">
      <h3>Sales this week</h3>
      <p className="muted">Mon 12 · Tue 18 · Wed 9 · Thu 22 · Fri 30</p>
    </div>
  );
}

function CustomerMap() {
  return <p>Customers: Berlin 41 · Tehran 37 · Toronto 22</p>;
}

// Stand-in for `import('./SalesChart.jsx')`: the first call "downloads" the
// chunk, later calls get the same cached promise — just like a real bundler.
const chunks = new Map();
function fakeImport(name, component, ms) {
  if (!chunks.has(name)) {
    console.log(`Downloading ${name}.js …`);
    const download = new Promise((resolve) => setTimeout(resolve, ms));
    chunks.set(name, download.then(() => ({ default: component })));
  }
  return chunks.get(name);
}
const loadChart = () => fakeImport('chart', SalesChart, 300);
const loadMap = () => fakeImport('map', CustomerMap, 700);

// lazy() runs once, at module level — never inside a component.
const LazyChart = lazy(loadChart);
const LazyMap = lazy(loadMap);

function Spinner({ label }) {
  return (
    <p className="row muted" role="status">
      <span className="spinner" /> {label}
    </p>
  );
}

export default function App() {
  const [tab, setTab] = useState('home');

  return (
    <section className="card stack">
      <div className="row">
        <button aria-pressed={tab === 'home'} onClick={() => setTab('home')}>
          Home
        </button>
        {/* Hovering starts both downloads early: the click then feels instant. */}
        <button
          aria-pressed={tab === 'reports'}
          onClick={() => setTab('reports')}
          onMouseEnter={() => { loadChart(); loadMap(); }}
        >
          Reports
        </button>
      </div>

      {tab === 'home' && <p>Welcome back! Open Reports to load the heavy widgets.</p>}

      {tab === 'reports' && (
        // The outer boundary covers the whole report; the tab bar stays usable.
        <Suspense fallback={<Spinner label="Loading report…" />}>
          <LazyChart />
          {/* Nested boundary: the slower map gets its own placeholder. Both are
              siblings, so both downloads start together — no waterfall. */}
          <Suspense fallback={<Spinner label="Loading map…" />}>
            <LazyMap />
          </Suspense>
        </Suspense>
      )}
    </section>
  );
}
