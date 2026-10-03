// Exercise: finish a headless single-choice hook and drive two different pickers with it.
import { useReducer } from 'react';

// Default behaviour: clicking an item selects it. Exported so custom reducers can reuse it.
export function choiceReducer(state, action) {
  if (action.type === 'select') return { selectedIndex: action.index };
  return state;
}

export function useChoice({ items, initialIndex = null, reducer = choiceReducer }) {
  const [state, dispatch] = useReducer(reducer, { selectedIndex: initialIndex });
  const { selectedIndex } = state;

  const getGroupProps = (props = {}) => ({ role: 'group', ...props });

  const getItemProps = ({ index, onClick, ...props }) => ({
    type: 'button',
    'aria-pressed': index === selectedIndex,
    ...props,
    onClick: (event) => {
      onClick?.(event);
      dispatch({ type: 'select', index });
    },
  });

  const selectedItem = items[selectedIndex] ?? null;
  return { selectedIndex, selectedItem, getGroupProps, getItemProps };
}

// ---- Two different UIs built on the same hook (you don't need to change them) ----

const SIZES = ['Small', 'Medium', 'Large'];

function SizePicker() {
  const { selectedItem, getGroupProps, getItemProps } = useChoice({
    items: SIZES,
    initialIndex: 1,
  });
  return (
    <section className="card stack">
      <div className="row" {...getGroupProps({ 'aria-label': 'Size' })}>
        {SIZES.map((size, index) => (
          <button
            key={size}
            {...getItemProps({ index, onClick: () => console.log(`analytics: size ${size}`) })}
          >
            {size}
          </button>
        ))}
      </div>
      <p>Size: {selectedItem}</p>
    </section>
  );
}

const MILKS = ['Whole', 'Oat', 'Soy'];

// A custom rule on top of the default one: clicking the chosen milk again clears it.
function clearableChoice(state, action) {
  if (action.type === 'select' && action.index === state.selectedIndex) {
    return { selectedIndex: null };
  }
  return choiceReducer(state, action);
}

function MilkPicker() {
  const { selectedItem, getGroupProps, getItemProps } = useChoice({
    items: MILKS,
    reducer: clearableChoice,
  });
  return (
    <section className="card stack">
      <div className="stack" {...getGroupProps({ 'aria-label': 'Milk' })}>
        {MILKS.map((milk, index) => (
          <button key={milk} {...getItemProps({ index })}>
            {milk}
            {selectedItem === milk && <span aria-hidden="true"> ✓</span>}
          </button>
        ))}
      </div>
      <p>Milk: {selectedItem ?? 'none'}</p>
    </section>
  );
}

export default function App() {
  return (
    <div className="stack">
      <SizePicker />
      <MilkPicker />
    </div>
  );
}
