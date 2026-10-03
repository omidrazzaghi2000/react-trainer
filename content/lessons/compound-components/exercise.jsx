// Exercise: let <Tabs> share the selected tab with its parts through context.
import { createContext, useContext, useId, useState } from 'react';

const TabsContext = createContext(null);

// A stand-in so the starter renders before the context is wired up. Delete it when done.
const NOT_CONNECTED = { selected: null, select: () => {}, baseId: 'tabs' };

export function Tabs({ defaultValue, value, onValueChange, children }) {
  const baseId = useId();
  // TODO 1: remember the selected tab in state, starting at `defaultValue`.
  // TODO 2: controlled mode. When the parent passes `value`, it wins over the state.
  //         select(next) updates the state only when uncontrolled, and always
  //         reports the choice with onValueChange?.(next).
  function select(next) {}

  // TODO 3: share { selected, select, baseId } with every part:
  //         <TabsContext value={…}> … </TabsContext>
  return <div className="stack">{children}</div>;
}

function List({ label, children }) {
  return (
    <div role="tablist" aria-label={label} className="row">
      {children}
    </div>
  );
}

function Tab({ value, children }) {
  // TODO 4: read { selected, select, baseId } from TabsContext with useContext.
  const { selected, select, baseId } = NOT_CONNECTED;
  const isSelected = selected === value;
  return (
    <button role="tab" id={`${baseId}-tab-${value}`} aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isSelected} tabIndex={isSelected ? 0 : -1} onClick={() => select(value)}>
      {children}
    </button>
  );
}

function Panel({ value, children }) {
  // TODO 5: read { selected, baseId } from TabsContext too.
  const { selected, baseId } = NOT_CONNECTED;
  if (selected !== value) return null;
  return (
    <div role="tabpanel" id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}>
      {children}
    </div>
  );
}

Tabs.List = List;
Tabs.Tab = Tab;
Tabs.Panel = Panel;

export default function App() {
  return (
    <section className="card stack" aria-label="Pancakes">
      <h2>Fluffy pancakes</h2>
      <Tabs defaultValue="ingredients">
        <Tabs.List label="Recipe">
          <Tabs.Tab value="ingredients">Ingredients</Tabs.Tab>
          <Tabs.Tab value="steps">Steps</Tabs.Tab>
          <Tabs.Tab value="tips">Tips</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="ingredients">2 eggs, 200 g flour, 300 ml milk.</Tabs.Panel>
        <Tabs.Panel value="steps">Whisk, rest 10 minutes, fry both sides.</Tabs.Panel>
        <Tabs.Panel value="tips">The first pancake is always for the cook.</Tabs.Panel>
      </Tabs>
    </section>
  );
}
