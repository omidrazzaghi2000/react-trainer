import App from './App';

// Helpers: the guest rows, a guest's "Arrived" checkbox, and the add form.
const rows = () => within(screen.getByRole('list')).getAllByRole('listitem');
const tick = (name) => screen.getByRole('checkbox', { name });

function expectOrder(names) {
  const items = rows();
  expect(items).toHaveLength(names.length);
  names.forEach((name, i) => expect(items[i]).toHaveTextContent(name));
}

async function addGuest(name) {
  await user.type(screen.getByLabelText('Guest name'), name);
  await user.click(screen.getByRole('button', { name: 'Add' }));
}

test({ en: 'Shows one row per guest, in the original order', fa: 'برای هر مهمان یک ردیف، به ترتیب اولیه، نمایش داده می‌شود' }, () => {
  render(<App />);
  expectOrder(['Grace', 'Linus', 'Ada']);
});

test({ en: 'A new guest appears at the top of the list', fa: 'مهمان جدید در بالای لیست ظاهر می‌شود' }, async () => {
  render(<App />);
  await addGuest('Margaret');
  expectOrder(['Margaret', 'Grace', 'Linus', 'Ada']);
});

test({ en: 'A ticked guest stays ticked when someone is added at the top', fa: 'تیک یک مهمان بعد از اضافه شدن نفر جدید در بالای لیست سر جایش می‌ماند' }, async () => {
  render(<App />);
  await user.click(tick('Ada'));
  await addGuest('Margaret');
  expect(tick('Ada')).toBeChecked();
  expect(tick('Margaret')).not.toBeChecked();
  expect(tick('Linus')).not.toBeChecked();
});

test({ en: 'Removing a guest never moves a tick to someone else', fa: 'حذف یک مهمان هیچ تیکی را به مهمان دیگری منتقل نمی‌کند' }, async () => {
  render(<App />);
  await user.click(tick('Linus'));
  await user.click(screen.getByRole('button', { name: 'Remove Grace' }));
  expectOrder(['Linus', 'Ada']);
  expect(tick('Linus')).toBeChecked();
  expect(tick('Ada')).not.toBeChecked();
});

test({ en: 'Removing a newly added guest removes only that guest', fa: 'حذف یک مهمانِ تازه‌اضافه‌شده فقط همان مهمان را حذف می‌کند' }, async () => {
  render(<App />);
  await addGuest('Margaret');
  await addGuest('Katherine');
  await user.click(screen.getByRole('button', { name: 'Remove Margaret' }));
  expectOrder(['Katherine', 'Grace', 'Linus', 'Ada']);
});

test({ en: '"Sort A–Z" sorts a copy: ticks follow their guests and turning it off restores the order', fa: '«Sort A–Z» یک کپی را مرتب می‌کند: تیک‌ها همراه مهمان خودشان می‌مانند و با خاموش کردنش ترتیب اولیه برمی‌گردد' }, async () => {
  render(<App />);
  await user.click(tick('Ada'));
  const sortButton = screen.getByRole('button', { name: 'Sort A–Z' });
  await user.click(sortButton);
  expectOrder(['Ada', 'Grace', 'Linus']);
  expect(tick('Ada')).toBeChecked();
  expect(tick('Linus')).not.toBeChecked();
  await user.click(sortButton);
  expectOrder(['Grace', 'Linus', 'Ada']);
  expect(tick('Ada')).toBeChecked();
});
