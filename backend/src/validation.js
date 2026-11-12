// Request validation for PATCH /api/tasks/:id.
// Spec: ENH-01 Design Spec section 4.2.3 (validation rules), 4.2.1 (error details shape).

// Maximum title length, measured in Unicode code points (not UTF-16 code units), so an emoji or any
// other astral character counts as one. A ZWJ emoji sequence counts once per code point it contains.
const TITLE_MAX_LENGTH = 200;

// C0 controls (U+0000-U+001F), DEL and C1 controls (U+007F-U+009F). A title is a single line, so
// newline and tab are rejected too when they sit inside the title. Only leading/trailing whitespace
// (what String.prototype.trim() strips, e.g. \n, \t, \r) is trimmed first. Other controls (NUL, BEL, DEL,
// U+0085) are not whitespace to trim(), so they are rejected even at the start or end.
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/;

// Invisible characters that render as nothing: ZERO WIDTH SPACE, NON-JOINER, JOINER, WORD JOINER, BOM,
// and variation selectors (U+FE00-U+FE0F, U+E0100-U+E01EF). Used only to detect a title with no visible
// content; they stay legal inside a real title (a ZWJ is part of many emoji sequences, a ZWNJ is needed
// in some scripts, and FE0F turns a base character like a heart into its emoji form). A selector with
// no visible base character is what makes a title empty.
const INVISIBLE_CHARS = /[\u200B-\u200D\u2060\uFEFF\uFE00-\uFE0F\u{E0100}-\u{E01EF}]/gu;

// True when nothing visible is left after dropping whitespace, control and zero-width characters.
function isEffectivelyEmpty(title) {
  return title.replace(INVISIBLE_CHARS, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim() === '';
}

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

  if (Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string') {
      details.push({ field: 'title', issue: 'must be a string' });
    } else {
      const title = body.title.trim();
      if (isEffectivelyEmpty(title)) {
        details.push({ field: 'title', issue: 'must not be empty' });
      } else if (CONTROL_CHARS.test(title)) {
        details.push({ field: 'title', issue: 'must not contain control characters' });
      } else if ([...title].length > TITLE_MAX_LENGTH) {
        details.push({ field: 'title', issue: `must be at most ${TITLE_MAX_LENGTH} characters` });
      } else {
        value.title = title;
      }
    }
  }

  if (Object.hasOwn(body, 'status')) {
    if (typeof body.status !== 'string' || !TASK_STATUSES.includes(body.status)) {
      details.push({ field: 'status', issue: `must be one of: ${TASK_STATUSES.join(', ')}` });
    } else {
      value.status = body.status;
    }
  }

  return { value, details };
}

module.exports = { TITLE_MAX_LENGTH, TASK_STATUSES, PATCHABLE_FIELDS, validateTaskPatch };
