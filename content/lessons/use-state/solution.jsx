// Exercise: make the step counters remember their value with useState.
import { useState } from 'react';

function StepCounter({ name }) {
  const [steps, setSteps] = useState(0);

  function addOne() {
    setSteps((s) => s + 1);
  }

  function addFive() {
    for (let i = 0; i < 5; i++) {
      setSteps((s) => s + 1);
    }
  }

  function reset() {
    setSteps(0);
  }

  return (
    <section className="card" aria-label={name}>
      <h3>{name}</h3>
      <p>Steps: {steps}</p>
      <div className="row">
        <button onClick={addOne}>+1</button>
        <button onClick={addFive}>+5</button>
        <button onClick={reset}>Reset</button>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="stack">
      <StepCounter name="Ada" />
      <StepCounter name="Linus" />
    </div>
  );
}
