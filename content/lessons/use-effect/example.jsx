// useEffect: a chat room that connects, ticks a timer and syncs the tab title, then cleans up.
import { StrictMode, useEffect, useState } from 'react';

// A fake chat server. Real code would open a WebSocket here.
function createConnection(room) {
  return {
    connect: () => console.log(`✓ connected to #${room}`),
    disconnect: () => console.log(`× disconnected from #${room}`),
  };
}

function ChatRoom({ room }) {
  const [draft, setDraft] = useState('');
  const [online, setOnline] = useState(0);

  // Subscription: runs after the render is on screen, re-runs only when `room` changes.
  useEffect(() => {
    const connection = createConnection(room);
    connection.connect();
    return () => connection.disconnect(); // cleanup undoes exactly what the setup did
  }, [room]);

  // Timer: start once after the first render, stop it when the component unmounts.
  useEffect(() => {
    const id = setInterval(() => setOnline((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Keep a browser API (the tab title) in sync with React state.
  useEffect(() => {
    document.title = draft ? `Typing in #${room}…` : `#${room}`;
  }, [room, draft]);

  // No effect needed: derived data is simply computed during render…
  const charsLeft = 80 - draft.length;

  // …and logic caused by a specific click belongs in the event handler.
  function send() {
    console.log(`sent to #${room}: ${draft}`);
    setDraft('');
  }

  return (
    <section className="card stack" aria-label="Chat room">
      <h3>#{room}</h3>
      <p className="muted">Online for {online} s</p>
      <input
        aria-label="Message"
        placeholder="Say hi…"
        maxLength={80}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="row">
        <span className={charsLeft < 10 ? 'warning' : 'muted'}>{charsLeft} chars left</span>
        <button className="primary" onClick={send} disabled={!draft}>Send</button>
      </div>
    </section>
  );
}

export default function App() {
  const [room, setRoom] = useState('general');
  const [joined, setJoined] = useState(false);

  // In development, StrictMode runs setup → cleanup → setup for every newly mounted
  // component to prove the cleanup works. Press "Join room" and watch the console.
  return (
    <StrictMode>
      <div className="stack">
        <div className="row">
          <select aria-label="Room" value={room} onChange={(e) => setRoom(e.target.value)}>
            <option value="general">general</option>
            <option value="react">react</option>
            <option value="music">music</option>
          </select>
          <button onClick={() => setJoined((j) => !j)}>
            {joined ? 'Leave room' : 'Join room'}
          </button>
        </div>
        {joined ? <ChatRoom room={room} /> : <p className="muted">You are not in a room.</p>}
      </div>
    </StrictMode>
  );
}
