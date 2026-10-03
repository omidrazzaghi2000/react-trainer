// Immutable updates: a shop cart that replaces objects and arrays instead of mutating them.
import { useState } from 'react';

const CITIES = ['Tehran', 'Shiraz', 'Tabriz'];
let nextId = 3; // ids are created when items are created, never during render

export default function App() {
  const [customer, setCustomer] = useState({
    name: 'Sara',
    address: { street: 'Valiasr St.', city: 'Tehran' },
  });
  const [items, setItems] = useState([
    { id: 1, name: 'Espresso beans', price: 12, qty: 1 },
    { id: 2, name: 'Milk frother', price: 25, qty: 1 },
  ]);

  function shipTo(city) {
    // Copy every level on the path to the change: customer → address → city.
    setCustomer({ ...customer, address: { ...customer.address, city } });
  }

  function addFilters() {
    // Add: a new array with the old items spread in, plus one new object.
    setItems([...items, { id: nextId++, name: 'Paper filters', price: 4, qty: 1 }]);
  }

  function addOne(id) {
    // Update: map() builds a new array; only the changed item becomes a new object.
    setItems(items.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item)));
  }

  function remove(id) {
    // Remove: filter() returns a new array without that item.
    setItems(items.filter((item) => item.id !== id));
  }

  function mutateFirst() {
    // BUG on purpose: same array, same object, so Object.is(old, new) is true
    // and React skips the render. The change sneaks in on the next real update.
    items[0].qty += 1;
    setItems(items);
    console.log('qty is now', items[0].qty, 'but the screen did not change');
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <section className="card stack">
      <h2>Cart for {customer.name}</h2>
      <div className="row" role="group" aria-label="Ship to">
        {CITIES.map((city) => (
          <button
            key={city}
            aria-pressed={customer.address.city === city}
            onClick={() => shipTo(city)}
          >
            {city}
          </button>
        ))}
      </div>
      <ul className="list">
        {items.map((item) => (
          <li key={item.id} className="row">
            <span>{item.name} × {item.qty}</span>
            <button aria-label={`One more ${item.name}`} onClick={() => addOne(item.id)}>
              +
            </button>
            <button aria-label={`Remove ${item.name}`} onClick={() => remove(item.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="row">
        <button onClick={addFilters}>Add filters</button>
        <button className="danger" onClick={mutateFirst} disabled={items.length === 0}>
          Mutate first item (broken)
        </button>
      </div>
      <p className="muted">
        Ship to {customer.address.street}, {customer.address.city} · Total: ${total}
      </p>
    </section>
  );
}
