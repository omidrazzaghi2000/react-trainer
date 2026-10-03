import App from './App';

const markAll = () => screen.getByRole('button', { name: 'Mark all as read' });

test({ en: 'Shows the unread badge while messages are unread', fa: 'تا وقتی پیام خوانده‌نشده هست، badge تعداد نمایش داده می‌شود' }, () => {
  render(<App />);
  expect(screen.getByLabelText('Unread count')).toHaveTextContent('2');
});

test({ en: 'No badge and no stray "0" once everything is read', fa: 'وقتی همه خوانده شدند، نه badge می‌ماند و نه یک «0» سرگردان' }, async () => {
  render(<App />);
  await user.click(markAll());
  expect(screen.queryByLabelText('Unread count')).toBeNull();
  expect(screen.getByRole('region', { name: 'Inbox' })).not.toHaveTextContent('0');
});

test({ en: '"Mark all as read" is disabled when nothing is unread', fa: 'دکمهٔ «Mark all as read» وقتی چیزی خوانده‌نشده نیست غیرفعال است' }, async () => {
  render(<App />);
  expect(markAll()).toBeEnabled();
  await user.click(markAll());
  expect(markAll()).toBeDisabled();
});

test({ en: 'Archiving every message shows "All caught up!" instead of the list', fa: 'بایگانی همهٔ پیام‌ها به‌جای فهرست، «All caught up!» را نشان می‌دهد' }, async () => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Archive message from Sina' }));
  await user.click(screen.getByRole('button', { name: 'Archive message from Tara' }));
  expect(screen.getByText('All caught up!')).toBeInTheDocument();
  expect(screen.queryByRole('list')).toBeNull();
});

test({ en: 'Hiding the composer keeps the draft text', fa: 'پنهان کردن composer متن پیش‌نویس را حفظ می‌کند' }, async () => {
  render(<App />);
  await user.type(screen.getByRole('textbox', { name: 'Draft' }), 'Hello');
  await user.click(screen.getByRole('button', { name: 'Hide composer' }));
  expect(screen.queryByRole('textbox', { name: 'Draft' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Show composer' }));
  expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('Hello');
});
