// Exercise: share one cart store between distant components with useSyncExternalStore.
import { useSyncExternalStore } from 'react';

export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(partial) {
    // TODO 2: never mutate. Replace `state` with a NEW object ({ ...state, ...partial }),
    //         then call every listener so subscribed components re-read the snapshot.
    Object.assign(state, partial);
  }

  function subscribe(listener) {
    // TODO 1: remember the listener and return a function that removes it again.
    return () => {};
  }

  return { getState, setState, subscribe };
}

export const cartStore = createStore({ count: 0, total: 0 });

function addToCart(product) {
  const { count, total } = cartStore.getState();
  cartStore.setState({ count: count + 1, total: total + product.price });
}

// TODO 3: read the store with useSyncExternalStore(cartStore.subscribe, getSnapshot),
//         where getSnapshot returns selector(cartStore.getState()).
function useCart(selector) {
  return selector(cartStore.getState());
}

// TODO 4: make the network status live. subscribeToNetwork must listen to the window's
//         'online' and 'offline' events and return a cleanup that removes both.
//         useOnlineStatus then reads navigator.onLine with useSyncExternalStore.
function subscribeToNetwork(callback) {
  return () => {};
}

function useOnlineStatus() {
  return true;
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
