// Exercise: let <Tabs> share the selected tab with its parts through context.
import { createContext, useContext, useId, useState } from 'react';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, children }) {
  const baseId = useId();
  const [innerValue, setInnerValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const selected = isControlled ? value : innerValue;

  function select(next) {
    if (!isControlled) setInnerValue(next);
    onValueChange?.(next);
  }

  return (
    <TabsContext value={{ selected, select, baseId }}>
      <div className="stack">{children}</div>
    </TabsContext>
  );
}

function List({ label, children }) {
  return (
    <div role="tablist" aria-label={label} className="row">
      {children}
    </div>
  );
}

function Tab({ value, children }) {
  const { selected, select, baseId } = useContext(TabsContext);
  const isSelected = selected === value;
  return (
    <button role="tab" id={`${baseId}-tab-${value}`} aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isSelected} tabIndex={isSelected ? 0 : -1} onClick={() => select(value)}>
      {children}
    </button>
  );
}

function Panel({ value, children }) {
  const { selected, baseId } = useContext(TabsContext);
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
