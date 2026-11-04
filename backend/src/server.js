const express = require('express');
const cors = require('cors');
const db = require('./db');
const { validateTaskPatch } = require('./validation');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Error envelope for the PATCH route (ENH-01 spec 4.2.1). requestId is out of scope (ENH-15).
function sendError(res, httpStatus, code, message, details) {
  const error = { code, message };
  if (details && details.length) error.details = details;
  return res.status(httpStatus).json({ error });
}

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT id, title, status FROM tasks ORDER BY id DESC').all();
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }
  const status = req.body.status || 'todo';
  const info = db.prepare('INSERT INTO tasks (title, status) VALUES (?, ?)').run(title, status);
  res.status(201).json({ id: info.lastInsertRowid, title, status });
});

// ENH-01 (EPMCDMETST-70517): update a task. Spec 4.2.3, TSK-201/TSK-202.
app.patch('/api/tasks/:id', (req, res) => {
  const { value, details } = validateTaskPatch(req.body);
  if (details.length) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request', details);
  }

  // Ids are integers in this schema, so a non-integer id can never match a task.
  const id = /^\d+$/.test(req.params.id) ? Number(req.params.id) : NaN;
  if (!Number.isSafeInteger(id)) {
    return sendError(res, 404, 'NOT_FOUND', 'Task not found');
  }

  // Column names come from the validator's fixed field list, never from user input.
  const columns = Object.keys(value);
  const assignments = columns.map((c) => `${c} = ?`).join(', ');
  const info = db
    .prepare(`UPDATE tasks SET ${assignments} WHERE id = ?`)
    .run(...columns.map((c) => value[c]), id);
  if (info.changes === 0) {
    return sendError(res, 404, 'NOT_FOUND', 'Task not found');
  }

  const task = db.prepare('SELECT id, title, status FROM tasks WHERE id = ?').get(id);
  res.status(200).json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'task not found' });
  }
  res.status(204).end();
});

// Scoped to PATCH only so existing routes keep their current behaviour (central handler is ENH-06).
app.use((err, req, res, next) => {
  if (req.method !== 'PATCH') return next(err);
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request', [
      { field: 'body', issue: 'must be valid JSON' },
    ]);
  }
  console.error(err);
  return sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
});

// Only listen when run directly, so tests can import `app` (behaviour is unchanged for `npm start`).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
