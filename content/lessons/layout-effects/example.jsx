// useLayoutEffect: a tooltip that measures itself and flips before the browser paints.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const GAP = 8;

function Tooltip({ anchor, children }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0); // unknown until the tooltip is in the DOM

  // Runs after React has updated the DOM but BEFORE the browser paints. The extra
  // render caused by setHeight also happens before paint, so nobody sees a jump.
  useLayoutEffect(() => {
    const measured = ref.current.getBoundingClientRect().height;
    console.log('layout effect: tooltip is', measured, 'px tall');
    setHeight(measured);
  }, [children]); // new text → new height → measure again

  useEffect(() => {
    console.log('effect: runs after the layout effect, normally after paint');
  }, []);

  // Not enough room above the anchor? Flip below it.
  const fitsAbove = anchor.top - height - GAP >= 0;
  const top = fitsAbove ? anchor.top - height - GAP : anchor.bottom + GAP;

  return (
    <div ref={ref} role="tooltip" className="card"
      style={{ position: 'fixed', top, left: anchor.left, maxWidth: 220, padding: 8 }}>
      {children}
      <div className="muted">placed {fitsAbove ? 'above' : 'below'}</div>
    </div>
  );
}

const CITIES = [
  { name: 'Oslo', forecast: '4°C and light snow. Wind 20 km/h from the north.' },
  { name: 'Tehran', forecast: '22°C and sunny. Clear skies all afternoon.' },
  { name: 'Lima', forecast: '18°C, overcast. Light drizzle after sunset.' },
];

export default function App() {
  const [active, setActive] = useState(null); // { city, anchor }

  function show(city, e) {
    // Event handlers may read layout: grab the anchor's position right now.
    setActive({ city, anchor: e.currentTarget.getBoundingClientRect() });
  }

  return (
    <section className="card stack">
      <strong>Forecast (hover or focus a city)</strong>
      {CITIES.map((city) => (
        <button key={city.name} style={{ alignSelf: 'flex-start' }}
          onMouseEnter={(e) => show(city, e)} onMouseLeave={() => setActive(null)}
          onFocus={(e) => show(city, e)} onBlur={() => setActive(null)}>
          {city.name}
        </button>
      ))}
      {active && <Tooltip anchor={active.anchor}>{active.city.forecast}</Tooltip>}
    </section>
  );
}
