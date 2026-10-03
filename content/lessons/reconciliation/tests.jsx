import App from './App';

const draftFor = (name) => screen.getByRole('textbox', { name: `Message to ${name}` });

test({ en: 'Shows the chat with Ada first', fa: 'اول گفت‌وگو با Ada نمایش داده می‌شود' }, () => {
  render(<App />);
  expect(screen.getByRole('region', { name: 'Chat with Ada' })).toBeInTheDocument();
  expect(draftFor('Ada')).toHaveValue('');
});

test({ en: 'Typing keeps every character and the focus stays in the input', fa: 'هنگام تایپ همهٔ حروف حفظ می‌شوند و focus داخل ورودی می‌ماند' }, async () => {
  render(<App />);
  await user.type(draftFor('Ada'), 'Hello');
  expect(draftFor('Ada')).toHaveValue('Hello');
  expect(draftFor('Ada')).toHaveFocus();
  expect(screen.getByText('5 / 140')).toBeInTheDocument();
});

test({ en: 'Switching to another contact starts with an empty draft', fa: 'رفتن سراغ مخاطب دیگر با پیش‌نویس خالی شروع می‌شود' }, async () => {
  render(<App />);
  await user.type(draftFor('Ada'), 'Hi Ada');
  await user.click(screen.getByRole('button', { name: 'Linus' }));
  expect(screen.getByRole('region', { name: 'Chat with Linus' })).toBeInTheDocument();
  expect(draftFor('Linus')).toHaveValue('');
});

test({ en: 'Toggling Compact keeps the draft', fa: 'روشن و خاموش کردن Compact پیش‌نویس را حفظ می‌کند' }, async () => {
  render(<App />);
  await user.type(draftFor('Ada'), 'See you');
  await user.click(screen.getByRole('checkbox', { name: 'Compact' }));
  expect(draftFor('Ada')).toHaveValue('See you');
  await user.click(screen.getByRole('checkbox', { name: 'Compact' }));
  expect(draftFor('Ada')).toHaveValue('See you');
});
