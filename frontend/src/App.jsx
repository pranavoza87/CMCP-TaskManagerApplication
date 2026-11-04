import { useEffect, useRef, useState } from 'react';
import { getTasks, addTask, updateTask, deleteTask } from './api.js';

// One list row with inline title editing (ENH-01, spec 5.1 / 5.3).
// Enter or Save commits, Escape or Cancel discards. Server errors stay next to the input.
function TaskItem({ task, onSaved, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const inputRef = useRef(null);
  const editButtonRef = useRef(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (wasEditing.current) {
      editButtonRef.current?.focus();
    }
    wasEditing.current = editing;
  }, [editing]);

  const startEdit = () => {
    setDraft(task.title);
    setEditError('');
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setEditError('');
  };

  const save = async () => {
    if (saving) return;
    if (draft.trim() === task.title) {
      cancel();
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      await updateTask(task.id, { title: draft });
      setEditing(false);
      await onSaved();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  return (
    <li>
      {editing ? (
        <span className="edit-field">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={`Edit title for ${task.title}`}
            aria-invalid={editError ? 'true' : undefined}
            disabled={saving}
          />
          <span className="error" aria-live="polite">
            {editError}
          </span>
        </span>
      ) : (
        <span>{task.title}</span>
      )}
      <span className="status">{task.status}</span>
      {editing ? (
        <>
          <button onClick={save} disabled={saving} aria-label={`Save title for ${task.title}`}>
            Save
          </button>
          <button onClick={cancel} disabled={saving} aria-label={`Cancel editing ${task.title}`}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <button ref={editButtonRef} onClick={startEdit} aria-label={`Edit ${task.title}`}>
            Edit
          </button>
          <button onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}>
            Delete
          </button>
        </>
      )}
    </li>
  );
}

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
          <TaskItem key={t.id} task={t} onSaved={load} onDelete={handleDelete} />
        ))}
      </ul>
      {tasks.length === 0 && <p className="empty">No tasks yet.</p>}
    </main>
  );
}
