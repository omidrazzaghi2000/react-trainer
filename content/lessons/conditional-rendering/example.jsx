// Conditional rendering: a shopping cart that shows different UI for different situations.
import { useState } from 'react';

const CART = [
  { id: 1, name: 'Espresso beans', price: 18, onSale: true },
  { id: 2, name: 'Paper filters', price: 4.5, onSale: false },
  { id: 3, name: 'Milk frother', price: 25, onSale: false },
];
const FREE_SHIPPING_AT = 30;

// Returning null means "render nothing", so the parent needs no condition of its own.
function PromoBanner({ code }) {
  if (!code) return null;
  return <p className="success">Code {code} applied: 10% off</p>;
}

function GiftNote() {
  const [text, setText] = useState(''); // lives only while GiftNote is mounted
  return (
    <input
      aria-label="Gift note"
      placeholder="Type a gift note…"
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  );
}

export default function App() {
  const [items, setItems] = useState(CART);
  const [noteHidden, setNoteHidden] = useState(false);
  const [noteMounted, setNoteMounted] = useState(true);

  // Early return: handle the special case first and keep the main JSX flat.
  if (items.length === 0) {
    return (
      <section className="card stack">
        <p className="muted">Your cart is empty.</p>
        <button onClick={() => setItems(CART)}>Restore cart</button>
      </section>
    );
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const saleCount = items.filter((item) => item.onSale).length;
  const freeShipping = total >= FREE_SHIPPING_AT;

  return (
    <section className="card stack">
      <h2 style={{ margin: 0 }}>
        Cart: {items.length} {items.length === 1 ? 'item' : 'items'}, ${total.toFixed(2)}
      </h2>
      {/* Ternary: pick one of two outputs. The class is conditional too. */}
      <p className={freeShipping ? 'success' : 'warning'}>
        {freeShipping
          ? 'Free shipping unlocked'
          : `Add $${(FREE_SHIPPING_AT - total).toFixed(2)} for free shipping`}
      </p>
      {/* && needs a real boolean: {saleCount && …} would print a stray 0. */}
      {saleCount > 0 && <span className="badge">{saleCount} on sale</span>}
      <PromoBanner code={total >= 40 ? 'BIGCART' : null} />
      <button onClick={() => setItems(items.slice(1))}>Remove first item</button>

      <div className="row">
        <button aria-pressed={noteHidden} onClick={() => setNoteHidden(!noteHidden)}>
          Hide note
        </button>
        <button aria-pressed={!noteMounted} onClick={() => setNoteMounted(!noteMounted)}>
          Remove note
        </button>
      </div>
      {/* hidden keeps GiftNote mounted (its text survives); && unmounts it (text lost). */}
      {noteMounted && (
        <div hidden={noteHidden}>
          <GiftNote />
        </div>
      )}
    </section>
  );
}
