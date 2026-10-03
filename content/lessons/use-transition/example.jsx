// useTransition: café tabs that never freeze the page or flash a spinner.
import { useState, useTransition, lazy, Suspense } from 'react';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The Reviews tab "downloads" its code for 1 s the first time → it suspends.
const Reviews = lazy(() => wait(1000).then(() => ({ default: ReviewList })));

function ReviewList() {
  return <p>"Best flat white in town." — Sam</p>;
}

function Menu() {
  return <p>Espresso · Latte · Flat white · Cortado</p>;
}

// Each row burns ~1 ms of CPU. React can pause *between* rows during a transition.
function SlowOrder({ n }) {
  const start = performance.now();
  while (performance.now() - start < 1) {
    // pretend this is expensive formatting work
  }
  return <li>Order #{n} · flat white</li>;
}

function Orders() {
  const rows = [];
  for (let n = 1; n <= 250; n++) rows.push(<SlowOrder key={n} n={n} />);
  return <ul className="list">{rows}</ul>;
}

const TABS = { Menu, Orders, Reviews };

export default function App() {
  const [tab, setTab] = useState('Menu');
  const [smooth, setSmooth] = useState(true);
  const [isPending, startTransition] = useTransition();

  function select(next) {
    console.log(`clicked ${next} → ${smooth ? 'transition' : 'urgent'} update`);
    if (!smooth) {
      setTab(next); // urgent: blocks the page; a suspending tab shows the fallback
      return;
    }
    // Non-urgent: React may pause, restart or delay this render.
    startTransition(() => {
      setTab(next);
    });
  }

  const Panel = TABS[tab];

  return (
    <section className="card stack">
      <div className="row" role="tablist" aria-label="Café sections">
        {Object.keys(TABS).map((name) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            onClick={() => select(name)}
          >
            {name}
          </button>
        ))}
        {isPending && <span className="spinner" role="status" aria-label="Loading" />}
      </div>
      {/* Stale content is dimmed, not replaced by the Suspense fallback. */}
      <div style={{ opacity: isPending ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        <Suspense fallback={<p className="muted">Loading reviews…</p>}>
          <Panel />
        </Suspense>
      </div>
      <label className="row muted">
        <input
          type="checkbox"
          checked={smooth}
          onChange={(e) => setSmooth(e.target.checked)}
        />
        Use startTransition (try Orders → Menu quickly)
      </label>
    </section>
  );
}
