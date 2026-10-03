// Components & props: a coffee shop menu composed from small reusable pieces.

// React passes ONE props object. In development it is frozen, so it's read-only.
function Price(props) {
  console.log('Price props:', props, '| frozen:', Object.isFrozen(props));
  const { amount, currency = '$' } = props; // the default fills in a missing prop
  return (
    <strong>
      {currency}
      {amount.toFixed(2)}
    </strong>
  );
}

// `children` is whatever you nest between <Card> and </Card>.
function Card({ title, children }) {
  return (
    <section className="card stack" aria-label={title}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

// Destructure the props you need; optional ones get defaults.
function MenuItem({ name, price, tag = 'Classic', note = 'Hot or iced' }) {
  // Composition: MenuItem is built from Card and Price.
  return (
    <Card title={name}>
      <div className="row">
        <Price amount={price} />
        <span className="badge">{tag}</span>
      </div>
      <p className="muted" style={{ margin: 0 }}>{note}</p>
    </Card>
  );
}

// An object whose fields match the props can be spread onto a component.
const special = { name: 'Saffron latte', price: 5.25, tag: 'Seasonal', note: 'Oat milk' };

export default function App() {
  // Data flows one way: App owns it, children only display what they receive.
  // Capitalized tags are components; <menuItem> would be an unknown HTML tag.
  return (
    <main className="stack">
      <h2 style={{ margin: 0 }}>Bean There · Menu</h2>
      <div className="grid">
        <MenuItem name="Espresso" price={2.5} />
        <MenuItem name="Flat white" price={3.8} tag="Popular" note="Double shot" />
        <MenuItem {...special} />
      </div>
      <Card title="Opening hours">
        <p style={{ margin: 0 }}>Every day, 8:00 to 18:00</p>
      </Card>
    </main>
  );
}
