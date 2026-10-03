// Exercise: fix the task board. Every handler mutates state, so the screen never updates.
import { useState } from 'react';

// A function, so every mount starts from brand-new objects.
function createTasks() {
  return [
    { id: 1, text: 'Buy coffee beans', done: true },
    { id: 2, text: 'Fix the login bug', done: false },
    { id: 3, text: 'Call the bank', done: false },
  ];
}

let nextId = 4;

function NewTaskForm({ onAdd }) {
  const [text, setText] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  }

  return (
    <form className="row" onSubmit={handleSubmit}>
      <input aria-label="New task" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="submit">Add</button>
    </form>
  );
}

export default function App() {
  const [tasks, setTasks] = useState(createTasks);
  const [board, setBoard] = useState({ name: 'Sprint 12', settings: { hideDone: false } });

  function addTask(text) {
    setTasks([...tasks, { id: nextId++, text, done: false }]);
  }

  function toggleTask(id) {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  function removeTask(id) {
    setTasks(tasks.filter((task) => task.id !== id));
  }

  function toggleHideDone() {
    setBoard({
      ...board,
      settings: { ...board.settings, hideDone: !board.settings.hideDone },
    });
  }

  const doneCount = tasks.filter((t) => t.done).length;
  const visible = board.settings.hideDone ? tasks.filter((t) => !t.done) : tasks;

  return (
    <section className="card stack">
      <h2>{board.name}</h2>
      <NewTaskForm onAdd={addTask} />
      <label className="row">
        <input type="checkbox" checked={board.settings.hideDone} onChange={toggleHideDone} />
        Hide done tasks
      </label>
      <ul className="list">
        {visible.map((task) => (
          <li key={task.id} className="row">
            <label className={task.done ? 'row done' : 'row'}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
              />
              {task.text}
            </label>
            <button aria-label={`Delete ${task.text}`} onClick={() => removeTask(task.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <p className="muted">{doneCount} of {tasks.length} done</p>
    </section>
  );
}
