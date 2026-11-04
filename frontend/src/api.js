const BASE = '/api/tasks';

// Error bodies are either the legacy `{ error: "text" }` or the ENH-01 envelope
// `{ error: { code, message, details } }` (spec 4.2.1). Always surface a readable message.
function errorMessage(body, status) {
  const err = body && body.error;
  if (typeof err === 'string' && err) return err;
  if (err && typeof err.message === 'string') {
    const issues = Array.isArray(err.details)
      ? err.details.map((d) => `${d.field} ${d.issue}`).join('; ')
      : '';
    return issues ? `${err.message}: ${issues}` : err.message;
  }
  return `Request failed (${status})`;
}

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(errorMessage(body, res.status));
  }
  return res.status === 204 ? null : res.json();
}

export const getTasks = () => request(BASE);

export const addTask = (title) =>
  request(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });

// ENH-01: patch is `{ title?, status? }` (spec 4.2.3).
export const updateTask = (id, patch) =>
  request(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });

export const deleteTask = (id) => request(`${BASE}/${id}`, { method: 'DELETE' });
