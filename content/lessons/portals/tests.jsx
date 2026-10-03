import App from './App';

async function openDialog() {
  await user.click(screen.getByRole('button', { name: 'Share' }));
  return screen.getByRole('dialog', { name: 'Share playlist' });
}

test({ en: '"Share" opens a dialog named "Share playlist"', fa: 'دکمهٔ «Share» دیالوگی با نام «Share playlist» باز می‌کند' }, async () => {
  render(<App />);
  const dialog = await openDialog();
  expect(within(dialog).getByLabelText("Friend's email")).toBeInTheDocument();
});

test({ en: 'The dialog is rendered outside the app container (through a portal)', fa: 'دیالوگ بیرون از container برنامه رندر می‌شود (از طریق portal)' }, async () => {
  const { container } = render(<App />);
  const dialog = await openDialog();
  expect(document.body).toContainElement(dialog);
  expect(container).not.toContainElement(dialog);
});

test({ en: 'The dialog is announced as modal (aria-modal="true")', fa: 'دیالوگ به‌عنوان modal معرفی می‌شود (aria-modal="true")' }, async () => {
  render(<App />);
  const dialog = await openDialog();
  expect(dialog).toHaveAttribute('aria-modal', 'true');
});

test({ en: 'Opening the dialog moves keyboard focus inside it', fa: 'باز شدن دیالوگ، focus صفحه‌کلید را به داخل آن می‌برد' }, async () => {
  render(<App />);
  const dialog = await openDialog();
  expect(dialog).toContainElement(document.activeElement);
});

test({ en: 'Pressing Escape closes the dialog', fa: 'فشردن Escape دیالوگ را می‌بندد' }, async () => {
  render(<App />);
  await openDialog();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
});

test({ en: 'Closing gives focus back to the "Share" button', fa: 'بسته شدن دیالوگ، focus را به دکمهٔ «Share» برمی‌گرداند' }, async () => {
  render(<App />);
  const share = screen.getByRole('button', { name: 'Share' });
  await openDialog();
  await user.keyboard('{Escape}');
  expect(share).toHaveFocus();
  const dialog = await openDialog();
  await user.click(within(dialog).getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(share).toHaveFocus();
});
