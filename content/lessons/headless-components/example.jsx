// Headless hooks: one accordion hook, two looks — the hook owns logic and a11y, not markup.
import { useId, useReducer } from 'react';

// Default behaviour, exported so users can build on it.
export function accordionReducer(state, action) {
  if (action.type !== 'toggle') return state;
  const { openIndexes } = state;
  return openIndexes.includes(action.index)
    ? { openIndexes: openIndexes.filter((i) => i !== action.index) }
    : { openIndexes: [...openIndexes, action.index] };
}

// Calls every handler that was given, in order.
const callAll = (...fns) => (...args) => fns.forEach((fn) => fn?.(...args));

export function useAccordion({ initialOpen = [], reducer = accordionReducer } = {}) {
  const [state, dispatch] = useReducer(reducer, { openIndexes: initialOpen });
  const baseId = useId();
  const isOpen = (index) => state.openIndexes.includes(index);

  // Prop getters: everything a toggle / panel needs, merged with the caller's props.
  const getToggleProps = ({ index, onClick, ...props }) => ({
    type: 'button',
    id: `${baseId}-toggle-${index}`,
    'aria-expanded': isOpen(index),
    'aria-controls': `${baseId}-panel-${index}`,
    ...props,
    onClick: callAll(onClick, () => dispatch({ type: 'toggle', index })),
  });
  const getPanelProps = ({ index, ...props }) => ({
    id: `${baseId}-panel-${index}`,
    role: 'region',
    'aria-labelledby': `${baseId}-toggle-${index}`,
    hidden: !isOpen(index),
    ...props,
  });
  return { openIndexes: state.openIndexes, isOpen, getToggleProps, getPanelProps };
}

const FAQ = [
  ['Do you have oat milk?', 'Yes — oat, soy and almond.'],
  ['Can I work here all day?', 'Of course. Wi-Fi is free.'],
];

function Faq() {
  const { getToggleProps, getPanelProps } = useAccordion();
  return (
    <div className="card stack">
      {FAQ.map(([question, answer], index) => (
        <div key={question}>
          <button {...getToggleProps({ index })}>{question}</button>
          <p {...getPanelProps({ index })}>{answer}</p>
        </div>
      ))}
    </div>
  );
}

// Same hook, new rule: a state reducer keeps exactly one step open.
function oneStepAtATime(state, action) {
  const changes = accordionReducer(state, action);
  const last = changes.openIndexes.slice(-1);
  return last.length ? { openIndexes: last } : state; // never close the only open step
}

function Checkout() {
  const { isOpen, getToggleProps, getPanelProps } = useAccordion({
    initialOpen: [0],
    reducer: oneStepAtATime,
  });
  return (
    <ol className="card stack">
      {['Cart', 'Delivery', 'Payment'].map((step, index) => (
        <li key={step}>
          <button
            className={isOpen(index) ? 'primary' : undefined}
            {...getToggleProps({ index, onClick: () => console.log('analytics:', step) })}
          >
            {step}
          </button>
          <p className="muted" {...getPanelProps({ index })}>{step} details go here.</p>
        </li>
      ))}
    </ol>
  );
}

export default function App() {
  return <div className="stack"><Faq /><Checkout /></div>;
}
