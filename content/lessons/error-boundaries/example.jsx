// Error boundaries: one crashing widget shows a fallback; the rest of the page keeps working.
import { Component, useState } from 'react';

class ErrorBoundary extends Component {
  state = { error: null };

  // Render phase: turn the error into state, so the next render shows the fallback.
  static getDerivedStateFromError(error) {
    return { error };
  }

  // Commit phase: side effects such as sending a report (info.componentStack says where).
  componentDidCatch(error, info) {
    console.log('[report]', error.message);
  }

  reset = () => {
    this.props.onReset?.(); // let the parent fix the cause first (e.g. refetch)
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="card">
        <p className="error">{this.props.title} failed: {this.state.error.message}</p>
        <button onClick={this.reset}>Try again</button>
      </div>
    );
  }
}

// Throws while rendering when the data is bad (Tehran arrives without a temperature).
function Forecast({ city }) {
  if (typeof city.temp !== 'number') throw new Error(`No temperature for ${city.name}`);
  return <p className="card"><strong>{city.name}</strong> {city.temp}°C</p>;
}

const FRESH = { Oslo: 4, Tehran: 22 };
const fetchRadar = () =>
  new Promise((_, reject) => setTimeout(() => reject(new Error('Radar is offline')), 300));

// Boundaries never see errors thrown in event handlers or async code on their own.
// Catch the error, store it, and re-throw it during render to hand it to the boundary.
function Radar() {
  const [error, setError] = useState(null);
  if (error) throw error;
  return <button onClick={() => fetchRadar().catch(setError)}>Load radar</button>;
}

export default function App() {
  const [cities, setCities] = useState([{ name: 'Oslo', temp: 4 }, { name: 'Tehran' }]);

  function refetch(name) {
    setCities((all) => all.map((c) => (c.name === name ? { name, temp: FRESH[name] } : c)));
  }

  return (
    <section className="stack">
      {cities.map((city) => (
        // One boundary per widget: a crash stays inside its own box.
        <ErrorBoundary key={city.name} title={city.name} onReset={() => refetch(city.name)}>
          <Forecast city={city} />
        </ErrorBoundary>
      ))}
      <ErrorBoundary title="Radar">
        <Radar />
      </ErrorBoundary>
    </section>
  );
}
