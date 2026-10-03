// Exercise: drive a stopwatch with useEffect: start, pause, clean up, sync the tab title.
import { useEffect, useState } from 'react';

export default function App() {
  const [tenths, setTenths] = useState(0); // elapsed time in tenths of a second
  const [running, setRunning] = useState(false);

  // TODO 1: add an effect that, while `running` is true, starts an interval adding 1 to
  //         `tenths` every 100 ms. Use the updater form: setTenths((t) => t + 1).
  //         Put `running` in the dependency array so the effect re-runs on Start/Pause.
  // TODO 2: return a cleanup function from that effect that clears the interval.
  //         Cleanup is what makes Pause (and unmounting) really stop the clock.

  const seconds = (tenths / 10).toFixed(1);

  // TODO 3: add a second effect that keeps the browser tab title in sync:
  //         document.title = `${seconds} s · Stopwatch`

  function reset() {
    setRunning(false);
    setTenths(0);
  }

  return (
    <section className="card stack" aria-label="Stopwatch">
      <h2>Stopwatch</h2>
      <p role="timer" style={{ fontSize: 32, fontVariantNumeric: 'tabular-nums' }}>
        {seconds} s
      </p>
      <div className="row">
        <button className="primary" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button onClick={reset}>Reset</button>
      </div>
    </section>
  );
}
