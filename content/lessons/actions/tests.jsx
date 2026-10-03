import App from './App';

const emailInput = () => screen.getByLabelText('Email');
const submit = () => screen.getByRole('button', { name: /subscrib/i });

test({ en: 'Renders the sign-up form', fa: 'فرم عضویت رندر می‌شود' }, () => {
  render(<App />);
  expect(emailInput()).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Subscribe' })).toBeEnabled();
});

test({ en: 'An invalid email shows the error returned by the action', fa: 'ایمیل نامعتبر، خطایی را که action برگردانده نشان می‌دهد' }, async () => {
  render(<App />);
  await user.type(emailInput(), 'ada');
  await user.click(submit());
  expect(await screen.findByRole('alert')).toHaveTextContent('Please enter a valid email.');
  expect(screen.queryByRole('status')).toBeNull();
});

test({ en: 'After a validation error the typed email is still in the input', fa: 'بعد از خطای اعتبارسنجی، ایمیل تایپ‌شده هنوز در ورودی هست' }, async () => {
  render(<App />);
  await user.type(emailInput(), 'grace');
  await user.click(submit());
  await screen.findByRole('alert');
  expect(emailInput()).toHaveValue('grace');
});

test({ en: 'While saving, the button shows "Subscribing…" and is disabled', fa: 'در حین ذخیره، دکمه «Subscribing…» را نشان می‌دهد و غیرفعال است' }, async () => {
  render(<App />);
  await user.type(emailInput(), 'ada@example.com');
  await user.click(submit());
  const button = screen.getByRole('button', { name: 'Subscribing…' });
  expect(button).toBeDisabled();
  // Let the action finish inside the test.
  await screen.findByRole('status');
  expect(screen.getByRole('button', { name: 'Subscribe' })).toBeEnabled();
});

test({ en: 'On success: a thank-you message, a cleared input, and no error', fa: 'در صورت موفقیت: پیام تشکر، ورودی خالی و بدون خطا' }, async () => {
  render(<App />);
  await user.type(emailInput(), 'oops');
  await user.click(submit());
  await screen.findByRole('alert');
  await user.clear(emailInput());
  await user.type(emailInput(), 'linus@example.com{enter}');
  const thanks = await screen.findByRole('status');
  expect(thanks).toHaveTextContent('Thanks! linus@example.com is subscribed.');
  expect(emailInput()).toHaveValue('');
  expect(screen.queryByRole('alert')).toBeNull();
});
