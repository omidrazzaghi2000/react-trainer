// Lifting state up: two temperature fields that agree because their parent owns the value.
import { useState } from 'react';

const toCelsius = (f) => ((f - 32) * 5) / 9;
const toFahrenheit = (c) => (c * 9) / 5 + 32;

function convert(text, formula) {
  const n = parseFloat(text);
  return Number.isNaN(n) ? '' : String(Math.round(formula(n) * 10) / 10);
}

// A controlled component: it owns no state. The parent decides what it shows
// and hears about every edit through onChange.
function TemperatureInput({ label, value, onChange }) {
  return (
    <label className="stack">
      {label}
      <input inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

// A sibling that reads the same lifted value, so it can never disagree.
function Advice({ celsius }) {
  if (Number.isNaN(celsius)) return <p className="muted">Type a temperature.</p>;
  if (celsius >= 25) return <p className="badge">T-shirt weather</p>;
  if (celsius >= 12) return <p className="badge">Bring a light jacket</p>;
  return <p className="badge">Wear a warm coat</p>;
}

export default function App() {
  // Single source of truth: what the user typed, and in which scale.
  const [temp, setTemp] = useState({ scale: 'c', text: '20' });

  // The other field is derived during render, never stored twice.
  const celsius = temp.scale === 'c' ? temp.text : convert(temp.text, toCelsius);
  const fahrenheit = temp.scale === 'f' ? temp.text : convert(temp.text, toFahrenheit);

  function update(scale, text) {
    console.log(`Parent state → ${text || '""'} °${scale.toUpperCase()}`);
    setTemp({ scale, text });
  }

  return (
    <section className="card stack">
      <h2>Weather converter</h2>
      <div className="row">
        <TemperatureInput
          label="Celsius"
          value={celsius}
          onChange={(text) => update('c', text)}
        />
        <TemperatureInput
          label="Fahrenheit"
          value={fahrenheit}
          onChange={(text) => update('f', text)}
        />
      </div>
      <Advice celsius={parseFloat(celsius)} />
      {/* The owner can change both children at once: that's the point of lifting. */}
      <button onClick={() => update('c', '20')}>Reset to 20 °C</button>
    </section>
  );
}
