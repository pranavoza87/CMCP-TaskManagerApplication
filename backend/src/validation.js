// Request validation for PATCH /api/tasks/:id.
// Spec: ENH-01 Design Spec section 4.2.3 (validation rules), 4.2.1 (error details shape).

const TITLE_MAX_LENGTH = 200;

// Allowed task statuses (spec 4.1.1 / 4.2.3, TSK-105). Enforced in the API layer only:
// SQLite cannot add a CHECK via ALTER, and existing rows are left untouched.
const TASK_STATUSES = ['todo', 'in_progress', 'done'];

// Fields a PATCH body may contain. Anything else is rejected (spec 4.2.3).
const PATCHABLE_FIELDS = ['title', 'status'];

/**
 * Validate a PATCH body.
 * Returns { value, details }: `value` holds the normalized fields to apply and
 * `details` is a list of { field, issue } entries (empty when the body is valid).
 */
function validateTaskPatch(body) {
  const details = [];
  const value = {};

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    details.push({ field: 'body', issue: 'must be a JSON object' });
    return { value, details };
  }

  const keys = Object.keys(body);
  if (keys.length === 0) {
    details.push({
      field: 'body',
      issue: `must include at least one of: ${PATCHABLE_FIELDS.join(', ')}`,
    });
    return { value, details };
  }

  for (const key of keys) {
    if (!PATCHABLE_FIELDS.includes(key)) {
      details.push({ field: key, issue: 'unknown field' });
    }
  }

  if ('title' in body) {
    if (typeof body.title !== 'string') {
      details.push({ field: 'title', issue: 'must be a string' });
    } else {
      const title = body.title.trim();
      if (!title) {
        details.push({ field: 'title', issue: 'must not be empty' });
      } else if (title.length > TITLE_MAX_LENGTH) {
        details.push({ field: 'title', issue: `must be at most ${TITLE_MAX_LENGTH} characters` });
      } else {
        value.title = title;
      }
    }
  }

  if ('status' in body) {
    if (typeof body.status !== 'string' || !TASK_STATUSES.includes(body.status)) {
      details.push({ field: 'status', issue: `must be one of: ${TASK_STATUSES.join(', ')}` });
    } else {
      value.status = body.status;
    }
  }

  return { value, details };
}

module.exports = { TITLE_MAX_LENGTH, TASK_STATUSES, PATCHABLE_FIELDS, validateTaskPatch };
