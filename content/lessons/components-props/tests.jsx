import App from './App';

// A team panel is a <section aria-label="…">; a member card is the <article> around its heading.
const panel = (name) => within(screen.getByRole('region', { name }));
const card = (name) => within(screen.getByRole('heading', { level: 3, name }).closest('article'));

test({ en: 'Both team panels render with their titles', fa: 'هر دو پنل تیم با عنوانشان رندر می‌شوند' }, () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 2, name: 'Design team' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 2, name: 'Engineering' })).toBeInTheDocument();
});

test({ en: 'Each panel renders the member cards passed as children', fa: 'هر پنل کارت‌های عضوی را که به‌عنوان children گرفته رندر می‌کند' }, () => {
  render(<App />);
  expect(panel('Design team').getAllByRole('article')).toHaveLength(2);
  expect(panel('Engineering').getAllByRole('article')).toHaveLength(1);
});

test({ en: 'Each card shows its own name and role from props', fa: 'هر کارت نام و نقش خودش را از props نشان می‌دهد' }, () => {
  render(<App />);
  expect(card('Sara Rahimi').getByText('Product designer')).toBeInTheDocument();
  expect(card('Neda Karimi').getByText('Frontend engineer')).toBeInTheDocument();
});

test({ en: 'A card without a role shows the default "Guest"', fa: 'کارتی که role ندارد مقدار پیش‌فرض «Guest» را نشان می‌دهد' }, () => {
  render(<App />);
  expect(card('Kian Moradi').getByText('Guest')).toBeInTheDocument();
});

test({ en: 'Every card composes an Avatar with the initials', fa: 'هر کارت یک Avatar با حروف اول نام در خودش دارد' }, () => {
  render(<App />);
  expect(card('Sara Rahimi').getByText('SR')).toBeInTheDocument();
  expect(card('Kian Moradi').getByText('KM')).toBeInTheDocument();
  expect(card('Neda Karimi').getByText('NK')).toBeInTheDocument();
});
