// Exercise: make the step counters remember their value with useState.
import { useState } from 'react';

function StepCounter({ name }) {
  // TODO 1: replace this plain variable with a state variable:
  //         const [steps, setSteps] = useState(0);
  let steps = 0;

  function addOne() {
    // TODO 2: call the setter instead of changing a local variable.
    steps = steps + 1;
  }

  function addFive() {
    // TODO 3: this must add exactly 5 — use the updater form setSteps((s) => s + 1).
    for (let i = 0; i < 5; i++) {
      steps = steps + 1;
    }
  }

  function reset() {
    // TODO 4: put the steps back to 0.
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
