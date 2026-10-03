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

const cache = new Map();
function getRecipe(id) {
  if (!cache.has(id)) cache.set(id, fetchRecipe(id));
  return cache.get(id);
}

function Amount({ grams }) {
  if (grams === null) return <span>to taste</span>;
  const units = use(UnitsContext);
  const text = units === 'imperial' ? `${(grams / 28.35).toFixed(1)} oz` : `${grams} g`;
  return <span>{text}</span>;
}

function RecipeDetails({ id }) {
  const recipe = use(getRecipe(id));
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
          <Suspense fallback={<p>Loading recipe…</p>}>
            <RecipeDetails id={id} />
          </Suspense>
        )}
      </section>
    </UnitsContext>
  );
}
