// Compound components: <Tabs> shares its selected tab with its parts through context.
import { createContext, useContext, useId, useState } from 'react';

const TabsContext = createContext(null);
function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('<Tabs.*> parts must be rendered inside <Tabs>');
  return ctx;
}

function Tabs({ defaultValue, value, onValueChange, children }) {
  const [innerValue, setInnerValue] = useState(defaultValue);
  const baseId = useId();
  const isControlled = value !== undefined; // controlled: the parent owns the value
  const selected = isControlled ? value : innerValue;
  function select(next) {
    if (!isControlled) setInnerValue(next);
    onValueChange?.(next);
  }
  return <TabsContext value={{ selected, select, baseId }}>{children}</TabsContext>;
}

function List({ label, children }) {
  // Arrow keys move between tabs, as the WAI-ARIA tabs pattern expects.
  function handleKeyDown(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = [...e.currentTarget.querySelectorAll('[role="tab"]')];
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(tabs.indexOf(e.target) + step + tabs.length) % tabs.length];
    next.focus();
    next.click();
  }
  return (
    <div role="tablist" aria-label={label} className="row" onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
}

function Tab({ value, children }) {
  const { selected, select, baseId } = useTabs();
  const isSelected = selected === value;
  return (
    <button role="tab" id={`${baseId}-tab-${value}`} aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isSelected} tabIndex={isSelected ? 0 : -1} onClick={() => select(value)}>
      {children}
    </button>
  );
}

function Panel({ value, children }) {
  const { selected, baseId } = useTabs();
  if (selected !== value) return null;
  return (
    <div role="tabpanel" id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}>
      {children}
    </div>
  );
}

// Dot notation keeps the family together: <Tabs.List>, <Tabs.Tab>, <Tabs.Panel>.
Object.assign(Tabs, { List, Tab, Panel });

export default function App() {
  const [plan, setPlan] = useState('monthly');
  return (
    <div className="stack">
      {/* Uncontrolled: Tabs keeps its own state, starting at defaultValue. */}
      <Tabs defaultValue="profile">
        <Tabs.List label="Account">
          <Tabs.Tab value="profile">Profile</Tabs.Tab>
          <Tabs.Tab value="security">Security</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="profile">Name, avatar and bio.</Tabs.Panel>
        <Tabs.Panel value="security">Password and two-step login.</Tabs.Panel>
      </Tabs>
      {/* Controlled: the parent owns `plan`, and any markup can sit in between. */}
      <Tabs value={plan} onValueChange={setPlan}>
        <p className="muted">Billing: {plan}</p>
        <Tabs.List label="Billing period">
          <Tabs.Tab value="monthly">Monthly</Tabs.Tab>
          <Tabs.Tab value="yearly">Yearly</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="monthly">$12 per month, cancel any time.</Tabs.Panel>
        <Tabs.Panel value="yearly">$115 per year — two months free.</Tabs.Panel>
      </Tabs>
    </div>
  );
}
