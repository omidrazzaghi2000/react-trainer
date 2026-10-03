// Composition: a sprint board built from children, slot props and a render prop.
import { useState } from 'react';

// A layout component owns the frame; whoever renders it owns the content.
function Panel({ title, actions, footer, children }) {
  return (
    <section className="card stack" aria-label={title}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h3>{title}</h3>
        {actions}
      </div>
      {children}
      {footer && <p className="muted">{footer}</p>}
    </section>
  );
}

// A render prop: List decides WHERE each item goes, the caller decides HOW it looks.
function List({ items, renderItem, empty = 'Nothing here yet.' }) {
  if (items.length === 0) return <p className="muted">{empty}</p>;
  return (
    <ul className="list">
      {items.map((item) => <li key={item.id}>{renderItem(item)}</li>)}
    </ul>
  );
}

// Board never reads `user` — it only places the slots it receives.
function Board({ toolbar, children }) {
  return (
    <div className="stack">
      {toolbar}
      <div className="grid">{children}</div>
    </div>
  );
}

function UserBadge({ user }) {
  return <span className="badge">Signed in as {user.name}</span>;
}

const START = [
  { id: 1, title: 'Design the login page', done: true },
  { id: 2, title: 'Write API tests', done: false },
  { id: 3, title: 'Ship dark mode', done: false },
];

export default function App() {
  const [user] = useState({ name: 'Sara' });
  const [tasks, setTasks] = useState(START);
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  function toggle(id) {
    setTasks((list) => list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }
  const clearDone = () => setTasks((list) => list.filter((t) => !t.done));

  // One row design, reused by both lists through renderItem.
  const renderTask = (task) => (
    <label className={task.done ? 'row done' : 'row'}>
      <input type="checkbox" checked={task.done} onChange={() => toggle(task.id)} />
      {task.title}
    </label>
  );

  // UserBadge is created here, where `user` lives: no prop drilling through Board.
  return (
    <Board toolbar={<UserBadge user={user} />}>
      <Panel title="To do" footer={`${open.length} open`}>
        <List items={open} renderItem={renderTask} empty="All done!" />
      </Panel>
      <Panel title="Done" actions={<button onClick={clearDone}>Clear</button>}>
        <List items={done} renderItem={renderTask} />
      </Panel>
    </Board>
  );
}
