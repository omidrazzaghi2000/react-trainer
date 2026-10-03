import App from './App';

// Each counter is a <section aria-label="…">, so we can query inside one of them.
const counter = (name) => within(screen.getByRole('region', { name }));

test({ en: 'Both counters start at "Steps: 0"', fa: 'هر دو شمارنده با «Steps: 0» شروع می‌شوند' }, () => {
  render(<App />);
  expect(counter('Ada').getByText('Steps: 0')).toBeInTheDocument();
  expect(counter('Linus').getByText('Steps: 0')).toBeInTheDocument();
});

test({ en: '+1 adds one step per click', fa: 'دکمهٔ +1 با هر کلیک یک قدم اضافه می‌کند' }, async () => {
  render(<App />);
  const ada = counter('Ada');
  await user.click(ada.getByRole('button', { name: '+1' }));
  await user.click(ada.getByRole('button', { name: '+1' }));
  expect(ada.getByText('Steps: 2')).toBeInTheDocument();
});

test({ en: '+5 adds exactly five steps', fa: 'دکمهٔ +5 دقیقاً پنج قدم اضافه می‌کند' }, async () => {
  render(<App />);
  const ada = counter('Ada');
  await user.click(ada.getByRole('button', { name: '+5' }));
  expect(ada.getByText('Steps: 5')).toBeInTheDocument();
  await user.click(ada.getByRole('button', { name: '+5' }));
  expect(ada.getByText('Steps: 10')).toBeInTheDocument();
});

test({ en: 'Reset puts the counter back to 0', fa: 'دکمهٔ Reset شمارنده را به ۰ برمی‌گرداند' }, async () => {
  render(<App />);
  const ada = counter('Ada');
  await user.click(ada.getByRole('button', { name: '+5' }));
  await user.click(ada.getByRole('button', { name: 'Reset' }));
  expect(ada.getByText('Steps: 0')).toBeInTheDocument();
});

test({ en: 'Each counter keeps its own state', fa: 'هر شمارنده state مخصوص خودش را نگه می‌دارد' }, async () => {
  render(<App />);
  await user.click(counter('Linus').getByRole('button', { name: '+5' }));
  expect(counter('Linus').getByText('Steps: 5')).toBeInTheDocument();
  expect(counter('Ada').getByText('Steps: 0')).toBeInTheDocument();
});
