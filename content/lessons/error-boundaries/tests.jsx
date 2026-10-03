import { createRoot } from 'react-dom/client';
import App, { ErrorBoundary } from './App';

// React reports every error a boundary catches through the root's `onCaughtError` option
// (in development the default prints a console.error). Those errors are expected here, so
// we mount on our own root and keep them quiet.
let root = null;

// If NO boundary catches an error, React unmounts the whole app and act() re-throws it.
const crashed = (error) =>
  new Error(`No error boundary caught "${error.message}", so the whole app unmounted`);

function mount(ui) {
  if (root) act(() => root.unmount());
  const container = document.body.appendChild(document.createElement('div'));
  root = createRoot(container, { onCaughtError: () => {} });
  try {
    act(() => root.render(ui));
  } catch (error) {
    throw crashed(error);
  }
}

async function loadNewReviews() {
  const button = screen.getByRole('button', { name: 'Load new reviews' });
  try {
    await user.click(button);
  } catch (error) {
    throw crashed(error);
  }
}

test({ en: 'Shows the saved reviews', fa: 'نظرهای ذخیره‌شده نمایش داده می‌شوند' }, () => {
  mount(<App />);
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  expect(screen.queryByRole('alert')).toBeNull();
});

test({ en: 'ErrorBoundary catches a render error from any child and shows the fallback', fa: 'ErrorBoundary خطای رندرِ هر فرزندی را می‌گیرد و fallback را نشان می‌دهد' }, () => {
  function Boom() {
    throw new Error('Kaboom');
  }
  mount(<ErrorBoundary><Boom /></ErrorBoundary>);
  expect(screen.getByRole('alert')).toHaveTextContent('Kaboom');
});

test({ en: 'A broken review shows the fallback (role="alert") and the rest of the page survives', fa: 'یک نظر خراب، fallback (با role="alert") را نشان می‌دهد و بقیهٔ صفحه سالم می‌ماند' }, async () => {
  mount(<App />);
  await loadNewReviews();
  expect(screen.getByRole('alert')).toHaveTextContent('Review #3 has no author');
  expect(screen.getByRole('heading', { name: /Reviews/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Load new reviews' })).toBeInTheDocument();
});

test({ en: 'componentDidCatch reports the error with console.log', fa: 'componentDidCatch خطا را با console.log گزارش می‌دهد' }, async () => {
  mount(<App />);
  await loadNewReviews();
  expect(logs().some((line) => line.includes('Review #3 has no author'))).toBe(true);
});

test({ en: '"Try again" resets the boundary and shows the reviews again', fa: 'دکمهٔ «Try again» مرز خطا را ریست می‌کند و نظرها دوباره نمایش داده می‌شوند' }, async () => {
  mount(<App />);
  await loadNewReviews();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
});

test({ en: 'After a reset, the boundary catches the next error too', fa: 'بعد از ریست، مرز خطا خطای بعدی را هم می‌گیرد' }, async () => {
  mount(<App />);
  await loadNewReviews();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  await loadNewReviews();
  expect(screen.getByRole('alert')).toHaveTextContent('Review #3 has no author');
});
