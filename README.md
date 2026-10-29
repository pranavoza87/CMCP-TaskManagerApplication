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
| DELETE | `/api/tasks/:id` | -                          | `204`, or `404` if not found |

Quick check:

```bash
curl -X POST localhost:4000/api/tasks -H "Content-Type: application/json" -d '{"title":"Hello"}'
curl localhost:4000/api/tasks
```

## Troubleshooting

- `better-sqlite3` normally installs a prebuilt binary. If it falls back to compiling, install
  Python and the Visual Studio C++ Build Tools (Windows), or use a Node LTS version with prebuilds.
