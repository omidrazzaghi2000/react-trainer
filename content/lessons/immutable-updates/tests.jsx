import App from './App';

// Helpers: the task rows and a checkbox found by its label text.
const rows = () => within(screen.getByRole('list')).queryAllByRole('listitem');
const box = (name) => screen.getByRole('checkbox', { name });

test({ en: 'Shows the three starting tasks and "1 of 3 done"', fa: 'سه کار اولیه و «1 of 3 done» نمایش داده می‌شوند' }, () => {
  render(<App />);
  expect(rows()).toHaveLength(3);
  expect(box('Buy coffee beans')).toBeChecked();
  expect(screen.getByText('1 of 3 done')).toBeInTheDocument();
});

test({ en: 'Adding a task appends it to the end of the list', fa: 'افزودن یک کار، آن را به انتهای لیست اضافه می‌کند' }, async () => {
  render(<App />);
  await user.type(screen.getByLabelText('New task'), 'Water the plants');
  await user.click(screen.getByRole('button', { name: 'Add' }));
  const list = rows();
  expect(list).toHaveLength(4);
  expect(list[3]).toHaveTextContent('Water the plants');
  expect(screen.getByText('1 of 4 done')).toBeInTheDocument();
});

test({ en: 'Ticking a task toggles it and updates the counter', fa: 'تیک زدن یک کار وضعیتش را عوض می‌کند و شمارنده را به‌روز می‌کند' }, async () => {
  render(<App />);
  await user.click(box('Fix the login bug'));
  expect(box('Fix the login bug')).toBeChecked();
  expect(screen.getByText('2 of 3 done')).toBeInTheDocument();
  await user.click(box('Buy coffee beans'));
  expect(box('Buy coffee beans')).not.toBeChecked();
  expect(screen.getByText('1 of 3 done')).toBeInTheDocument();
});

test({ en: 'Delete removes exactly that task', fa: 'دکمهٔ حذف دقیقاً همان کار را حذف می‌کند' }, async () => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Delete Fix the login bug' }));
  expect(rows()).toHaveLength(2);
  expect(screen.queryByRole('checkbox', { name: 'Fix the login bug' })).toBeNull();
  expect(box('Call the bank')).toBeInTheDocument();
  expect(screen.getByText('1 of 2 done')).toBeInTheDocument();
});

test({ en: '"Hide done tasks" updates the nested settings and hides finished tasks', fa: '«Hide done tasks» تنظیمات تودرتو را به‌روز می‌کند و کارهای تمام‌شده را پنهان می‌کند' }, async () => {
  render(<App />);
  await user.click(box('Hide done tasks'));
  expect(box('Hide done tasks')).toBeChecked();
  expect(rows()).toHaveLength(2);
  expect(screen.queryByRole('checkbox', { name: 'Buy coffee beans' })).toBeNull();
  await user.click(box('Hide done tasks'));
  expect(box('Hide done tasks')).not.toBeChecked();
  expect(rows()).toHaveLength(3);
});
