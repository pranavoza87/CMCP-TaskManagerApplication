const express = require('express');
const cors = require('cors');
const db = require('./db');
const { validateTaskPatch } = require('./validation');

const app = express();
const PORT = process.env.PORT || 4000;

// --- ENH-17: Configurable CORS allowlist ---
// Default behaviour remains allow-all for local dev.
// When ALLOWED_ORIGINS is set (comma-separated), only those origins get CORS headers.
function parseAllowedOrigins(value) {
  if (!value || typeof value !== 'string') return null;
  const origins = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return origins.length ? new Set(origins) : null;
}

const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(
  cors({
    origin: (origin, cb) => {
      // Non-browser clients (curl, server-to-server) often omit Origin; allow them.
      if (!origin) return cb(null, true);

      // No allowlist configured => allow all (backwards compatible).
      if (!allowedOrigins) return cb(null, true);

      return cb(null, allowedOrigins.has(origin));
    },
  })
);

// --- ENH-15: Request logging ---
app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  next();
});

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

  // ENH-16: Server-side max title length validation.
  // Keep aligned with UI (frontend/src/App.jsx).
  const maxTitleLength = Number.parseInt(process.env.TITLE_MAX_LENGTH || '200', 10);
  if (Number.isFinite(maxTitleLength) && maxTitleLength > 0 && [...title].length > maxTitleLength) {
    return res.status(400).json({ error: `title must be at most ${maxTitleLength} characters` });
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

  // Ids are positive integers without leading zeros; anything else can never match a task.
  const id = /^[1-9]\d*$/.test(req.params.id) ? Number(req.params.id) : NaN;
  if (!Number.isSafeInteger(id)) {
    return sendError(res, 404, 'NOT_FOUND', 'Task not found');
  }

  // Column names come from the validator's fixed field list, never from user input.
  // A single UPDATE ... RETURNING (SQLite >= 3.35) updates and reads back atomically;
  // no returned row means no task has that id.
  const columns = Object.keys(value);
  const assignments = columns.map((c) => `${c} = ?`).join(', ');
  const task = db
    .prepare(`UPDATE tasks SET ${assignments} WHERE id = ? RETURNING id, title, status`)
    .get(...columns.map((c) => value[c]), id);
  if (!task) {
    return sendError(res, 404, 'NOT_FOUND', 'Task not found');
  }

  res.status(200).json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'task not found' });
  }
  res.status(204).end();
});

// ENH-14: basic health endpoint for operability checks
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ENH-15: Centralized error handler.
// IMPORTANT: Keep PATCH behaviour unchanged (it has a strict error envelope validated by tests),
// so PATCH errors are delegated to the existing scoped handler below.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (req.method === 'PATCH') return next(err);

  const clientStatus = err.status || err.statusCode;
  if (err.type === 'entity.parse.failed') {
    console.error(err);
    return res.status(400).json({ error: 'invalid JSON body' });
  }

  if (Number.isInteger(clientStatus) && clientStatus >= 400 && clientStatus < 500) {
    console.error(err);
    // Keep message generic to avoid leaking parser internals.
    // Preserve 415 from body-parser (e.g. unsupported charset/encoding).
    if (clientStatus === 415) return res.status(415).json({ error: 'unsupported media type' });

    return res.status(clientStatus === 413 ? 413 : 400).json({
      error: clientStatus === 413 ? 'request body is too large' : 'bad request',
    });
  }

  console.error(err);
  return res.status(500).json({ error: 'internal server error' });
});

// Scoped to PATCH only so existing routes keep their current behaviour (central handler is ENH-06).
// NOTE: This runs after the general ENH-15 handler; it will only run for PATCH if next(err) was called.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (req.method !== 'PATCH') return next(err);
  if (err.type === 'entity.parse.failed') {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request', [
      { field: 'body', issue: 'must be valid JSON' },
    ]);
  }
  // Other client errors raised by the body parser. 413 is an explicit extension to spec 4.2.1;
  // every other 4xx (unsupported charset or encoding, aborted request, ...) becomes a 400.
  const clientStatus = err.status || err.statusCode;
  if (Number.isInteger(clientStatus) && clientStatus >= 400 && clientStatus < 500) {
    if (clientStatus === 413) {
      return sendError(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
    }
    return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request', [
      { field: 'body', issue: 'could not be read' },
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
