// Integration tests for POST /api/tasks status validation
// (EPMCDMETST-72162 / REQ-01; implementation 72163, tests 72164).
// Uses only the built-in node:test runner and a throwaway SQLite file.
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tasks-post-status-test-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db'); // must be set before requiring the app

const app = require('../src/server');
const db = require('../src/db');
const { TASK_STATUSES, validateTaskCreateStatus } = require('../src/validation');

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

const post = async (body) => {
  const res = await fetch(`${base}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

const count = () => db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n;
const row = (id) => db.prepare('SELECT id, title, status FROM tasks WHERE id = ?').get(id);

const EXPECTED_ERROR = { error: 'status must be one of: todo, in_progress, done' };

// ---- AC1: allowed statuses are accepted and persisted ----

for (const status of ['todo', 'in_progress', 'done']) {
  test(`accepts status "${status}" (201) and persists it`, async () => {
    const res = await post({ title: 'Task', status });
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Task');
    assert.equal(res.body.status, status);
    assert.equal(count(), 1);
    assert.equal(row(res.body.id).status, status);
  });
}

// ---- AC2: missing or falsy status defaults to "todo" ----

test('defaults status to "todo" when status is omitted (201)', async () => {
  const res = await post({ title: 'Task' });
  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'todo');
  assert.equal(row(res.body.id).status, 'todo');
});

for (const [label, value] of [
  ['null', null],
  ['empty string', ''],
  ['0', 0],
  ['false', false],
]) {
  test(`defaults status to "todo" when status is falsy (${label})`, async () => {
    const res = await post({ title: 'Task', status: value });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'todo');
    assert.equal(row(res.body.id).status, 'todo');
  });
}

// ---- AC3: invalid or non-string status is rejected with 400 and nothing is inserted ----

for (const [label, value] of [
  ['an unknown string', 'anything'],
  ['wrong case', 'DONE'],
  ['surrounding whitespace', ' done '],
  ['a hyphenated variant', 'in-progress'],
  ['a truthy number', 1],
  ['true', true],
  ['an object', { a: 1 }],
  ['an array', ['todo']],
  ['an empty array', []],
]) {
  test(`rejects status that is ${label} (400) and creates no task`, async () => {
    const before = count();
    const res = await post({ title: 'Task', status: value });
    assert.equal(res.status, 400);
    assert.deepEqual(res.body, EXPECTED_ERROR);
    assert.equal(count(), before);
  });
}

test('rejected POST does not add to a non-empty table (no-insert assertion)', async () => {
  const created = await post({ title: 'Existing', status: 'done' });
  assert.equal(created.status, 201);
  assert.equal(count(), 1);

  const rejected = await post({ title: 'Bad', status: 'anything' });
  assert.equal(rejected.status, 400);
  assert.equal(count(), 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM tasks WHERE title = 'Bad'").get().n, 0);
});

test('title validation still takes precedence and keeps its existing error', async () => {
  const res = await post({ title: '   ', status: 'anything' });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: 'title is required' });
});

test('invalid status error body matches the POST error shape ({ error: string })', async () => {
  const res = await post({ title: 'Task', status: 'anything' });
  assert.equal(typeof res.body.error, 'string');
  for (const s of TASK_STATUSES) assert.match(res.body.error, new RegExp(s));
});

// ---- Regression: POST and PATCH share one allowlist ----

test('PATCH still rejects an invalid status and accepts what POST accepts', async () => {
  const created = await post({ title: 'Task', status: 'in_progress' });
  const patch = (status) =>
    fetch(`${base}/api/tasks/${created.body.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

  assert.equal((await patch('anything')).status, 400);
  assert.equal(row(created.body.id).status, 'in_progress');
  for (const status of TASK_STATUSES) assert.equal((await patch(status)).status, 200);
});

// ---- Unit: shared validator ----

test('validateTaskCreateStatus: defaults, accepts and rejects', () => {
  for (const falsy of [undefined, null, '', 0, false]) {
    assert.deepEqual(validateTaskCreateStatus(falsy), { value: 'todo', error: null });
  }
  for (const s of TASK_STATUSES) {
    assert.deepEqual(validateTaskCreateStatus(s), { value: s, error: null });
  }
  for (const bad of ['anything', 1, true, {}, [], 'Todo']) {
    const r = validateTaskCreateStatus(bad);
    assert.equal(r.value, null);
    assert.equal(r.error, EXPECTED_ERROR.error);
  }
});
