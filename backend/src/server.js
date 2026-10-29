const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

app.delete('/api/tasks/:id', (req, res) => {
  const info = db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'task not found' });
  }
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
