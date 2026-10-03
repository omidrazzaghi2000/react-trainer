import App from './App';

// Helpers: fields by their <label>, the rules checkbox and the submit button.
const field = (label) => screen.getByLabelText(label);
const rules = () => screen.getByRole('checkbox', { name: 'I agree to the house rules' });
const bookButton = () => screen.getByRole('button', { name: 'Book table' });

test({ en: 'The form shows Name, Guests, Notes and the house-rules checkbox', fa: 'فرم فیلدهای Name، Guests، Notes و چک‌باکس قوانین را نشان می‌دهد' }, () => {
  render(<App />);
  expect(field('Name')).toBeInTheDocument();
  expect(field('Guests')).toBeInTheDocument();
  expect(field('Notes')).toBeInTheDocument();
  expect(rules()).toBeInTheDocument();
});

test({ en: 'Typing in Notes updates the live character counter', fa: 'تایپ در Notes شمارندهٔ زندهٔ کاراکترها را به‌روز می‌کند' }, async () => {
  render(<App />);
  const notes = field('Notes');
  await user.type(notes, 'Window seat');
  expect(notes).toHaveValue('Window seat');
  expect(screen.getByText('11/140')).toBeInTheDocument();
});

test({ en: 'A one-letter name shows an error that disappears once the name is valid', fa: 'نام تک‌حرفی پیام خطا نشان می‌دهد و با معتبر شدن نام، خطا ناپدید می‌شود' }, async () => {
  render(<App />);
  const name = field('Name');
  await user.type(name, 'S');
  expect(name).toHaveValue('S');
  expect(screen.getByRole('alert')).toHaveTextContent(/at least 2 characters/i);
  await user.type(name, 'a');
  expect(name).toHaveValue('Sa');
  expect(screen.queryByRole('alert')).toBeNull();
});

test({ en: '"Book table" stays disabled until the name is valid and the rules are accepted', fa: 'دکمهٔ «Book table» تا وقتی نام معتبر نباشد و قوانین پذیرفته نشود غیرفعال می‌ماند' }, async () => {
  render(<App />);
  expect(bookButton()).toBeDisabled();
  await user.type(field('Name'), 'Sara');
  expect(bookButton()).toBeDisabled();
  await user.click(rules());
  expect(rules()).toBeChecked();
  expect(bookButton()).toBeEnabled();
  await user.clear(field('Name'));
  expect(bookButton()).toBeDisabled();
});

test({ en: 'Submitting shows a confirmation with the chosen name and number of guests', fa: 'ارسال فرم، پیام تأییدی با نام و تعداد مهمان‌های انتخاب‌شده نشان می‌دهد' }, async () => {
  render(<App />);
  await user.type(field('Name'), 'Sara');
  await user.selectOptions(field('Guests'), '4');
  expect(field('Guests')).toHaveValue('4');
  await user.click(rules());
  await user.click(bookButton());
  expect(screen.getByRole('status')).toHaveTextContent('Table for 4 booked under Sara.');
});

test({ en: 'Submitting calls preventDefault(), so the page does not reload', fa: 'ارسال فرم preventDefault() را صدا می‌زند تا صفحه دوباره بارگذاری نشود' }, async () => {
  render(<App />);
  await user.type(field('Name'), 'Sara');
  await user.click(rules());
  // React handles the submit on its root; body sees the event right after it.
  let prevented = null;
  const spy = (e) => { prevented = e.defaultPrevented; };
  document.body.addEventListener('submit', spy);
  try {
    await user.click(bookButton());
  } finally {
    document.body.removeEventListener('submit', spy);
  }
  expect(prevented).toBe(true);
});
