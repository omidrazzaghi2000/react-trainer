// Exercise: a recipe box that reads data with use() + Suspense and units with use(Context).
import { use, useState, Suspense, createContext } from 'react';

const UnitsContext = createContext('metric');

// items: ingredient → grams (null = "to taste")
const RECIPES = {
  pancakes: { name: 'Pancakes', minutes: 20, items: { Flour: 200, Milk: 300, Salt: null } },
  omelette: { name: 'Omelette', minutes: 10, items: { Eggs: 150, Butter: 15, Pepper: null } },
  shakshuka: { name: 'Shakshuka', minutes: 30, items: { Tomatoes: 400, Cumin: null } },
  tahdig: { name: 'Tahdig', minutes: 60, items: { Rice: 500, Oil: 40, Saffron: null } },
};

// Fake API: answers after 200 ms (it never touches the network).
function fetchRecipe(id) {
  return new Promise((resolve) => setTimeout(() => resolve(RECIPES[id]), 200));
}

// TODO 1: cache the promises. Keep one promise per id in `cache`, so every render of
//         the same recipe receives the SAME promise (a new promise = suspend again).
const cache = new Map();
function getRecipe(id) {
  return fetchRecipe(id);
}

function Amount({ grams }) {
  if (grams === null) return <span>to taste</span>;
  // TODO 4: read the units from UnitsContext with use(UnitsContext).
  //         (use may run after the early return above; useContext may not.)
  const units = 'metric';
  const text = units === 'imperial' ? `${(grams / 28.35).toFixed(1)} oz` : `${grams} g`;
  return <span>{text}</span>;
}

function RecipeDetails({ id }) {
  // TODO 2: read the recipe with use(getRecipe(id)) instead of this placeholder.
  const recipe = { name: 'Recipe', minutes: 0, items: {} };
  return (
    <article className="stack">
      <h3>{recipe.name}</h3>
      <p className="muted">{recipe.minutes} min</p>
      <ul className="list">
        {Object.entries(recipe.items).map(([item, grams]) => (
          <li key={item}>
            {item}: <Amount grams={grams} />
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function App() {
  const [id, setId] = useState(null);
  const [imperial, setImperial] = useState(false);

  return (
    <UnitsContext value={imperial ? 'imperial' : 'metric'}>
      <section className="card stack">
        <div className="row" role="group" aria-label="Recipes">
          {Object.keys(RECIPES).map((key) => (
            <button key={key} aria-pressed={id === key} onClick={() => setId(key)}>
              {RECIPES[key].name}
            </button>
          ))}
        </div>
        <label>
          <input
            type="checkbox"
            checked={imperial}
            onChange={(e) => setImperial(e.target.checked)}
          />
          {' '}Imperial units
        </label>
        {id === null ? (
          <p className="muted">Pick a recipe.</p>
        ) : (
          // TODO 3: wrap RecipeDetails in <Suspense fallback={<p>Loading recipe…</p>}>.
          <RecipeDetails id={id} />
        )}
      </section>
    </UnitsContext>
  );
}
