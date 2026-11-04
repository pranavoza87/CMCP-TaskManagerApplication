// Integration tests for PATCH /api/tasks/:id (ENH-01, spec 4.2.3 / 4.2.1 / 8.1).
// Uses only the built-in node:test runner and a throwaway SQLite file.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-test-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db'); // must be set before requiring the app

const app = require('../src/server');
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

const seed = (title = 'Original', status = 'todo') =>
  Number(db.prepare('INSERT INTO tasks (title, status) VALUES (?, ?)').run(title, status).lastInsertRowid);

const patch = async (id, body, opts = {}) => {
  const res = await fetch(`${base}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: opts.raw !== undefined ? opts.raw : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const row = (id) => db.prepare('SELECT id, title, status FROM tasks WHERE id = ?').get(id);

const assertValidation = (res, field, issuePart) => {
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.equal(typeof res.body.error.message, 'string');
  const detail = res.body.error.details.find((d) => d.field === field);
  assert.ok(detail, `expected a detail for ${field}`);
  if (issuePart) assert.match(detail.issue, issuePart);
};

// ---- Story EPMCDMETST-70518: edit title ----

test('updates the title and returns the updated task (200)', async () => {
  const id = seed();
  const res = await patch(id, { title: 'Renamed' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { id, title: 'Renamed', status: 'todo' });
  assert.deepEqual(row(id), { id, title: 'Renamed', status: 'todo' });
});

test('trims the title before saving', async () => {
  const id = seed();
  const res = await patch(id, { title: '   Padded   ' });
  assert.equal(res.status, 200);
  assert.equal(res.body.title, 'Padded');
});

test('rejects an empty or whitespace-only title (400) and does not change the row', async () => {
  const id = seed();
  assertValidation(await patch(id, { title: '' }), 'title', /empty/);
  assertValidation(await patch(id, { title: '   ' }), 'title', /empty/);
  assert.equal(row(id).title, 'Original');
});

test('accepts a title of exactly 200 chars and rejects 201', async () => {
  const id = seed();
  assert.equal((await patch(id, { title: 'a'.repeat(200) })).status, 200);
  assertValidation(await patch(id, { title: 'a'.repeat(201) }), 'title', /200/);
  assert.equal(row(id).title, 'a'.repeat(200));
});

test('counts the trimmed title against the 200 char limit', async () => {
  const id = seed();
  const res = await patch(id, { title: `  ${'a'.repeat(200)}  ` });
  assert.equal(res.status, 200);
  assert.equal(res.body.title.length, 200);
});

test('rejects a non-string title (400)', async () => {
  const id = seed();
  assertValidation(await patch(id, { title: 42 }), 'title', /string/);
});

// ---- Story EPMCDMETST-70519: edit status with validation ----

test('updates status to each allowed value', async () => {
  const id = seed();
  for (const status of ['in_progress', 'done', 'todo']) {
    const res = await patch(id, { status });
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { id, title: 'Original', status });
  }
});

test('rejects a status outside the enum (400), including the hyphenated form', async () => {
  const id = seed();
  assertValidation(await patch(id, { status: 'in-progress' }), 'status', /todo, in_progress, done/);
  assertValidation(await patch(id, { status: 'DONE' }), 'status');
  assertValidation(await patch(id, { status: '' }), 'status');
  assertValidation(await patch(id, { status: 5 }), 'status');
  assertValidation(await patch(id, { status: null }), 'status');
  assert.equal(row(id).status, 'todo');
});

test('updates title and status together', async () => {
  const id = seed();
  const res = await patch(id, { title: 'Both', status: 'done' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { id, title: 'Both', status: 'done' });
});

test('is atomic: a valid field is not applied when another field is invalid', async () => {
  const id = seed();
  const res = await patch(id, { title: 'Should not stick', status: 'bogus' });
  assertValidation(res, 'status');
  assert.deepEqual(row(id), { id, title: 'Original', status: 'todo' });
});

test('a status-only patch leaves the title untouched', async () => {
  const id = seed('Keep me');
  const res = await patch(id, { status: 'done' });
  assert.equal(res.body.title, 'Keep me');
});

test('leaves an existing legacy status alone when only the title is patched', async () => {
  const id = seed('Legacy', 'blocked');
  const res = await patch(id, { title: 'Legacy renamed' });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'blocked');
});

// ---- Shared contract: body shape, not found, errors ----

test('rejects an empty body (400)', async () => {
  const id = seed();
  assertValidation(await patch(id, {}), 'body');
});

test('rejects unknown fields (400), including id', async () => {
  const id = seed();
  assertValidation(await patch(id, { title: 'ok', priority: 'high' }), 'priority', /unknown/);
  assertValidation(await patch(id, { id: 999 }), 'id', /unknown/);
  assert.deepEqual(row(id), { id, title: 'Original', status: 'todo' });
});

test('rejects a non-object JSON body (400)', async () => {
  const id = seed();
  assertValidation(await patch(id, null, { raw: '[1,2]' }), 'body', /object/);
});

test('rejects malformed JSON with the error envelope (400)', async () => {
  const id = seed();
  assertValidation(await patch(id, null, { raw: '{bad' }), 'body', /JSON/);
});

test('returns 404 NOT_FOUND for an unknown id', async () => {
  const res = await patch(987654, { title: 'x' });
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
  assert.equal(typeof res.body.error.message, 'string');
});

test('returns 404 NOT_FOUND for a non-numeric id', async () => {
  const res = await patch('abc', { title: 'x' });
  assert.equal(res.status, 404);
  assert.equal(res.body.error.code, 'NOT_FOUND');
});

test('returns 500 INTERNAL_ERROR when the database fails', async (t) => {
  const id = seed();
  t.mock.method(console, 'error', () => {}); // silence the expected log line
  db.exec('ALTER TABLE tasks RENAME TO tasks_bak');
  try {
    const res = await patch(id, { title: 'x' });
    assert.equal(res.status, 500);
    assert.equal(res.body.error.code, 'INTERNAL_ERROR');
    assert.equal(typeof res.body.error.message, 'string');
    assert.doesNotMatch(JSON.stringify(res.body), /no such table|tasks/);
  } finally {
    db.exec('ALTER TABLE tasks_bak RENAME TO tasks');
  }
});

// ---- Review fixes: hostile bodies, ids, ordering, oversized payloads ----

test('rejects a body over 100kb with 413 and the error envelope', async () => {
  const id = seed();
  const res = await patch(id, { title: 'a'.repeat(150 * 1024) });
  assert.equal(res.status, 413);
  assert.equal(res.body.error.code, 'PAYLOAD_TOO_LARGE');
  assert.equal(typeof res.body.error.message, 'string');
  assert.equal(row(id).title, 'Original');
});

test('maps an unsupported Content-Encoding to 400 VALIDATION_ERROR and leaves the row unchanged', async () => {
  const id = seed();
  const res = await fetch(`${base}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'bogus' },
    body: JSON.stringify({ title: 'x' }),
  });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.equal(typeof body.error.message, 'string');
  assert.deepEqual(row(id), { id, title: 'Original', status: 'todo' });
});

