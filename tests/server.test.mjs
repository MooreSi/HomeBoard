import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Acceptance: extracting into a folder with spaces must serve the dashboard
// and its JavaScript/CSS unchanged. No Microsoft account or network service
// is used; the server gets fresh temporary data and an empty client ID.
const source = fileURLToPath(new URL('../', import.meta.url));

test('dashboard assets are served from a project directory containing spaces', { timeout: 10000 }, async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dakboard project '));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.copyFile(path.join(source, 'server.mjs'), path.join(root, 'server.mjs'));
  await fs.cp(path.join(source, 'public'), path.join(root, 'public'), { recursive: true });
  // A separate ephemeral socket reserves a port for this process, matching the
  // original regression harness without changing the production startup API.
  const net = await import('node:net');
  const probe = net.createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const child = spawn(process.execPath, [path.join(root, 'server.mjs')], {
    env: { ...process.env, PORT: String(port), DATA_DIR: path.join(root, 'data'), MICROSOFT_CLIENT_ID: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const exited = once(child, 'exit');
  t.after(async () => { child.kill(); await exited; });
  await Promise.race([once(child.stdout, 'data'), exited.then(() => { throw Error('Server exited before startup'); })]);
  const response = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(response.status, 200, 'dashboard should load after extraction into a folder with spaces');
  assert.equal(await response.text(), await fs.readFile(path.join(root, 'public/index.html'), 'utf8'));
  const script = await fetch(`http://127.0.0.1:${port}/app.js`);
  assert.equal(script.status, 200);
  assert.equal(await script.text(), await fs.readFile(path.join(root, 'public/app.js'), 'utf8'));
  const style = await fetch(`http://127.0.0.1:${port}/style.css`);
  assert.equal(style.status, 200);
  assert.equal(await style.text(), await fs.readFile(path.join(root, 'public/style.css'), 'utf8'));
});
