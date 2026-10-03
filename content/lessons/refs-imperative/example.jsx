// Refs as props: a chat composer that exposes a tiny imperative API to its parent.
import { useImperativeHandle, useRef, useState } from 'react';

// React 19: `ref` is a regular prop for function components — no forwardRef needed.
function Composer({ ref, onSend }) {
  const inputRef = useRef(null); // the real <input>, private to Composer
  const [text, setText] = useState('');

  // The parent gets these two methods, never the raw <input> DOM node.
  useImperativeHandle(ref, () => ({
    focus() {
      inputRef.current.focus();
    },
    insert(snippet) {
      setText((t) => (t ? `${t} ${snippet}` : snippet));
      inputRef.current.focus();
    },
  }), []); // only refs and setters inside → the handle never needs rebuilding

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  }

  return (
    <form className="row" onSubmit={handleSubmit}>
      <input ref={inputRef} aria-label="Message" value={text}
        onChange={(e) => setText(e.target.value)} />
      <button className="primary">Send</button>
    </form>
  );
}

// A ref callback: React calls it with the node on mount and runs the function it
// returns on unmount (React 19). Defined outside App, so re-renders don't re-run it.
function trackHistory(node) {
  console.log('history mounted with', node.children.length, 'message(s)');
  return () => console.log('history unmounted');
}

const QUICK_REPLIES = ['On my way', 'Sounds good', 'Talk later'];

export default function App() {
  const composer = useRef(null); // null until Composer mounts, then { focus, insert }
  const [messages, setMessages] = useState([{ id: 1, text: 'Lunch at noon?' }]);
  const [showHistory, setShowHistory] = useState(true);

  function send(text) {
    setMessages((all) => [...all, { id: all.length + 1, text }]);
  }

  return (
    <section className="card stack">
      <div className="row">
        <strong>Chat with Sam</strong>
        <button onClick={() => setShowHistory((s) => !s)}>
          {showHistory ? 'Hide' : 'Show'} history
        </button>
      </div>
      {showHistory && (
        <ul className="list" ref={trackHistory}>
          {messages.map((m) => <li key={m.id}>{m.text}</li>)}
        </ul>
      )}
      <div className="row">
        {QUICK_REPLIES.map((reply) => (
          <button key={reply} onClick={() => composer.current.insert(reply)}>{reply}</button>
        ))}
        <button onClick={() => composer.current.focus()}>Focus input</button>
      </div>
      <Composer ref={composer} onSend={send} />
    </section>
  );
}
