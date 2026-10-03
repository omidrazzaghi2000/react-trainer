// Reconciliation: state belongs to a position in the tree; type and key decide identity.
import { useEffect, useState } from 'react';

function RepCounter({ exercise, highlight }) {
  const [reps, setReps] = useState(0);
  // Render phase: React calls this function to calculate the UI. Keep it pure.
  console.log(`render: RepCounter(${exercise})`);
  // Effects run after the commit phase, once React has updated the DOM.
  useEffect(() => {
    console.log(`commit: ${exercise} counter is on screen`);
  }, [exercise]);

  return (
    <div className="card row" style={highlight ? { borderColor: '#2563eb' } : undefined}>
      <strong>{exercise}</strong>
      <span>Reps: {reps}</span>
      <button onClick={() => setReps((r) => r + 1)} aria-label={`Add a rep to ${exercise}`}>
        +1
      </button>
    </div>
  );
}

// Never define a component inside another one: `function Row() {…}` inside App would
// be a brand-new type on every render, so React would remount it and wipe its state.

export default function App() {
  const [exercise, setExercise] = useState('Squats');
  const [highlight, setHighlight] = useState(false);
  const [resting, setResting] = useState(false);

  return (
    <section className="stack">
      <div className="row">
        {['Squats', 'Push-ups'].map((name) => (
          <button key={name} aria-pressed={exercise === name}
            onClick={() => setExercise(name)}>
            {name}
          </button>
        ))}
        <label>
          <input type="checkbox" checked={highlight}
            onChange={(e) => setHighlight(e.target.checked)} /> Highlight
        </label>
        <label>
          <input type="checkbox" checked={resting}
            onChange={(e) => setResting(e.target.checked)} /> Rest
        </label>
      </div>

      <p className="muted">1. Same type, same position: reps survive new props.</p>
      <RepCounter exercise={exercise} highlight={highlight} />

      <p className="muted">2. key={'{exercise}'}: a new key means a fresh counter.</p>
      <RepCounter key={exercise} exercise={exercise} highlight={highlight} />

      <p className="muted">3. Another type in the same slot unmounts the counter.</p>
      {resting ? (
        <p className="warning">Resting… the Plank counter is unmounted.</p>
      ) : (
        <RepCounter exercise="Plank" />
      )}
    </section>
  );
}
