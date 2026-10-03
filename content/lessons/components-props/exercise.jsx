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

// TODO 1: read `name` and `role` from the props object (destructure them in the
//         parameter list) and give `role` the default value 'Guest'.
function MemberCard(props) {
  return (
    // TODO 2: use the props instead of the placeholders (aria-label, heading and
    //         role). Then compose: render <Avatar name={name} /> first in the row.
    <article className="card row" aria-label="Member">
      <div>
        <h3 style={{ margin: 0 }}>Name</h3>
        <p className="muted" style={{ margin: 0 }}>Role</p>
      </div>
    </article>
  );
}

// TODO 3: also accept `children` and render them below the heading.
function TeamPanel({ title }) {
  return (
    <section className="stack" aria-label={title}>
      <h2 style={{ margin: 0 }}>{title}</h2>
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
