// Exercise: share the current language through context instead of drilling props.
import { createContext, useContext, useState } from 'react';

const MESSAGES = {
  en: { greeting: 'Welcome back!', order: 'Order coffee', receipt: 'Thanks for your order' },
  fa: { greeting: 'خوش برگشتید!', order: 'سفارش قهوه', receipt: 'از سفارش شما سپاسگزاریم' },
};

export const LanguageContext = createContext('en');

export function Greeting() {
  const lang = useContext(LanguageContext);
  return <h2>{MESSAGES[lang].greeting}</h2>;
}

function OrderButton() {
  const lang = useContext(LanguageContext);
  return <button className="primary">{MESSAGES[lang].order}</button>;
}

function Receipt() {
  const lang = useContext(LanguageContext);
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

  return (
    <LanguageContext value={lang}>
      <div className="stack">
        <div className="row" role="group" aria-label="Language">
          <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
          <button aria-pressed={lang === 'fa'} onClick={() => setLang('fa')}>فارسی</button>
        </div>
        <Header />
        <Menu />
        <section className="card" aria-label="Persian preview">
          <LanguageContext value="fa">
            <Receipt />
          </LanguageContext>
        </section>
      </div>
    </LanguageContext>
  );
}
