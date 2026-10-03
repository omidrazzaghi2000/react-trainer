import App from './App';

// Each test opens recipes it has not used before where it matters: the promise
// cache lives at module level, so it survives from one test to the next.
const recipe = (name) => screen.getByRole('button', { name });
const heading = (name) => screen.findByRole('heading', { name });

test({ en: 'Asks you to pick a recipe first', fa: 'اول از شما می‌خواهد یک دستور پخت انتخاب کنید' }, () => {
  render(<App />);
  expect(screen.getByText('Pick a recipe.')).toBeInTheDocument();
  expect(recipe('Pancakes')).toBeInTheDocument();
});

test({ en: 'Shows "Loading recipe…" while a recipe loads', fa: 'در حین بارگذاری دستور پخت، «Loading recipe…» نمایش داده می‌شود' }, async () => {
  render(<App />);
  await user.click(recipe('Pancakes'));
  expect(screen.getByText('Loading recipe…')).toBeInTheDocument();
  // Let the request finish inside the test so nothing resolves after it.
  expect(await heading('Pancakes')).toBeInTheDocument();
});

test({ en: 'Shows the recipe once its data arrives', fa: 'وقتی داده رسید، دستور پخت نمایش داده می‌شود' }, async () => {
  render(<App />);
  await user.click(recipe('Omelette'));
  expect(await heading('Omelette')).toBeInTheDocument();
  expect(screen.getByText('10 min')).toBeInTheDocument();
  expect(screen.getByRole('list')).toHaveTextContent('Eggs: 150 g');
  expect(screen.queryByText('Loading recipe…')).toBeNull();
});

test({ en: 'Opening a recipe again is instant — its promise is cached', fa: 'باز کردن دوبارهٔ یک دستور پخت آنی است؛ promise آن cache شده است' }, async () => {
  render(<App />);
  await user.click(recipe('Shakshuka'));
  await heading('Shakshuka');
  await user.click(recipe('Tahdig'));
  await heading('Tahdig');
  await user.click(recipe('Shakshuka'));
  // No waiting here: the cached promise is already fulfilled, so use() doesn't suspend.
  expect(screen.getByRole('heading', { name: 'Shakshuka' })).toBeInTheDocument();
  expect(screen.queryByText('Loading recipe…')).toBeNull();
});

test({ en: 'Amounts follow the "Imperial units" switch (use(Context))', fa: 'مقدارها از کلید «Imperial units» پیروی می‌کنند (use(Context))' }, async () => {
  render(<App />);
  await user.click(recipe('Tahdig'));
  await heading('Tahdig');
  const list = screen.getByRole('list');
  expect(list).toHaveTextContent('Rice: 500 g');
  await user.click(screen.getByRole('checkbox', { name: 'Imperial units' }));
  expect(list).toHaveTextContent('Rice: 17.6 oz');
  expect(list).toHaveTextContent('Saffron: to taste');
});
