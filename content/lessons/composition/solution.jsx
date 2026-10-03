// Exercise: compose a coffee shop from slot props, children and a render prop.
import { useState } from 'react';

export function Card({ header, footer, children }) {
  return (
    <section className="card stack">
      {header}
      {children}
      {footer && <footer>{footer}</footer>}
    </section>
  );
}

export function List({ items, renderItem, empty = 'Nothing to show.' }) {
  if (items.length === 0) return <p className="muted">{empty}</p>;

  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.id}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

const BEANS = [
  { id: 'eth', name: 'Ethiopia Guji', price: 14 },
  { id: 'col', name: 'Colombia Huila', price: 12 },
  { id: 'ken', name: 'Kenya AA', price: 16 },
];

export default function App() {
  const [cart, setCart] = useState([]);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function add(bean) {
    setCart((items) =>
      items.some((i) => i.id === bean.id)
        ? items.map((i) => (i.id === bean.id ? { ...i, qty: i.qty + 1 } : i))
        : [...items, { ...bean, qty: 1 }]
    );
  }

  return (
    <div className="stack">
      <Card header={<h2>Coffee beans</h2>}>
        <List
          items={BEANS}
          renderItem={(bean) => (
            <div className="row">
              <span>{bean.name} — ${bean.price}</span>
              <button onClick={() => add(bean)}>Add {bean.name}</button>
            </div>
          )}
        />
      </Card>
      <Card header={<h2>Your cart</h2>} footer={<strong>Total: ${total}</strong>}>
        <List
          items={cart}
          empty="Your cart is empty."
          renderItem={(item) => `${item.qty} × ${item.name}`}
        />
      </Card>
    </div>
  );
}
