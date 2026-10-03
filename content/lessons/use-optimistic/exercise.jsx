// Exercise: make new recipe comments appear instantly with useOptimistic.
import { startTransition, useOptimistic, useState } from 'react';

let nextId = 3;

// Fake server: 300 ms of latency; comments containing "fail" are rejected.
function postComment(text) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (/fail/i.test(text)) reject(new Error('the server rejected it'));
      else resolve({ id: nextId++, text });
    }, 300);
  });
}

export default function App() {
  const [comments, setComments] = useState([
    { id: 1, text: 'Made this tonight, delicious!' },
    { id: 2, text: 'Works with less sugar too.' },
  ]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(null);

  // TODO 1: derive a temporary list from `comments`:
  //   const [optimisticComments, addOptimisticComment] = useOptimistic(comments, updateFn);
  //   updateFn(current, text) returns `current` plus { id: …, text, pending: true }.

  function post() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setError(null);
    // An async transition is an Action: React knows when all of it is finished.
    startTransition(async () => {
      // TODO 2: show the comment right away — call addOptimisticComment(text) here.
      try {
        const saved = await postComment(text);
        // Updates after an await need their own startTransition to join the Action.
        startTransition(() => setComments((list) => [...list, saved]));
      } catch (err) {
        setError(`Could not post "${text}": ${err.message}.`);
      }
    });
  }

  return (
    <section className="card stack">
      <h2>Comments</h2>
      <ul className="list" aria-label="Comments">
        {/* TODO 3: render optimisticComments instead, so pending comments show up too. */}
        {comments.map((c) => (
          <li key={c.id}>
            {c.text} {c.pending && <small className="muted">Sending…</small>}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="row">
        <input aria-label="Comment" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button type="button" className="primary" onClick={post}>
          Post
        </button>
      </div>
    </section>
  );
}
