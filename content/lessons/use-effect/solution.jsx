// Exercise: drive a stopwatch with useEffect: start, pause, clean up, sync the tab title.
import { useEffect, useState } from 'react';

export default function App() {
  const [tenths, setTenths] = useState(0); // elapsed time in tenths of a second
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTenths((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [running]);

  const seconds = (tenths / 10).toFixed(1);

  useEffect(() => {
    document.title = `${seconds} s · Stopwatch`;
  }, [seconds]);

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
