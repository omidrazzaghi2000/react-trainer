import App from './App';

const searchBox = () => screen.getByLabelText('Search books');
const results = () => screen.getByRole('region', { name: 'Search results' });
const listRenders = () => logs().filter((line) => line.startsWith('BookList render'));

test({ en: 'Typing updates the search box right away', fa: 'تایپ کردن، جعبهٔ جست‌وجو را بلافاصله به‌روز می‌کند' }, async () => {
  render(<App />);
  await user.type(searchBox(), 'owl');
  expect(searchBox()).toHaveValue('owl');
});

test({ en: 'The list shows only the matching books (or a "no match" message)', fa: 'لیست فقط کتاب‌های منطبق را نشان می‌دهد (یا پیام «No books match»)' }, async () => {
  render(<App />);
  await user.type(searchBox(), 'owl');
  expect(await within(results()).findByText('The Blind Owl')).toBeInTheDocument();
  await waitFor(() => expect(within(results()).queryByText('Dune')).toBeNull());
  await user.clear(searchBox());
  await user.type(searchBox(), 'zzz');
  expect(await screen.findByText('No books match "zzz".')).toBeInTheDocument();
});

test({ en: 'While the list catches up it is marked busy and keeps the old results', fa: 'تا وقتی لیست عقب است، busy علامت می‌خورد و نتایج قبلی را نگه می‌دارد' }, async () => {
  render(<App />);
  const region = results();
  // React commits twice per keystroke: the urgent render, then the deferred one.
  // A MutationObserver records, in order, what changed across both commits.
  const events = [];
  const note = (record) => {
    if (record.type === 'attributes') {
      events.push(record.oldValue === 'true' ? 'unmarked' : 'marked busy');
    } else if (events[events.length - 1] !== 'list changed') {
      events.push('list changed');
    }
  };
  const observer = new MutationObserver((records) => records.forEach(note));
  observer.observe(region, {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['aria-busy'], attributeOldValue: true,
  });
  await user.type(searchBox(), 'o');
  await waitFor(() => expect(within(region).queryByText('Dune')).toBeNull());
  observer.takeRecords().forEach(note);
  observer.disconnect();
  // Expected: mark busy (old list still shown) → swap the list → remove the mark.
  expect(events).toEqual(['marked busy', 'list changed', 'unmarked']);
  expect(region).toHaveAttribute('aria-busy', 'false');
});

test({ en: 'The slow list renders once per keystroke, always with the new query (memo)', fa: 'لیست کند برای هر کلید فقط یک بار و همیشه با query جدید رندر می‌شود (memo)' }, async () => {
  render(<App />);
  const before = listRenders().length;
  await user.type(searchBox(), 'owl');
  await within(results()).findByText('The Blind Owl');
  expect(listRenders().slice(before)).toEqual([
    'BookList render: "o"',
    'BookList render: "ow"',
    'BookList render: "owl"',
  ]);
});
