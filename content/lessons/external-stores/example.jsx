// useSyncExternalStore: a tiny global cart store plus the browser's online status.
import { useSyncExternalStore } from 'react';

// A Zustand-style store: plain JavaScript that lives outside React.
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState: () => state,
    setState(update) {
      state = { ...state, ...update(state) }; // a NEW object, never a mutation
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener); // React calls this on unmount
    },
  };
}

const cart = createStore({ items: 0, coupon: 'none' });

// Select one slice: a primitive snapshot only changes when that slice changes.
function useCart(selector) {
  return useSyncExternalStore(cart.subscribe, () => selector(cart.getState()));
}

// The browser is an external store too. Subscribe to its events, guard the API.
function subscribeToNetwork(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}
const readOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

function useOnlineStatus() {
  // Third argument: the snapshot to use during server rendering.
  return useSyncExternalStore(subscribeToNetwork, readOnline, () => true);
}

function CartBadge() {
  const items = useCart((s) => s.items);
  console.log('render CartBadge');
  return <span className="badge">Cart: {items}</span>;
}

function CouponLabel() {
  const coupon = useCart((s) => s.coupon);
  console.log('render CouponLabel'); // silent when only `items` changes
  return <span className="muted">Coupon: {coupon}</span>;
}

function ProductCard({ name }) {
  // Writing needs no subscription, so the cards never re-render on cart changes.
  const add = () => cart.setState((s) => ({ items: s.items + 1 }));
  return (
    <div className="card row">
      <strong>{name}</strong>
      <button onClick={add}>Add</button>
    </div>
  );
}

export default function App() {
  const online = useOnlineStatus();
  return (
    <section className="stack">
      <div className="row">
        <CartBadge />
        <CouponLabel />
        <span className={online ? 'success' : 'warning'}>{online ? 'Online' : 'Offline'}</span>
      </div>
      <ProductCard name="Espresso beans" />
      <ProductCard name="Oat milk" />
      <button onClick={() => cart.setState(() => ({ coupon: 'SAVE10' }))}>
        Apply coupon SAVE10
      </button>
    </section>
  );
}
