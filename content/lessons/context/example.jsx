// Context: a theme and a cart shared deep in the tree, with no props through middle layers.
import { createContext, useContext, useReducer, useState } from 'react';

// The argument is the default value, used when no provider is above the reader.
const ThemeContext = createContext('light');
// The cart is split in two: its contents change often, dispatch never changes.
const CartContext = createContext([]);
const CartDispatchContext = createContext(null);

const DARK = { background: '#1f2937', color: '#f9fafb' };

function cartReducer(cart, action) {
  if (action.type === 'added') return [...cart, action.name];
  if (action.type === 'cleared') return [];
  throw new Error(`Unknown action: ${action.type}`);
}

// Context + reducer: one component owns the state and provides both halves.
function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, []);
  return (
    <CartContext value={cart}>
      <CartDispatchContext value={dispatch}>{children}</CartDispatchContext>
    </CartContext>
  );
}

export default function App() {
  const [theme, setTheme] = useState('light');
  const next = theme === 'light' ? 'dark' : 'light';

  // React 19 renders the context itself as the provider (before: <ThemeContext.Provider>).
  return (
    <ThemeContext value={theme}>
      <CartProvider>
        <div className="stack">
          <button onClick={() => setTheme(next)}>Switch to {next} theme</button>
          <Menu />
          <CartSummary />
          {/* Override for one subtree: the nearest provider above a reader wins. */}
          <ThemeContext value="dark">
            <Panel title="Opening hours">Every day, 8:00 to 18:00</Panel>
          </ThemeContext>
        </div>
      </CartProvider>
    </ThemeContext>
  );
}

// A middle layer that knows nothing about themes or carts.
function Menu() {
  return (
    <div className="grid">
      <Drink name="Latte" />
      <Drink name="Mocha" />
    </div>
  );
}

function Panel({ title, children }) {
  const theme = useContext(ThemeContext);
  return (
    <section className="card stack" style={theme === 'dark' ? DARK : undefined}>
      <strong>{title}</strong>
      {children}
    </section>
  );
}

function Drink({ name }) {
  // Reads only dispatch, which never changes, so cart updates skip this component.
  const dispatch = useContext(CartDispatchContext);
  console.log(`render Drink: ${name}`);
  return (
    <Panel title={name}>
      <button onClick={() => dispatch({ type: 'added', name })}>Add to cart</button>
    </Panel>
  );
}

function CartSummary() {
  const cart = useContext(CartContext); // re-renders every time the cart changes
  const dispatch = useContext(CartDispatchContext);
  return (
    <Panel title={`Cart (${cart.length})`}>
      <span className="muted">{cart.join(', ') || 'Empty'}</span>
      <button onClick={() => dispatch({ type: 'cleared' })}>Clear</button>
    </Panel>
  );
}
