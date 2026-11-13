// Integration tests for EPMCDMETST-72136 enhancements:
// ENH-14 health endpoint, ENH-16 title max length, ENH-17 CORS allowlist.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-enh-test-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db'); // must be set before requiring the app

let app = require('../src/server');
const db = require('../src/db');

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  db.exec('DELETE FROM tasks');
});

const postJson = async (body) => {
  const res = await fetch(`${base}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

test('ENH-14: GET /api/health returns 200 with {status:"ok"}', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('ENH-16: POST rejects titles longer than TITLE_MAX_LENGTH (400)', async () => {
  process.env.TITLE_MAX_LENGTH = '200';
  const res = await postJson({ title: 'a'.repeat(201) });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: 'title must be at most 200 characters' });
});

test('ENH-16: POST accepts title at TITLE_MAX_LENGTH boundary (201)', async () => {
  process.env.TITLE_MAX_LENGTH = '200';
  const res = await postJson({ title: 'a'.repeat(200) });
  assert.equal(res.status, 201);
  assert.equal(res.body.title.length, 200);
});

test('ENH-17: default CORS (no ALLOWED_ORIGINS) echoes Origin', async () => {
  delete process.env.ALLOWED_ORIGINS;

  const res = await fetch(`${base}/api/health`, { headers: { Origin: 'https://example.com' } });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://example.com');
});

test('ENH-17: allowlist CORS only applies to configured origins', async () => {
  // Need a fresh server instance to pick up env var at middleware construction time.
  await new Promise((resolve) => server.close(resolve));
  db.close();

  process.env.ALLOWED_ORIGINS = 'https://allowed.example, https://another.example';
  delete require.cache[require.resolve('../src/server')];
  delete require.cache[require.resolve('../src/db')];
  app = require('../src/server');

  // Re-open db via require (server uses it).
  // eslint-disable-next-line global-require
  const reopenedDb = require('../src/db');

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;

  const allowed = await fetch(`${base}/api/health`, { headers: { Origin: 'https://allowed.example' } });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://allowed.example');

  const denied = await fetch(`${base}/api/health`, { headers: { Origin: 'https://denied.example' } });
  assert.equal(denied.status, 200);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);

  reopenedDb.close();
});
