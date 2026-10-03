import App, { Tabs } from './App';

const tab = (name) => screen.getByRole('tab', { name });

// A second consumer built only from the public API, to check both modes.
function Recipe(props) {
  return (
    <Tabs {...props}>
      <Tabs.List label="Quick recipe">
        <Tabs.Tab value="ingredients">Ingredients</Tabs.Tab>
        <Tabs.Tab value="steps">Steps</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="ingredients">Eggs and flour</Tabs.Panel>
      <Tabs.Panel value="steps">Whisk and fry</Tabs.Panel>
    </Tabs>
  );
}

test({ en: 'Renders a "Recipe" tablist with three tabs', fa: 'یک tablist به نام «Recipe» با سه تب رندر می‌شود' }, () => {
  render(<App />);
  const list = screen.getByRole('tablist', { name: 'Recipe' });
  expect(within(list).getAllByRole('tab')).toHaveLength(3);
});

test({ en: 'The defaultValue tab starts selected and only its panel is shown', fa: 'تبِ defaultValue از اول انتخاب شده و فقط پنل خودش نمایش داده می‌شود' }, () => {
  render(<App />);
  expect(tab('Ingredients')).toHaveAttribute('aria-selected', 'true');
  expect(tab('Steps')).toHaveAttribute('aria-selected', 'false');
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  expect(screen.getByRole('tabpanel', { name: 'Ingredients' })).toHaveTextContent('flour');
});

test({ en: 'Clicking a tab selects it and shows its panel', fa: 'کلیک روی یک تب آن را انتخاب می‌کند و پنلش را نشان می‌دهد' }, async () => {
  render(<App />);
  await user.click(tab('Steps'));
  expect(tab('Steps')).toHaveAttribute('aria-selected', 'true');
  expect(tab('Ingredients')).toHaveAttribute('aria-selected', 'false');
  expect(screen.getByRole('tabpanel', { name: 'Steps' })).toHaveTextContent('fry both sides');
  await user.click(tab('Tips'));
  expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
  expect(screen.getByRole('tabpanel', { name: 'Tips' })).toHaveTextContent('for the cook');
});

test({ en: 'Uncontrolled: Tabs keeps its own state and reports changes with onValueChange', fa: 'حالت کنترل‌نشده: Tabs خودش state را نگه می‌دارد و تغییرها را با onValueChange گزارش می‌دهد' }, async () => {
  const onValueChange = fn();
  render(<Recipe defaultValue="ingredients" onValueChange={onValueChange} />);
  await user.click(tab('Steps'));
  expect(onValueChange).toHaveBeenCalledWith('steps');
  expect(tab('Steps')).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tabpanel', { name: 'Steps' })).toHaveTextContent('Whisk and fry');
});

test({ en: 'Controlled: the value prop decides the selected tab', fa: 'حالت کنترل‌شده: prop به نام value تعیین می‌کند کدام تب انتخاب شود' }, async () => {
  const onValueChange = fn();
  const view = render(<Recipe value="steps" onValueChange={onValueChange} />);
  expect(tab('Steps')).toHaveAttribute('aria-selected', 'true');
  await user.click(tab('Ingredients'));
  expect(onValueChange).toHaveBeenCalledWith('ingredients');
  // The parent has not changed `value` yet, so Steps must stay selected.
  expect(tab('Steps')).toHaveAttribute('aria-selected', 'true');
  view.rerender(<Recipe value="ingredients" onValueChange={onValueChange} />);
  expect(tab('Ingredients')).toHaveAttribute('aria-selected', 'true');
  const panel = screen.getByRole('tabpanel', { name: 'Ingredients' });
  expect(panel).toHaveTextContent('Eggs and flour');
});
