// Exercise: make the team page reusable — read props, use a default and render children.

// Finished for you: turns "Sara Rahimi" into "SR".
function Avatar({ name }) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('');
  return (
    <span className="badge" title={name}>
      {initials}
    </span>
  );
}

function MemberCard({ name, role = 'Guest' }) {
  return (
    <article className="card row" aria-label={name}>
      <Avatar name={name} />
      <div>
        <h3 style={{ margin: 0 }}>{name}</h3>
        <p className="muted" style={{ margin: 0 }}>{role}</p>
      </div>
    </article>
  );
}

function TeamPanel({ title, children }) {
  return (
    <section className="stack" aria-label={title}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {children}
    </section>
  );
}

export default function App() {
  return (
    <div className="stack">
      <TeamPanel title="Design team">
        <MemberCard name="Sara Rahimi" role="Product designer" />
        <MemberCard name="Kian Moradi" />
      </TeamPanel>
      <TeamPanel title="Engineering">
        <MemberCard name="Neda Karimi" role="Frontend engineer" />
      </TeamPanel>
    </div>
  );
}
