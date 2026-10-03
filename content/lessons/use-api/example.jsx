// use(): read a cached promise with Suspense, and read context even inside an if.
import { use, useState, Suspense, createContext, Component } from 'react';

const UnitContext = createContext('C');
const TEMPS = { Tehran: 31, Oslo: 12, Lima: 19 };

// Fake API: answers after 800 ms; unknown cities reject.
function fetchForecast(city) {
  console.log(`fetching ${city}…`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (city in TEMPS) resolve({ city, celsius: TEMPS[city] });
      else reject(new Error(`No station in ${city}`));
    }, 800);
  });
}

// The cache lives OUTSIDE render: the same city always gets the same promise.
const cache = new Map();
function getForecast(city) {
  if (!cache.has(city)) cache.set(city, fetchForecast(city));
  return cache.get(city);
}

function Forecast({ city }) {
  const forecast = use(getForecast(city)); // suspends until the promise settles
  return <p>{forecast.city}: <Temperature celsius={forecast.celsius} /></p>;
}

function Temperature({ celsius }) {
  if (celsius == null) return <span>no data</span>;
  // use(Context) may run after an early return — useContext may not.
  const unit = use(UnitContext);
  const text = unit === 'F' ? `${Math.round(celsius * 1.8 + 32)} °F` : `${celsius} °C`;
  return <strong>{text}</strong>;
}

// A rejected promise is thrown to the nearest error boundary.
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) return <p className="error">{this.state.error.message}</p>;
    return this.props.children;
  }
}

export default function App() {
  const [city, setCity] = useState(null);
  const [unit, setUnit] = useState('C');

  return (
    <UnitContext value={unit}>
      <section className="card stack">
        <div className="row">
          {['Tehran', 'Oslo', 'Lima', 'Atlantis'].map((c) => (
            <button key={c} aria-pressed={city === c} onClick={() => setCity(c)}>
              {c}
            </button>
          ))}
          <button onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}>
            Show °{unit === 'C' ? 'F' : 'C'}
          </button>
        </div>
        {city === null ? (
          <p className="muted">Pick a city. Cities you revisit load instantly (cached).</p>
        ) : (
          <ErrorBoundary key={city}>
            <Suspense fallback={<p><span className="spinner" /> Loading {city}…</p>}>
              <Forecast city={city} />
            </Suspense>
          </ErrorBoundary>
        )}
      </section>
    </UnitContext>
  );
}
