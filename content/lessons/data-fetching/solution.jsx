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
    let ignore = false;
    setStatus('loading');

    fetchUser(userId)
      .then((data) => {
        if (ignore) return;
        setUser(data);
        setStatus('success');
      })
      .catch((err) => {
        if (ignore) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

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
