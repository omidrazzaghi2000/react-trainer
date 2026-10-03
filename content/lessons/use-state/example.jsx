// useState: a coffee order card with two pieces of state and a derived total.
import { useState } from 'react';

const PRICES = { small: 2.5, medium: 3, large: 3.5 };

export default function App() {
  // Each useState call gives this component one "memory slot".
  const [size, setSize] = useState('medium');
  const [cups, setCups] = useState(1);

  // Derived data is calculated during render — it is never stored in state.
  const total = (PRICES[size] * cups).toFixed(2);

  function addCup() {
    // The updater form receives the latest pending value.
    setCups((c) => c + 1);
  }

  function addThree() {
    // Three queued updaters → +3. With setCups(cups + 1) it would be +1.
    setCups((c) => c + 1);
    setCups((c) => c + 1);
    setCups((c) => c + 1);
    // State is a snapshot: this render still sees the old value.
    console.log('cups in this render:', cups);
  }

  function removeCup() {
    setCups((c) => Math.max(1, c - 1));
  }

  return (
    <section className="card stack">
      <h2>Coffee order</h2>
      <div className="row" role="group" aria-label="Size">
        {Object.keys(PRICES).map((s) => (
          <button key={s} aria-pressed={size === s} onClick={() => setSize(s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="row">
        <button onClick={removeCup} aria-label="Remove a cup">−</button>
        <strong>
          {cups} {cups === 1 ? 'cup' : 'cups'}
        </strong>
        <button onClick={addCup} aria-label="Add a cup">+</button>
        <button onClick={addThree}>+3</button>
      </div>
      <p className="total">
        Total: <strong>${total}</strong>
      </p>
    </section>
  );
}
