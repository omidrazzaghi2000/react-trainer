// Data fetching: weather per city with loading, error and stale-answer guards.
import { useEffect, useState } from 'react';

// A fake API (no network): every city answers at a different speed, one always fails.
const TEMPS = { Tehran: 31, Oslo: 12, Tokyo: 24 };
const DELAYS = { Tehran: 300, Oslo: 80, Tokyo: 180, Atlantis: 120 };

function fetchWeather(city) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (city in TEMPS) resolve({ city, temp: TEMPS[city] });
      else reject(new Error(`No weather station in ${city}.`));
    }, DELAYS[city]);
  });
}

export default function App() {
  const [city, setCity] = useState('Tehran');
  const [reloads, setReloads] = useState(0);
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false; // flipped by the cleanup once this request is outdated
    setStatus('loading');
    console.log('fetching', city);

    fetchWeather(city)
      .then((data) => {
        if (ignore) {
          console.log('ignored a stale answer for', data.city);
          return;
        }
        setWeather(data);
        setStatus('success');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message);
        setStatus('error');
      });

    // Runs before the next request and on unmount. With a real fetch(),
    // calling controller.abort() here would also cancel the network request.
    return () => {
      ignore = true;
    };
  }, [city, reloads]); // refetch when the city changes or Refresh is clicked

  return (
    <section className="card stack">
      <h2>Weather</h2>
      <div className="row">
        <select aria-label="City" value={city} onChange={(e) => setCity(e.target.value)}>
          {Object.keys(DELAYS).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button onClick={() => setReloads((n) => n + 1)}>Refresh</button>
      </div>
      {status === 'loading' && (
        <p className="row">
          <span className="spinner" /> Loading {city}…
        </p>
      )}
      {status === 'error' && <p className="error" role="alert">{error}</p>}
      {status === 'success' && (
        <p>
          {weather.city}: <strong>{weather.temp}°C</strong>
        </p>
      )}
    </section>
  );
}
