import App, { cartStore, createStore } from './App';

// The cart store is module state that survives between tests, so reset it first.
function renderFreshApp() {
  cartStore.setState({ count: 0, total: 0 });
  return render(<App />);
}

// Fake the browser's network status, then fire the matching window event.
function setNetwork(online) {
  for (const nav of new Set([navigator, window.navigator])) {
    Object.defineProperty(nav, 'onLine', { configurable: true, get: () => online });
  }
  act(() => {
    fire(window, online ? 'online' : 'offline');
  });
}

test({ en: 'Starts with an empty cart and a $0 total', fa: 'با سبد خالی و جمع $0 شروع می‌شود' }, () => {
  renderFreshApp();
  expect(screen.getByText('Cart: 0 items')).toBeInTheDocument();
  expect(screen.getByText('Total: $0')).toBeInTheDocument();
});

test({ en: 'createStore notifies subscribers until they unsubscribe', fa: 'createStore مشترک‌ها را تا وقتی لغو اشتراک نکرده‌اند باخبر می‌کند' }, () => {
  const store = createStore({ likes: 0 });
  const listener = fn();
  const unsubscribe = store.subscribe(listener);
  store.setState({ likes: 1 });
  expect(listener).toHaveBeenCalledTimes(1);
  expect(store.getState()).toEqual({ likes: 1 });
  unsubscribe();
  store.setState({ likes: 2 });
  expect(listener).toHaveBeenCalledTimes(1);
});

test({ en: 'setState creates a new state object instead of mutating the old one', fa: 'setState به جای mutate کردن state قبلی، یک شیء state جدید می‌سازد' }, () => {
  const store = createStore({ likes: 0, user: 'ada' });
  const before = store.getState();
  store.setState({ likes: 1 });
  expect(store.getState()).not.toBe(before);
  expect(before).toEqual({ likes: 0, user: 'ada' });
  expect(store.getState()).toEqual({ likes: 1, user: 'ada' });
});

test({ en: 'Adding products updates both the header badge and the checkout total', fa: 'افزودن محصول هم badge هدر و هم جمع کل صفحهٔ پرداخت را به‌روز می‌کند' }, async () => {
  renderFreshApp();
  await user.click(screen.getByRole('button', { name: 'Add Espresso beans' }));
  expect(screen.getByText('Cart: 1 item')).toBeInTheDocument();
  expect(screen.getByText('Total: $12')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Add Oat milk' }));
  expect(screen.getByText('Cart: 2 items')).toBeInTheDocument();
  expect(screen.getByText('Total: $15')).toBeInTheDocument();
});

test({ en: 'An Offline alert follows the browser\'s online/offline events', fa: 'هشدار Offline از رویدادهای online/offline مرورگر پیروی می‌کند' }, () => {
  try {
    setNetwork(true);
    renderFreshApp();
    expect(screen.queryByRole('alert')).toBeNull();
    setNetwork(false);
    expect(screen.getByRole('alert')).toHaveTextContent(/offline/i);
    setNetwork(true);
    expect(screen.queryByRole('alert')).toBeNull();
  } finally {
    delete navigator.onLine;
    delete window.navigator.onLine;
  }
});
