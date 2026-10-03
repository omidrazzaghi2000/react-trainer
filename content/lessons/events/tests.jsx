import App from './App';

const pane = () => screen.getByRole('region', { name: 'Reading pane' });
const searchBox = () => screen.getByRole('searchbox', { name: 'Search' });

test({ en: 'Clicking an email row opens it in the reading pane', fa: 'کلیک روی ردیف یک ایمیل، آن را در پنل خواندن باز می‌کند' }, async () => {
  render(<App />);
  await user.click(screen.getByText('Lunch on Friday?'));
  expect(pane()).toHaveTextContent('Lunch on Friday?');
});

test({ en: 'The star button toggles the star without opening the email', fa: 'دکمهٔ ستاره، ستاره را تغییر می‌دهد بدون اینکه ایمیل باز شود' }, async () => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Star Design review at 3pm' }));
  expect(screen.getByRole('button', { name: 'Star Design review at 3pm', pressed: true })).toBeInTheDocument();
  expect(pane()).toHaveTextContent('No email open');
});

test({ en: 'Pressing Enter in the search box filters the list', fa: 'زدن Enter در جعبهٔ جست‌وجو، فهرست را فیلتر می‌کند' }, async () => {
  render(<App />);
  await user.type(searchBox(), 'lunch{enter}');
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByText('Lunch on Friday?')).toBeInTheDocument();
  expect(screen.queryByText('Your build passed')).toBeNull();
});

test({ en: 'The search form calls e.preventDefault() (no page reload)', fa: 'فرم جست‌وجو e.preventDefault() را صدا می‌زند (صفحه دوباره بارگذاری نمی‌شود)' }, async () => {
  render(<App />);
  // This listener runs after React's handler, so it sees whether the default was prevented.
  let prevented = null;
  const spy = (e) => { prevented = e.defaultPrevented; };
  document.addEventListener('submit', spy);
  try {
    await user.type(searchBox(), 'build{enter}');
  } finally {
    document.removeEventListener('submit', spy);
  }
  expect(prevented).toBe(true);
});

test({ en: 'Escape clears the search box and shows every email again', fa: 'کلید Escape جعبهٔ جست‌وجو را خالی می‌کند و همهٔ ایمیل‌ها دوباره نمایش داده می‌شوند' }, async () => {
  render(<App />);
  await user.type(searchBox(), 'lunch{enter}');
  await user.type(searchBox(), '{escape}');
  expect(searchBox()).toHaveValue('');
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
});
