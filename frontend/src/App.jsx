import { useEffect, useRef, useState } from 'react';
import { getTasks, addTask, updateTask, deleteTask } from './api.js';

// Same limit and measure as the API: 200 characters, counted in code points (an emoji is one).
// The native maxLength attribute counts UTF-16 code units, so the limit is applied here instead.
const TITLE_MAX_LENGTH = 200;
const clampTitle = (value) => {
  const chars = [...value];
  return chars.length > TITLE_MAX_LENGTH ? chars.slice(0, TITLE_MAX_LENGTH).join('') : value;
};

// One list row with inline title editing (ENH-01, spec 5.1 / 5.3).
// Enter or Save commits, Escape or Cancel discards. Server errors stay next to the input.
function TaskItem({ task, onSaved, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const inputRef = useRef(null);
  const composingRef = useRef(false); // true while an IME composition is in progress
  const errorId = `edit-error-${task.id}`;
  const editButtonRef = useRef(null);
  const wasEditing = useRef(false);
  // Set synchronously so two quick submits (Enter + Enter, or Enter + Save click) send one request.
  const inFlight = useRef(false);
  // Save/Cancel are swapped in place for Edit/Delete; ignore double-click and just-after-edit clicks.
  const leftEditAt = useRef(-Infinity);
  const justLeftEdit = () => performance.now() - leftEditAt.current < 600;
  const isStrayClick = (e) => e.detail > 1 || justLeftEdit();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (wasEditing.current) {
      leftEditAt.current = performance.now();
      editButtonRef.current?.focus();
    }
    wasEditing.current = editing;
  }, [editing]);

  // After a failed save, put focus back on the input (a click on Save may have moved it).
  useEffect(() => {
    if (editing && !saving && editError) {
      inputRef.current?.focus();
    }
  }, [editing, saving, editError]);

  const startEdit = (e) => {
    if (isStrayClick(e)) return;
    setDraft(task.title);
    setEditError('');
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setEditError('');
  };

  const save = async () => {
    if (inFlight.current) return;
    if (draft.trim() === task.title) {
      cancel();
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setEditError('');
    try {
      await updateTask(task.id, { title: draft });
      setEditing(false);
      await onSaved();
    } catch (err) {
      setEditError(err.message);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.repeat) return;
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
            // Clamp only outside IME composition (clamping mid-composition disturbs the IME); the
            // compositionend handler clamps afterwards. A clamp that truncates moves the cursor to the end.
            onChange={(e) => setDraft(composingRef.current ? e.target.value : clampTitle(e.target.value))}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(e) => {
              composingRef.current = false;
              setDraft(clampTitle(e.target.value));
            }}
            onKeyDown={handleKeyDown}
            aria-label={`Edit title for ${task.title}`}
            aria-invalid={editError ? 'true' : undefined}
            aria-describedby={editError ? errorId : undefined}
            aria-busy={saving}
            readOnly={saving}
          />
          <span id={errorId} className="error" aria-live="polite">
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
          <button
            onClick={(e) => {
              if (isStrayClick(e)) return;
              onDelete(task.id);
            }}
            aria-label={`Delete ${task.title}`}
          >
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
