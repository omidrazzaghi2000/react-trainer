// Exercise: load team profiles with loading, error and race-condition handling.
import { useEffect, useState } from 'react';

// A fake API (no network). Grace answers slowly, Linus quickly, "ghost" does not exist.
const USERS = {
  ada: { name: 'Ada Lovelace', role: 'First programmer' },
  grace: { name: 'Grace Hopper', role: 'Compiler pioneer' },
  linus: { name: 'Linus Torvalds', role: 'Creator of Linux' },
};
const DELAYS = { ada: 150, grace: 300, linus: 50, ghost: 100 };

function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (USERS[id]) resolve(USERS[id]);
      else reject(new Error('User not found'));
    }, DELAYS[id]);
  });
}

const CHOICES = [
  { id: 'ada', label: 'Ada' },
  { id: 'grace', label: 'Grace' },
  { id: 'linus', label: 'Linus' },
  { id: 'ghost', label: 'Ghost' },
];

export default function App() {
  const [userId, setUserId] = useState('ada');
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // TODO 1: create an `ignore` flag and set the status back to 'loading'.

    fetchUser(userId).then((data) => {
      // TODO 2: skip these updates when `ignore` is true (the answer is outdated).
      setUser(data);
      setStatus('success');
    });
    // TODO 3: add .catch() that stores err.message and sets the status to 'error'
    //         (unless the answer is outdated).

    // TODO 4: return a cleanup function that sets `ignore = true`.
  }, []); // TODO 5: fetch again whenever userId changes.

  return (
    <section className="card stack">
      <h2>Team directory</h2>
      <div className="row" role="group" aria-label="Users">
        {CHOICES.map((c) => (
          <button key={c.id} aria-pressed={userId === c.id} onClick={() => setUserId(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      {status === 'loading' && <p className="muted">Loading…</p>}
      {status === 'error' && <p className="error" role="alert">{error}</p>}
      {status === 'success' && (
        <article className="card">
          <h3>{user.name}</h3>
          <p className="muted">{user.role}</p>
        </article>
      )}
    </section>
  );
}