test('maps an unsupported charset to 400 VALIDATION_ERROR and leaves the row unchanged', async () => {
  const id = seed();
  const res = await fetch(`${base}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=bogus' },
    body: JSON.stringify({ title: 'x' }),
  });
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.error.code, 'VALIDATION_ERROR');
  assert.equal(typeof body.error.message, 'string');
  assert.deepEqual(row(id), { id, title: 'Original', status: 'todo' });
});

test('does not reshape body-parser errors on other methods', async () => {
  const res = await fetch(`${base}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=bogus' },
    body: JSON.stringify({ title: 'x' }),
  });
  assert.equal(res.status, 415); // default Express handling, not the PATCH envelope
});

test('rejects __proto__ and constructor keys (400)', async () => {
  const id = seed();
  assertValidation(await patch(id, null, { raw: '{"__proto__":{"title":"x"}}' }), '__proto__', /unknown/);
  assertValidation(await patch(id, null, { raw: '{"constructor":{"prototype":{}}}' }), 'constructor', /unknown/);
  assert.deepEqual(row(id), { id, title: 'Original', status: 'todo' });
});

test('rejects a null title and a JSON null body (400)', async () => {
  const id = seed();
  assertValidation(await patch(id, { title: null }), 'title', /string/);
  assertValidation(await patch(id, null, { raw: 'null' }), 'body', /JSON|object/); // strict parser rejects a top-level null
  assert.deepEqual(row(id), { id, title: 'Original', status: 'todo' });
});

test('returns 404 for non-integer, zero, negative and huge ids', async () => {
  const id = seed();
  // Path segments are sent as written (already percent-encoded where needed).
  const badIds = [
    '1.5', '0', '-1', '99999999999999999999', '1e3', '%201',
    `${id}.5`, `${id}abc`, `${id}e0`, `-${id}`, `${id}%20`, `%20${id}`,
  ];
  for (const badId of badIds) {
    const res = await patch(badId, { title: 'x' });
    assert.equal(res.status, 404, 'id ' + badId);
    assert.equal(res.body.error.code, 'NOT_FOUND', 'id ' + badId);
  }
  assert.deepEqual(row(id), { id, title: 'Original', status: 'todo' });
});

test('returns 404 for an id padded with leading zeros and leaves the row unchanged', async () => {
  const id = seed();
  for (const padded of [`0${id}`, `00${id}`]) {
    const res = await patch(padded, { title: 'x' });
    assert.equal(res.status, 404, 'id ' + padded);
    assert.equal(res.body.error.code, 'NOT_FOUND', 'id ' + padded);
  }
  assert.deepEqual(row(id), { id, title: 'Original', status: 'todo' });
});

test('validation runs before the 404 check (invalid body on an unknown id is 400)', async () => {
  assertValidation(await patch(987654, {}), 'body');
  assertValidation(await patch(987654, { status: 'bogus' }), 'status');
  assertValidation(await patch('abc', { title: '' }), 'title');
});

// ---- Regression: existing routes keep their current behaviour ----

test('existing routes are unchanged (legacy error shape, POST still accepts any status)', async () => {
  const post = (body) =>
    fetch(`${base}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const created = await post({ title: 'Via POST', status: 'anything' });
  assert.equal(created.status, 201);
  assert.equal((await created.json()).status, 'anything');

  const bad = await post({ title: '' });
  assert.equal(bad.status, 400);
  assert.deepEqual(await bad.json(), { error: 'title is required' });

  const missing = await fetch(`${base}/api/tasks/987654`, { method: 'DELETE' });
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: 'task not found' });
});
