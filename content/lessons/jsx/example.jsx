// JSX: a weather card built from expressions, attributes, styles and a fragment.
const forecast = {
  city: 'Tabriz',
  tempC: 18.6,
  sky: 'Partly cloudy',
  humidity: 64,
  windKmh: 12,
};

// JSX is only syntax: this line compiles to jsx('span', { className, children }).
const liveBadge = <span className="badge">Live</span>;
console.log('A JSX element is a plain object:', liveBadge.type, liveBadge.props);

const toFahrenheit = (c) => Math.round(c * 1.8 + 32);

// A fragment <>…</> returns several siblings without an extra DOM node.
// A <div> wrapper here would put invalid markup inside the <dl>.
function Stat({ label, value }) {
  return (
    <>
      <dt className="muted">{label}</dt>
      <dd style={{ margin: 0, fontWeight: 600 }}>{value}</dd>
    </>
  );
}

export default function App() {
  const { city, tempC, sky, humidity, windKmh } = forecast;
  // style is just an object, so you can build it with JavaScript first.
  const humidityBar = { width: `${humidity}%`, height: '100%', background: '#3b82f6' };

  // One root: everything the component returns sits inside a single <section>.
  return (
    <section className="card stack" aria-label={`Weather in ${city}`}>
      {/* Comments in JSX need braces. HTML's class is written className. */}
      <div className="row">
        {/* SVG attributes are camelCase too, and empty tags must self-close. */}
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b"
          strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19" />
        </svg>
        <h2 style={{ margin: 0 }}>{city}</h2>
        {liveBadge}
      </div>

      {/* Any expression fits in braces: math, function calls, method calls… */}
      <p style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
        {Math.round(tempC)}°C <span className="muted">/ {toFahrenheit(tempC)}°F</span>
      </p>
      <p className="muted" style={{ margin: 0 }}>{sky.toUpperCase()}</p>

      {/* Outer braces = "JavaScript here", inner braces = the style object. */}
      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={humidityBar} />
      </div>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
        <Stat label="Humidity" value={`${humidity}%`} />
        <Stat label="Wind" value={`${windKmh} km/h`} />
        <Stat label="Feels like" value={`${Math.round(tempC - 1.5)}°C`} />
      </dl>
      {/* Writing {forecast} here would crash: objects are not valid as a React child. */}
    </section>
  );
}
