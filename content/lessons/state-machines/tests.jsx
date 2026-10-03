import App, { deployMachine } from './App';

// The fake deploy answers after 200 ms.
const status = () => screen.getByRole('status');
const deployButton = () => screen.getByRole('button', { name: 'Deploy' });

test({ en: 'Deploying main shows progress, then the live URL', fa: 'دیپلوی main ابتدا پیشرفت کار و سپس آدرس live را نشان می‌دهد' }, async () => {
  render(<App />);
  expect(status()).toHaveTextContent('Ready to deploy');
  await user.click(deployButton());
  expect(status()).toHaveTextContent('Deploying main');
  await waitFor(() => expect(status()).toHaveTextContent('Live at https://main.example.app'));
});

test({ en: 'Events that make no sense in the current state return the same state object', fa: 'رویدادهایی که در state فعلی بی‌معنی‌اند، همان شیء state را برمی‌گردانند' }, () => {
  const deploying = { status: 'deploying', branch: 'main' };
  expect(deployMachine(deploying, { type: 'DEPLOY', branch: 'main' })).toBe(deploying);
  const idle = { status: 'idle' };
  expect(deployMachine(idle, { type: 'SUCCESS', url: 'https://main.example.app' })).toBe(idle);
  expect(deployMachine(idle, { type: 'CANCEL' })).toBe(idle);
  const live = { status: 'live', branch: 'main', url: 'https://main.example.app' };
  expect(deployMachine(live, { type: 'FAILURE', error: 'Build failed' })).toBe(live);
});

test({ en: 'Each new state carries only its own data (no leftover error or url)', fa: 'هر state جدید فقط دادهٔ خودش را دارد (بدون error یا url باقی‌مانده)' }, () => {
  const failed = { status: 'failed', branch: 'broken-build', error: 'Build failed' };
  const retry = deployMachine(failed, { type: 'DEPLOY', branch: 'main' });
  expect(retry).toHaveProperty('status', 'deploying');
  expect(retry).toHaveProperty('branch', 'main');
  expect(retry.error).toBeUndefined();

  const live = { status: 'live', branch: 'main', url: 'https://main.example.app' };
  const redeploy = deployMachine(live, { type: 'DEPLOY', branch: 'main' });
  expect(redeploy).toHaveProperty('status', 'deploying');
  expect(redeploy.url).toBeUndefined();

  const done = deployMachine(redeploy, { type: 'SUCCESS', url: 'https://main.example.app' });
  expect(done).toHaveProperty('status', 'live');
  expect(done).toHaveProperty('url', 'https://main.example.app');
});

test({ en: 'Cancel returns to "Ready to deploy" and the late server answer is ignored', fa: 'Cancel به «Ready to deploy» برمی‌گردد و پاسخ دیرهنگام سرور نادیده گرفته می‌شود' }, async () => {
  render(<App />);
  await user.click(deployButton());
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(status()).toHaveTextContent('Ready to deploy');
  // Let the fake server answer; a machine in 'idle' must not accept SUCCESS.
  await wait(400);
  expect(status()).toHaveTextContent('Ready to deploy');
  expect(screen.queryByText(/Live at/)).toBeNull();
});

test({ en: 'A failed deploy shows the error; deploying main afterwards goes live and clears it', fa: 'دیپلوی ناموفق خطا را نشان می‌دهد؛ دیپلوی بعدی main به live می‌رسد و خطا پاک می‌شود' }, async () => {
  render(<App />);
  await user.selectOptions(screen.getByRole('combobox', { name: 'Branch' }), 'broken-build');
  await user.click(deployButton());
  expect(await screen.findByRole('alert')).toHaveTextContent('Build failed');
  await user.selectOptions(screen.getByRole('combobox', { name: 'Branch' }), 'main');
  await user.click(deployButton());
  expect(screen.queryByRole('alert')).toBeNull();
  await waitFor(() => expect(status()).toHaveTextContent('Live at https://main.example.app'));
});
