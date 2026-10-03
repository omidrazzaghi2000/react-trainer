import App, { reducer, createInitialState } from './App';

const texts = (state) => state.tasks.map((task) => task.text);

test({ en: 'reducer: "added" returns a new state with the task appended', fa: 'reducer: اکشن «added» یک state جدید با کار اضافه‌شده برمی‌گرداند' }, () => {
  const before = createInitialState(['Tea']);
  const snapshot = JSON.stringify(before);
  const after = reducer(before, { type: 'added', text: 'Cake' });
  expect(texts(after)).toEqual(['Tea', 'Cake']);
  expect(after).not.toBe(before);
  expect(JSON.stringify(before)).toBe(snapshot);
});

test({ en: 'reducer: "toggled" flips only that task, without mutating the old state', fa: 'reducer: اکشن «toggled» فقط همان کار را برعکس می‌کند و state قبلی را mutate نمی‌کند' }, () => {
  const before = createInitialState(['Tea', 'Cake']);
  const snapshot = JSON.stringify(before);
  const after = reducer(before, { type: 'toggled', id: 2 });
  expect(after).not.toBe(before);
  expect(after.tasks.map((task) => task.done)).toEqual([false, true]);
  expect(JSON.stringify(before)).toBe(snapshot);
  const back = reducer(after, { type: 'toggled', id: 2 });
  expect(back.tasks.map((task) => task.done)).toEqual([false, false]);
});

test({ en: 'reducer: "deleted" and "cleared_done" remove the right tasks', fa: 'reducer: اکشن‌های «deleted» و «cleared_done» کارهای درست را حذف می‌کنند' }, () => {
  const start = createInitialState(['Tea', 'Cake', 'Milk']);
  expect(texts(reducer(start, { type: 'deleted', id: 2 }))).toEqual(['Tea', 'Milk']);
  const someDone = {
    ...start,
    tasks: start.tasks.map((task) => (task.id === 2 ? task : { ...task, done: true })),
  };
  const snapshot = JSON.stringify(someDone);
  expect(texts(reducer(someDone, { type: 'cleared_done' }))).toEqual(['Cake']);
  expect(JSON.stringify(someDone)).toBe(snapshot);
});

test({ en: 'Checking a task marks it done and updates "N left"', fa: 'تیک زدن یک کار آن را انجام‌شده می‌کند و «N left» را به‌روز می‌کند' }, async () => {
  render(<App />);
  expect(screen.getByText('2 left')).toBeInTheDocument();
  const box = screen.getByRole('checkbox', { name: 'Buy coffee beans' });
  await user.click(box);
  expect(box).toBeChecked();
  expect(screen.getByText('1 left')).toBeInTheDocument();
  await user.click(box);
  expect(box).not.toBeChecked();
  expect(screen.getByText('2 left')).toBeInTheDocument();
});

test({ en: 'The × button deletes that task', fa: 'دکمهٔ × همان کار را حذف می‌کند' }, async () => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Delete Buy coffee beans' }));
  expect(screen.queryByRole('checkbox', { name: 'Buy coffee beans' })).toBeNull();
  expect(screen.getByRole('checkbox', { name: 'Write the reducer' })).toBeInTheDocument();
  expect(screen.getByText('1 left')).toBeInTheDocument();
});

test({ en: 'Add, check, then "Clear completed" keeps only unfinished tasks', fa: 'افزودن، تیک زدن و سپس «Clear completed» فقط کارهای ناتمام را نگه می‌دارد' }, async () => {
  render(<App />);
  await user.type(screen.getByRole('textbox', { name: 'New task' }), 'Walk the dog{enter}');
  await user.click(screen.getByRole('checkbox', { name: 'Buy coffee beans' }));
  await user.click(screen.getByRole('checkbox', { name: 'Walk the dog' }));
  await user.click(screen.getByRole('button', { name: 'Clear completed' }));
  expect(screen.queryByRole('checkbox', { name: 'Buy coffee beans' })).toBeNull();
  expect(screen.queryByRole('checkbox', { name: 'Walk the dog' })).toBeNull();
  expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  expect(screen.getByRole('checkbox', { name: 'Write the reducer' })).not.toBeChecked();
  expect(screen.getByText('1 left')).toBeInTheDocument();
});
