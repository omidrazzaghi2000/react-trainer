// useReducer: a coffee-shop cart whose update logic lives in one pure reducer function.
import { useReducer } from 'react';

const MENU = [
  { id: 'latte', name: 'Latte', price: 3.5 },
  { id: 'mocha', name: 'Mocha', price: 4 },
  { id: 'tea', name: 'Green tea', price: 2.5 },
];
const itemOf = (id) => MENU.find((item) => item.id === id);

// Pure: the same (state, action) always gives the same new state. No mutation, no I/O.
export function cartReducer(cart, action) {
  switch (action.type) {
    case 'added': {
      const exists = cart.some((line) => line.id === action.id);
      if (!exists) return [...cart, { id: action.id, qty: 1 }];
      return cart.map((line) =>
        line.id === action.id ? { ...line, qty: line.qty + 1 } : line,
      );
    }
    case 'decremented':
      return cart
        .map((line) => (line.id === action.id ? { ...line, qty: line.qty - 1 } : line))
        .filter((line) => line.qty > 0);
    case 'cleared':
      return [];
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

// Init function: turns the initial argument into the first state, only on mount.
function createInitialCart(savedIds) {
  return savedIds.map((id) => ({ id, qty: 1 }));
}

export default function App() {
  const [cart, dispatch] = useReducer(cartReducer, ['latte'], createInitialCart);

  // Components describe *what happened*; the reducer decides how the state changes.
  function send(action) {
    console.log('dispatch', action);
    dispatch(action);
  }

  const total = cart.reduce((sum, line) => sum + line.qty * itemOf(line.id).price, 0);

  return (
    <div className="stack">
      <div className="row">
        {MENU.map((item) => (
          <button key={item.id} onClick={() => send({ type: 'added', id: item.id })}>
            + {item.name}
          </button>
        ))}
      </div>
      <section className="card stack" aria-label="Cart">
        <ul className="list">
          {cart.map((line) => (
            <li key={line.id} className="row">
              <span>{line.qty} × {itemOf(line.id).name}</span>
              <button
                aria-label={`Remove one ${itemOf(line.id).name}`}
                onClick={() => send({ type: 'decremented', id: line.id })}
              >
                −
              </button>
            </li>
          ))}
        </ul>
        <p>Total: ${total.toFixed(2)}</p>
        <button
          className="danger"
          disabled={cart.length === 0}
          onClick={() => send({ type: 'cleared' })}
        >
          Clear cart
        </button>
      </section>
    </div>
  );
}
