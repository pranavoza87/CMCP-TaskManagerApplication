import { useEffect, useState } from 'react';
import { getTasks, addTask, deleteTask } from './api.js';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    getTasks()
      .then(setTasks)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setError('');
      await addTask(title);
      setTitle('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      await deleteTask(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="container">
      <h1>Task Manager</h1>

      <form onSubmit={handleAdd} className="add-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task title"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="task-list">
        {tasks.map((t) => (
          <li key={t.id}>
            <span>{t.title}</span>
            <span className="status">{t.status}</span>
            <button onClick={() => handleDelete(t.id)} aria-label={`Delete ${t.title}`}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <p className="empty">No tasks yet.</p>}
    </main>
  );
}
