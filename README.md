# Task Manager (Brownfield Scaffold)

Express + SQLite backend and a React (Vite) frontend for viewing, adding and deleting tasks.

## Structure

```
task-manager-capstone/
├── package.json          # root scripts (install:all, dev, build, start)
├── backend/
│   ├── package.json
│   └── src/
│       ├── db.js         # SQLite connection + `tasks` table (id, title, status)
│       └── server.js     # Express REST API
└── frontend/
    ├── package.json
    ├── vite.config.js    # proxies /api -> http://localhost:4000
    ├── index.html
    └── src/ (main.jsx, App.jsx, api.js, styles.css)
```

## Prerequisites

- Node.js 18+ (developed on 22) and npm

## Setup

```bash
cd task-manager-capstone
npm run install:all     # installs root, backend and frontend dependencies
npm run dev             # starts API (4000) and web UI (5173) together
```

Open http://localhost:5173.

To run separately: `npm run dev:backend` and `npm run dev:frontend` in two terminals.

The SQLite file `backend/tasks.db` is created automatically on first start.
Override with `DB_PATH` and `PORT` environment variables.

## API

| Method | Path             | Body                       | Response                     |
|--------|------------------|----------------------------|------------------------------|
| GET    | `/api/tasks`     | -                          | `[{ id, title, status }]`    |
| POST   | `/api/tasks`     | `{ "title": "...", "status"?: "todo" }` | `201` created task |
| PATCH  | `/api/tasks/:id` | `{ "title"?, "status"? }`  | `200` updated task, `400`, `404`, `413` or `500` |
| DELETE | `/api/tasks/:id` | -                          | `204`, or `404` if not found |

Quick check:

```bash
curl -X POST localhost:4000/api/tasks -H "Content-Type: application/json" -d '{"title":"Hello"}'
curl localhost:4000/api/tasks
```

### PATCH /api/tasks/:id

Updates the title, the status, or both (ENH-01). The body must contain at least one of these fields;
unknown fields are rejected.

- `title`: string, trimmed, must not be empty, at most 200 characters.
- `status`: one of `todo`, `in_progress`, `done`.

Existing rows that hold any other status keep it until their status is patched. `POST /api/tasks`
does not yet restrict `status` (tracked as ENH-05).

Other rules:

- Validation runs before the lookup, so an invalid body sent to an unknown id returns `400`, not `404`.
- Ids are positive integers written without leading zeros (`/^[1-9]\d*$/`). Anything else, such as `1.5`,
  `0`, `-1`, `007`, `1e3`, an id with surrounding spaces or a very large id, returns `404`.
- A body larger than the default `express.json` limit (100kb) returns `413`.

Success returns `200` with the updated task `{ id, title, status }`. Errors on this route use this shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid request",
             "details": [{ "field": "status", "issue": "must be one of: todo, in_progress, done" }] } }
```

| HTTP | `code`             | When                                                              |
|------|--------------------|-------------------------------------------------------------------|
| 400  | `VALIDATION_ERROR` | Empty body, unknown field, invalid title or status, malformed JSON |
| 404  | `NOT_FOUND`        | No task with that id, or the id is not a canonical positive integer |
| 413  | `PAYLOAD_TOO_LARGE` | Request body is larger than 100kb                                |
| 500  | `INTERNAL_ERROR`   | Unexpected server error                                           |

The other routes keep their existing `{ "error": "text" }` shape for now.

```bash
curl -X PATCH localhost:4000/api/tasks/1 -H "Content-Type: application/json" -d '{"status":"in_progress"}'
```

## Testing

```bash
npm test --prefix backend   # node:test integration tests, temporary SQLite file, no extra dependencies
```

## Troubleshooting

- `better-sqlite3` normally installs a prebuilt binary. If it falls back to compiling, install
  Python and the Visual Studio C++ Build Tools (Windows), or use a Node LTS version with prebuilds.
