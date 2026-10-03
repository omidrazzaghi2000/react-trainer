// Exercise: share one cart store between distant components with useSyncExternalStore.
import { useSyncExternalStore } from 'react';

export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(partial) {
    state = { ...state, ...partial };
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { getState, setState, subscribe };
}

export const cartStore = createStore({ count: 0, total: 0 });

function addToCart(product) {
  const { count, total } = cartStore.getState();
  cartStore.setState({ count: count + 1, total: total + product.price });
}

function useCart(selector) {
  return useSyncExternalStore(cartStore.subscribe, () => selector(cartStore.getState()));
}

function subscribeToNetwork(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function useOnlineStatus() {
  return useSyncExternalStore(subscribeToNetwork, () => navigator.onLine);
}

const PRODUCTS = [
  { id: 'beans', name: 'Espresso beans', price: 12 },
  { id: 'milk', name: 'Oat milk', price: 3 },
];

function Header() {
  const count = useCart((s) => s.count);
  return (
    <header className="row">
      <strong>Bean There</strong>
      <span className="badge">Cart: {count} {count === 1 ? 'item' : 'items'}</span>
    </header>
  );
}

function ProductList() {
  return (
    <ul className="list">
      {PRODUCTS.map((p) => (
        <li key={p.id} className="row">
          {p.name} — ${p.price}
          <button onClick={() => addToCart(p)} aria-label={`Add ${p.name}`}>Add</button>
        </li>
      ))}
    </ul>
  );
}

function Checkout() {
  const total = useCart((s) => s.total);
  return <p><strong>Total: ${total}</strong></p>;
}

export default function App() {
  const online = useOnlineStatus();
  return (
    <div className="card stack">
      <Header />
      {!online && <p role="alert" className="warning">Offline: the cart will sync later.</p>}
      <ProductList />
      <Checkout />
    </div>
  );
}
