// Exercise: share the current language through context instead of drilling props.
import { createContext, useContext, useState } from 'react';

const MESSAGES = {
  en: { greeting: 'Welcome back!', order: 'Order coffee', receipt: 'Thanks for your order' },
  fa: { greeting: 'خوش برگشتید!', order: 'سفارش قهوه', receipt: 'از سفارش شما سپاسگزاریم' },
};

// TODO 1: create and export the context, with 'en' as its default value:
//         export const LanguageContext = createContext('en');

export function Greeting() {
  // TODO 2: read the language with useContext(LanguageContext) instead of hard-coding it.
  const lang = 'en';
  return <h2>{MESSAGES[lang].greeting}</h2>;
}

function OrderButton() {
  // TODO 3: same here (and in Receipt below): read the language from the context.
  const lang = 'en';
  return <button className="primary">{MESSAGES[lang].order}</button>;
}

function Receipt() {
  const lang = 'en';
  return <p>{MESSAGES[lang].receipt}</p>;
}

// Middle layers: they never receive or pass on a language prop.
function Header() {
  return (
    <header>
      <Greeting />
    </header>
  );
}

function Menu() {
  return (
    <section className="card stack" aria-label="Menu">
      <OrderButton />
    </section>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');

  // TODO 4: provide `lang` to everything below: wrap the <div> in
  //         <LanguageContext value={lang}> … </LanguageContext>
  // TODO 5: the "Persian preview" card must always be Persian, whatever is picked above:
  //         wrap <Receipt /> in a nested <LanguageContext value="fa"> to override it.
  return (
    <div className="stack">
      <div className="row" role="group" aria-label="Language">
        <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
        <button aria-pressed={lang === 'fa'} onClick={() => setLang('fa')}>فارسی</button>
      </div>
      <Header />
      <Menu />
      <section className="card" aria-label="Persian preview">
        <Receipt />
      </section>
    </div>
  );
}
