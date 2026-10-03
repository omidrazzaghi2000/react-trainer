// Exercise: keep every task-list update in one pure reducer and dispatch actions to it.
import { useReducer, useState } from 'react';

// Builds the first state once: useReducer(reducer, initialTexts, createInitialState)
export function createInitialState(texts) {
  return {
    nextId: texts.length + 1,
    tasks: texts.map((text, i) => ({ id: i + 1, text, done: false })),
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'added':
      return {
        ...state,
        nextId: state.nextId + 1,
        tasks: [...state.tasks, { id: state.nextId, text: action.text, done: false }],
      };
    case 'toggled':
      // TODO 1: return a NEW state where the task with id === action.id has `done` flipped.
      //         Hint: tasks.map(...) and { ...task, done: !task.done }
      return state;
    case 'deleted':
      // TODO 2: return a new state without the task whose id === action.id (filter).
      return state;
    case 'cleared_done':
      // TODO 3: return a new state that keeps only the tasks that are not done.
      return state;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

export default function App() {
  const [state, dispatch] = useReducer(
    reducer,
    ['Buy coffee beans', 'Write the reducer'],
    createInitialState,
  );
  const [text, setText] = useState('');
  const left = state.tasks.filter((task) => !task.done).length;

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch({ type: 'added', text: text.trim() });
    setText('');
  }

  return (
    <section className="card stack" aria-label="Tasks">
      <form className="row" onSubmit={handleSubmit}>
        <input aria-label="New task" value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="primary">Add</button>
      </form>
      <ul className="list">
        {state.tasks.map((task) => (
          <li key={task.id} className="row">
            <label className={task.done ? 'done' : undefined}>
              <input
                type="checkbox"
                checked={task.done}
                // TODO 4: dispatch a 'toggled' action with this task's id.
                onChange={() => {}}
              />{' '}
              {task.text}
            </label>
            <button
              aria-label={`Delete ${task.text}`}
              onClick={() => dispatch({ type: 'deleted', id: task.id })}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="row">
        <span className="muted">{left} left</span>
        <button onClick={() => dispatch({ type: 'cleared_done' })}>Clear completed</button>
      </div>
    </section>
  );
}
