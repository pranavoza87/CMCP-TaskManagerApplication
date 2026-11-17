# Deployment package

`task-manager-deploy-d440e32.zip` contains the production build and runtime files of the Task Manager app:
`frontend/dist/` (Vite build), `backend/src/`, `backend/package.json`, `backend/package-lock.json` and `MANIFEST.md`.
No node_modules, tests, .env files or databases are included. See `MANIFEST.md` for file list and SHA-256.

Deploy (Node 22):
1. `unzip task-manager-deploy-d440e32.zip -d task-manager && cd task-manager/backend`
2. `npm ci --omit=dev`
3. Set environment variables (all optional):
   - `PORT` (default 4000)
   - `DB_PATH` (SQLite file, default backend/tasks.db)
   - `ALLOWED_ORIGINS` (comma-separated CORS allowlist; unset allows all origins)
   - `TITLE_MAX_LENGTH` (max task title length, default 200)
4. Start: `node src/server.js`

Frontend: serve `frontend/dist` as static files (SPA fallback to index.html) with any web server
and proxy `/api` to the backend (e.g. http://localhost:4000).

Health check: `GET http://localhost:4000/api/health` returns `{"status":"ok"}`.
