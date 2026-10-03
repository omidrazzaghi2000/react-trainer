// useRef: a podcast player with DOM refs (focus, scroll) and ref boxes (timer id, counters).
import { useEffect, useRef, useState } from 'react';

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function App() {
  const [seconds, setSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [notes, setNotes] = useState([]);

  // Boxes that survive re-renders. Changing .current never triggers a render.
  const intervalRef = useRef(null);
  const skipsRef = useRef(0);
  const nextIdRef = useRef(1);
  // React fills these with DOM nodes after the commit (null during the first render).
  const inputRef = useRef(null);
  const listRef = useRef(null);

  function play() {
    if (intervalRef.current !== null) return; // already playing
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setPlaying(true);
  }

  function pause() {
    clearInterval(intervalRef.current); // the id survived every render since play()
    intervalRef.current = null;
    setPlaying(false);
  }

  function skip() {
    setSeconds((s) => s + 15);
    skipsRef.current += 1; // silent bookkeeping: no re-render for this counter
    console.log(`skipped ${skipsRef.current} time(s)`);
  }

  // If the player unmounts while playing, stop the timer.
  useEffect(() => () => clearInterval(intervalRef.current), []);

  // After a new note is on screen, scroll the list DOM node to the bottom.
  useEffect(() => {
    const list = listRef.current;
    list.scrollTop = list.scrollHeight;
  }, [notes]);

  function saveNote(e) {
    e.preventDefault();
    const text = inputRef.current.value.trim(); // read the DOM input directly
    if (!text) return;
    setNotes([...notes, { id: nextIdRef.current++, at: seconds, text }]);
    inputRef.current.value = '';
  }

  // Never read or write ref.current here in the render body: it isn't tracked by React.
  return (
    <section className="card stack" aria-label="Podcast player">
      <h3>Episode 12: Hooks in depth</h3>
      <p>
        <strong>{clock(seconds)}</strong>{' '}
        <span className="muted">{playing ? 'playing' : 'paused'}</span>
      </p>
      <div className="row">
        <button className="primary" onClick={playing ? pause : play}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button onClick={skip}>+15 s</button>
        <button onClick={() => inputRef.current.focus()}>Take a note</button>
      </div>
      <ul className="list" ref={listRef} style={{ maxHeight: 110, overflowY: 'auto' }}>
        {notes.map((n) => (
          <li key={n.id}>
            <span className="badge">{clock(n.at)}</span> {n.text}
          </li>
        ))}
      </ul>
      <form className="row" onSubmit={saveNote}>
        <input ref={inputRef} aria-label="Note" placeholder="What did you just hear?" />
        <button>Save</button>
      </form>
    </section>
  );
}
