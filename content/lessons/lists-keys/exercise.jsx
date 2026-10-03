// Exercise: make every "Arrived" tick stay with the right guest.
import { useState } from 'react';

const INITIAL_GUESTS = [
  { id: 1, name: 'Grace' },
  { id: 2, name: 'Linus' },
  { id: 3, name: 'Ada' },
];

// New ids are created once, when a guest is added, never during render.
let nextId = 4;

function byName(a, b) {
  return a.name.localeCompare(b.name);
}

function GuestRow({ guest, onRemove }) {
  // Each row owns its "arrived" state. React keeps that state with the row's key.
  const [arrived, setArrived] = useState(false);
  return (
    <li className="row">
      <label className="row">
        <input
          type="checkbox"
          checked={arrived}
          onChange={(e) => setArrived(e.target.checked)}
        />
        {guest.name}
      </label>
      <button aria-label={`Remove ${guest.name}`} onClick={() => onRemove(guest.id)}>
        ×
      </button>
    </li>
  );
}

export default function App() {
  const [guests, setGuests] = useState(INITIAL_GUESTS);
  const [name, setName] = useState('');
  const [sorted, setSorted] = useState(false);

  // TODO 3: sort() reorders the array it is called on, and here that is the state itself!
  //         Sort a copy instead: [...guests].sort(byName)
  const visible = sorted ? guests.sort(byName) : guests;

  function addGuest(e) {
    e.preventDefault();
    if (!name.trim()) return;
    // TODO 1: every guest needs a unique, stable id. Create it here with nextId++.
    setGuests([{ name: name.trim() }, ...guests]);
    setName('');
  }

  function removeGuest(id) {
    setGuests(guests.filter((guest) => guest.id !== id));
  }

  return (
    <section className="card stack">
      <h2>Guest list</h2>
      <form className="row" onSubmit={addGuest}>
        <input
          aria-label="Guest name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add</button>
        <button type="button" aria-pressed={sorted} onClick={() => setSorted(!sorted)}>
          Sort A–Z
        </button>
      </form>
      <ul className="list">
        {visible.map((guest, index) => (
          // TODO 2: an index is a position, not an identity. Key each row by guest.id.
          <GuestRow key={index} guest={guest} onRemove={removeGuest} />
        ))}
      </ul>
    </section>
  );
}
