import App from './App';

// Fake delays in the app: Ada 150 ms, Grace 300 ms (slow), Linus 50 ms (fast), Ghost fails after 100 ms.
const profile = (name) => screen.findByRole('heading', { name });
const choose = (label) => user.click(screen.getByRole('button', { name: label }));

test({ en: 'Shows "Loading…" first, then Ada\'s profile', fa: 'اول «Loading…» و سپس پروفایل Ada نمایش داده می‌شود' }, async () => {
  render(<App />);
  expect(screen.getByText('Loading…')).toBeInTheDocument();
  expect(await profile('Ada Lovelace')).toBeInTheDocument();
  expect(screen.queryByText('Loading…')).toBeNull();
});

test({ en: 'Choosing another person loads their profile', fa: 'انتخاب فرد دیگر، پروفایل او را بارگذاری می‌کند' }, async () => {
  render(<App />);
  await profile('Ada Lovelace');
  await choose('Linus');
  expect(await profile('Linus Torvalds')).toBeInTheDocument();
  expect(screen.getByText('Creator of Linux')).toBeInTheDocument();
});

test({ en: '"Loading…" appears again while the next profile loads', fa: 'هنگام بارگذاری پروفایل بعدی، «Loading…» دوباره ظاهر می‌شود' }, async () => {
  render(<App />);
  await profile('Ada Lovelace');
  await choose('Grace');
  expect(screen.getByText('Loading…')).toBeInTheDocument();
  expect(await profile('Grace Hopper')).toBeInTheDocument();
});

test({ en: 'A failed request shows the error, and the next choice clears it', fa: 'درخواست ناموفق خطا را نشان می‌دهد و انتخاب بعدی آن را پاک می‌کند' }, async () => {
  render(<App />);
  await profile('Ada Lovelace');
  await choose('Ghost');
  expect(await screen.findByRole('alert')).toHaveTextContent('User not found');
  await choose('Linus');
  expect(await profile('Linus Torvalds')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).toBeNull();
});

test({ en: 'Switching quickly always ends on the last choice', fa: 'جابه‌جایی سریع همیشه به آخرین انتخاب ختم می‌شود' }, async () => {
  render(<App />);
  await profile('Ada Lovelace');
  await choose('Grace'); // slow answer…
  await choose('Linus'); // …overtaken by a fast one
  expect(await profile('Linus Torvalds')).toBeInTheDocument();
  await wait(400); // give Grace's outdated answer time to arrive
  expect(screen.getByRole('heading', { name: 'Linus Torvalds' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Grace Hopper' })).toBeNull();
});

test({ en: 'An outdated error never replaces a newer profile', fa: 'خطای یک درخواست قدیمی هرگز جای پروفایل جدیدتر را نمی‌گیرد' }, async () => {
  render(<App />);
  await profile('Ada Lovelace');
  await choose('Ghost'); // fails after 100 ms…
  await choose('Linus'); // …but Linus (50 ms) is the latest choice
  expect(await profile('Linus Torvalds')).toBeInTheDocument();
  await wait(200);
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Linus Torvalds' })).toBeInTheDocument();
});
