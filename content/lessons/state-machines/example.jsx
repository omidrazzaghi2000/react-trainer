// State machines: a weather lookup whose reducer only accepts events valid in its state.
import { useReducer, useState } from 'react';

const FORECASTS = { tehran: '24°C, sunny', oslo: '4°C, rain', tokyo: '18°C, cloudy' };

// Fake API: 1 s of latency; unknown cities are rejected.
function fetchForecast(city) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const forecast = FORECASTS[city.toLowerCase()];
      if (forecast) resolve(forecast);
      else reject(new Error(`No forecast for "${city}".`));
    }, 1000);
  });
}

// One object shape per state — data only exists where it makes sense:
// { status: 'idle' } | { status: 'loading', city }
// { status: 'success', city, forecast } | { status: 'error', city, message }
export function weatherMachine(state, event) {
  switch (state.status) {
    case 'idle':
    case 'success':
    case 'error':
      if (event.type === 'SEARCH') return { status: 'loading', city: event.city };
      return state; // e.g. a late RESOLVE after Cancel: ignored
    case 'loading': {
      if (event.type === 'CANCEL') return { status: 'idle' };
      // Guard: an answer only counts if it is for the city we are waiting for.
      const current = event.city === state.city;
      if (event.type === 'RESOLVE' && current) {
        return { status: 'success', city: state.city, forecast: event.forecast };
      }
      if (event.type === 'REJECT' && current) {
        return { status: 'error', city: state.city, message: event.message };
      }
      return state; // SEARCH while loading, or a stale answer: ignored
    }
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(weatherMachine, { status: 'idle' });
  const [city, setCity] = useState('Tehran');
  // A pure machine can answer "would this event change anything right now?"
  const canSearch = weatherMachine(state, { type: 'SEARCH', city }) !== state;

  function search(e) {
    e.preventDefault();
    if (!canSearch) return; // don't start work the machine would ignore
    dispatch({ type: 'SEARCH', city });
    fetchForecast(city).then(
      (forecast) => {
        console.log(`answer for ${city} arrived; the machine decides if it still counts`);
        dispatch({ type: 'RESOLVE', city, forecast });
      },
      (err) => dispatch({ type: 'REJECT', city, message: err.message }),
    );
  }

  return (
    <section className="card stack">
      <h2>Weather</h2>
      <form className="row" onSubmit={search}>
        <input aria-label="City" value={city} onChange={(e) => setCity(e.target.value)} />
        <button className="primary" disabled={!canSearch}>Search</button>
      </form>
      {/* Render by status: each branch can only read the data its state carries. */}
      {state.status === 'idle' && <p className="muted">Try Oslo, Tokyo or Atlantis.</p>}
      {state.status === 'loading' && (
        <div className="row">
          <span className="spinner" /> Loading {state.city}…
          <button onClick={() => dispatch({ type: 'CANCEL' })}>Cancel</button>
        </div>
      )}
      {state.status === 'success' && <p className="success">{state.city}: {state.forecast}</p>}
      {state.status === 'error' && <p role="alert" className="error">{state.message}</p>}
    </section>
  );
}
