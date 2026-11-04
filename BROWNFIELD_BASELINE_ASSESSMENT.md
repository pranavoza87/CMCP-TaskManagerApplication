# Brownfield Baseline Assessment

## 1. Assessment Metadata

- **Repository name:** `task-manager-capstone` (git remote `origin`: `https://github.com/pranavoza87/CMCP-TaskManagerApplication.git`). The GitHub repository name differs from the local folder name.
- **Assessment date:** 2026-11-04 (system date at time of assessment). The single commit is dated 2026-10-29.
- **Assessed branch:** `main`, at commit `886aaa9` ("Initial commit: task manager app with Express backend and React frontend"). It is the only commit. `git status --short` showed no tracked or unignored changes.
- **Assessment method:** Static review of files only. No application code, tests, or builds were executed, and no servers were started. Runtime behaviour described below is **inferred from source code and framework behaviour, not observed**.
- **Scope (in):** All 17 git-tracked files in `task-manager-capstone/`, plus untracked-but-present artifacts (`frontend/dist/index.html`, `backend/tasks.db*` file listing only, `.gitignore`d paths), and the parent folder `CodeMie Capstone Project/`.
- **Exclusions / not inspected:**
  - `node_modules/` (root, backend, frontend) contents. Versions were read from the `package-lock.json` files only.
  - Contents of `backend/tasks.db`, `tasks.db-shm` and `tasks.db-wal`. Opening them with SQLite could checkpoint the WAL and modify the files, so only their existence and sizes were checked. Stored data is **Not evidenced in repository**.
  - Minified bundles in `frontend/dist/assets/`. They are git-ignored build output, and only `dist/index.html` was read.
  - `.git` internals, other than read-only `git` queries (branch, log, status, ls-files, remote).
  - `../.claude/settings.local.json` (parent folder, outside the git repo). It was read and contains only local Claude Code permission rules and a git identity. It is not part of the application.
  - `../.codemie/` (parent folder) is an empty directory.
- **Note on repository root:** The folder `CodeMie Capstone Project/` is **not** a git repository. The git root, and the location of this report, is `task-manager-capstone/`.

## 2. Application Purpose

- **Business purpose:** A minimal Task Manager for viewing, adding and deleting tasks. `README.md` calls it a "Brownfield Scaffold", and `package.json` describes it as "Basic Task Manager: Express + SQLite backend, React (Vite) frontend". No product requirements document or backlog exists in the repository.
- **Intended users:** Not evidenced in repository. There is no user, role, authentication or tenancy concept in code or docs.
- **Current functional scope:**
  - List all tasks, newest first.
  - Create a task with a title. The API also accepts an optional `status`, which the UI never sends.
  - Delete a task.
  - Show a read-only status label per task.
  - Show a single error message line for failed API calls.
  - Show a "No tasks yet." message when the list is empty.
  - Explicitly absent: editing, status change, completion, search/filter, due dates, priorities, users, authentication.

## 3. Technology Inventory

Versions are those resolved in the `package-lock.json` files. The declared range from `package.json` is in parentheses.

| Layer | Technology | Version | Evidence File(s) | Purpose |
|---|---|---|---|---|
| Language (frontend) | JavaScript + JSX (ES modules) | n/a | `frontend/package.json` (`"type": "module"`), `frontend/src/*.jsx` | UI source. TypeScript: Not evidenced in repository. |
| Language (backend) | JavaScript (CommonJS `require`) | n/a | `backend/src/server.js`, `backend/src/db.js` | API source |
| Runtime | Node.js | README: "18+ (developed on 22)". Not pinned (no `engines`, `.nvmrc`). Local env during assessment: v22.18.0 | `README.md`, `package.json` | Backend runtime and build tooling |
| Frontend framework | React / react-dom | 18.3.1 (`^18.3.1`) | `frontend/package.json`, `frontend/package-lock.json` | UI rendering. Hooks only (`useState`, `useEffect`). |
| Frontend build | Vite | 5.4.21 (`^5.4.10`) | `frontend/package.json`, `frontend/vite.config.js` | Dev server (port 5173), `/api` proxy, production bundle |
| Frontend build plugin | @vitejs/plugin-react | 4.7.0 (`^4.3.3`) | `frontend/package.json`, `frontend/vite.config.js` | JSX/Fast Refresh |
| Styling | Plain CSS, a single file | n/a | `frontend/src/styles.css` | Layout and look. No CSS framework or UI library evidenced. |
| Backend framework | Express | 4.22.3 (`^4.21.0`) | `backend/package.json`, `backend/src/server.js` | REST API, JSON body parsing |
| Backend middleware | cors | 2.8.6 (`^2.8.5`) | `backend/package.json`, `backend/src/server.js:8` | CORS with default (allow-all) config |
| Database | SQLite (embedded, file-based) | Engine version bundled with better-sqlite3; not determined | `backend/src/db.js` | Persistence |
| DB driver | better-sqlite3 | 11.10.0 (`^11.5.0`) | `backend/package.json`, `backend/src/db.js` | Synchronous SQLite access. Native module; README troubleshooting notes build tools. |
| Dev orchestration | concurrently | 9.2.5 (`^9.0.0`) | `package.json` | Runs API and web UI together (`npm run dev`) |
| Dev tooling (backend) | `node --watch` | Node built-in | `backend/package.json` (`dev` script) | Auto-restart in development |
| Package management | npm, `lockfileVersion` 3 | npm 10.9.3 locally | `package.json`, `backend/package-lock.json`, `frontend/package-lock.json`, root `package-lock.json` | Three independent installs (no `workspaces` field). `install:all` script installs all three. |
| Testing | Not evidenced in repository | n/a | No test files, framework, or `test` script in any `package.json` | n/a |
| Linting | Not evidenced in repository | n/a | No ESLint config or dependency | n/a |
| Formatting | Not evidenced in repository | n/a | No Prettier/EditorConfig | n/a |
| Type checking | Not evidenced in repository | n/a | No `tsconfig`, no TS dependency | n/a |
| CI/CD | Not evidenced in repository | n/a | No `.github/`, no pipeline files | n/a |
| Containerization | Not evidenced in repository | n/a | No Dockerfile or compose file | n/a |
| Source control hosting | GitHub (remote only) | n/a | `git remote -v` | Remote repository |
| External integrations | None evidenced | n/a | `backend/package.json` and source contain no third-party service clients | n/a |
| Environment config | `PORT`, `DB_PATH` env vars (no dotenv library) | n/a | `backend/src/server.js:6`, `backend/src/db.js:4`, `README.md` | Runtime overrides. `.env` is git-ignored, but nothing loads it. |

## 4. Repository Structure

```
CodeMie Capstone Project/                (NOT a git repo)
├── .claude/settings.local.json          Local Claude Code permission rules (not application code)
├── .codemie/                            Empty directory
└── task-manager-capstone/               GIT ROOT (branch main)
    ├── .gitignore                       Ignores node_modules/, dist/, *.db, *.db-shm, *.db-wal, .env
    ├── README.md                        Setup, structure, API table, troubleshooting
    ├── BROWNFIELD_BASELINE_ASSESSMENT.md  This report
    ├── package.json / package-lock.json   Root scripts (install:all, dev, dev:backend, dev:frontend, build, start); devDependency concurrently
    ├── backend/
    │   ├── package.json / package-lock.json   Backend deps and scripts (start, dev)
    │   ├── src/
    │   │   ├── db.js                    Opens SQLite file, sets WAL mode, creates `tasks` table if missing, exports the connection
    │   │   └── server.js                Express app: cors, json parser, 3 routes under /api/tasks, listen on PORT (default 4000)
    │   └── tasks.db, tasks.db-shm, tasks.db-wal   Runtime SQLite files (git-ignored, untracked)
    └── frontend/
        ├── package.json / package-lock.json   Frontend deps and scripts (dev, build, preview)
        ├── vite.config.js               React plugin, port 5173, proxy /api -> http://localhost:4000
        ├── index.html                   HTML shell (lang="en", viewport meta, #root, loads /src/main.jsx)
        ├── src/
        │   ├── main.jsx                 React root with StrictMode, imports styles
        │   ├── App.jsx                  Only UI component: add form, error line, task list, empty message
        │   ├── api.js                   fetch wrapper: getTasks, addTask, deleteTask
        │   └── styles.css               All styling
        └── dist/                        Built output (git-ignored, untracked). Only index.html and assets/ present.
```

Not present: test folders, `.github/`, Dockerfile, ESLint/Prettier configs, `.env*`, `docs/`, additional frontend components or routes.

## 5. Existing Functional Capabilities

| ID | Capability | User Flow | UI Evidence | API/Backend Evidence | Persistence Evidence | Notes |
|---|---|---|---|---|---|---|
| CAP-01 | List tasks | Open the page and the list loads automatically. | `App.jsx:14-16` (`useEffect` calls `load`), `:56-66` (renders title, status, Delete button per row) | `GET /api/tasks`, `server.js:11-14` | `SELECT id, title, status FROM tasks ORDER BY id DESC` | Newest first. No pagination, filtering or sorting options. |
| CAP-02 | Add task | Type a title and press Add or Enter. The input clears and the list reloads. | `App.jsx:45-52` (form), `:18-29` (`handleAdd`) | `POST /api/tasks`, `server.js:16-24`, `api.js:14-19` | `INSERT INTO tasks (title, status) VALUES (?, ?)` | Whitespace-only input is silently ignored client-side (`App.jsx:20`). The server also trims and rejects an empty title (400). The UI never sends `status`, so every UI-created task is `todo`. |
| CAP-03 | Delete task | Click Delete on a row. The row disappears after the list reloads. | `App.jsx:61-63` (button with `aria-label`), `:31-39` (`handleDelete`) | `DELETE /api/tasks/:id`, `server.js:26-32`, `api.js:21` | `DELETE FROM tasks WHERE id = ?` | No confirmation and no undo. On a 404 the error is shown but the list is not reloaded (`load()` is skipped when `deleteTask` throws), so a stale row can remain. |
| CAP-04 | Display task status (read-only) | Status text is shown in uppercase beside each title. | `App.jsx:60`, `styles.css:43-47` | Returned by `GET` | `status TEXT NOT NULL DEFAULT 'todo'` | Display only. No UI or API to change status after creation. Values other than `todo` are Not evidenced in repository (no enumerated set is defined anywhere). |
| CAP-05 | Create task with explicit status (API only) | API client supplies `{"title","status"}`. | None (UI does not send `status`) | `server.js:21-23` (`req.body.status \|\| 'todo'`), `README.md` API table | Stored as given | Status value is not validated (see Section 7). |
| CAP-06 | Error feedback | A failed list/add/delete call shows the server's `error` message, or `Request failed (<status>)`. | `App.jsx:54` (`<p className="error">`), `api.js:3-10` | 400 and 404 JSON bodies with an `error` field | n/a | A single shared message. It is cleared only at the start of add or delete, not after a successful list load. |
| CAP-07 | Empty-state message | "No tasks yet." appears when the list is empty. | `App.jsx:67` | n/a | n/a | Also shown before the first load completes and when the initial load fails (no loading flag). |
| CAP-08 | Automatic DB initialization | The first start creates the DB file and `tasks` table. | n/a | `db.js:4-15`; `README.md` ("created automatically on first start") | `CREATE TABLE IF NOT EXISTS tasks ...`, WAL mode | There is no migration mechanism. `IF NOT EXISTS` will not alter an existing table. |
| CAP-09 | Combined dev workflow | `npm run dev` starts API (4000) and Vite (5173). Vite proxies `/api`. | `frontend/vite.config.js` | `package.json` scripts | n/a | The proxy target is hard-coded to port 4000, so setting `PORT` breaks the dev proxy (see ENH-08). |

## 6. API Inventory

Base: Express app on `PORT` (default 4000). All routes are in `backend/src/server.js`. These are the only routes defined. No other routes, static serving, or health endpoint exist.

| Method | Endpoint | Request Contract | Success Response | Error Handling | Source Evidence |
|---|---|---|---|---|---|
| GET | `/api/tasks` | No body or params. | `200` JSON array `[{id, title, status}]` ordered by `id DESC`. An empty array if none. | No explicit handling. A DB exception would fall to Express's default error handler. | `server.js:11-14`; `README.md` |
| POST | `/api/tasks` | JSON body `{ "title": string (required), "status"?: any truthy value }`. The `Content-Type: application/json` header is needed for the body to be parsed. | `201` JSON `{id, title (trimmed), status}`. `status` defaults to `'todo'` if falsy or missing. | `400 {"error":"title is required"}` if `title` is not a string or is empty after trim. **No validation of `status`.** No title length limit. | `server.js:16-24`; `README.md` |
| DELETE | `/api/tasks/:id` | Path param `id`, passed to SQL as a string. No numeric validation. | `204` no body. | `404 {"error":"task not found"}` when no row was deleted, including non-numeric ids. | `server.js:26-32`; `README.md` |

Behaviours inferred from static reading (not executed):
- There is no custom error-handling middleware. Malformed JSON bodies are rejected by `express.json()` and handled by Express's default handler, which returns an HTML or plain error rather than the `{error}` JSON shape the frontend expects. `api.js:6` tolerates this with `.catch(() => ({}))` and falls back to `Request failed (<status>)`.
- A `status` value of an unbindable type (object, array, boolean `true`) would make the `better-sqlite3` `.run()` call throw. With no try/catch, that becomes a default `500`. A numeric `status` would be accepted and stored as text.
- Unknown routes return Express's default 404.
- There are no `PUT`/`PATCH`, `GET /api/tasks/:id`, query parameters, pagination, or authentication.

## 7. Data Model Inventory

| Entity/Table | Fields | Data Types/Constraints | Relationships | Source Evidence |
|---|---|---|---|---|
| `tasks` | `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | None (the only table; no foreign keys) | `backend/src/db.js:9-15` |
| | `title` | `TEXT NOT NULL` | | |
| | `status` | `TEXT NOT NULL DEFAULT 'todo'` | | |

**Database-level constraints present:**
- Primary key with autoincrement.
- `NOT NULL` on `title` and `status`.
- Default `'todo'` for `status`.
- WAL journal mode (`db.js:7`).

**Database-level constraints absent:**
- `CHECK` on `status`, so no allowed-value set is enforced.
- Non-empty or length limit on `title`. An empty string satisfies `NOT NULL`.
- Indexes beyond the primary key.
- Timestamps (`created_at`, `updated_at`), description, due date, priority, owner/user columns.
- Migrations or schema versioning.

**Application-level validation present:**
- `POST` requires `title` to be a string that is non-empty after `trim()` (`server.js:17-20`).
- The client skips submit when the trimmed title is empty (`App.jsx:20`).

**Application-level validation absent:**
- `status` value or type is not checked (`server.js:21`).
- `title` maximum length is not checked, and the `<input>` has no `maxLength`.
- `DELETE :id` format is not checked.
- Duplicate titles are allowed.

**Data content:** Existing rows in `backend/tasks.db` were not inspected. The existence and sizes of the `.db`, `-shm` and `-wal` files indicate the app has been run locally. Seed data and fixtures: Not evidenced in repository.

## 8. Frontend and UX Baseline

**Screens / components:** One page, one component (`App` in `App.jsx`), mounted by `main.jsx` under `React.StrictMode`.
- Heading "Task Manager".
- Add form (text input and Add button).
- Conditional error paragraph.
- Task list (`<ul>`), one `<li>` per task with title, status label and Delete button.
- Conditional empty message.

There is no routing, shared component library, global state, or other screens.

**User actions available:**
- Add a task.
- Delete a task.
- View the list.

No edit, complete, filter, sort or search is available.

**Form validation behaviour:**
- Whitespace-only or empty title: submit is silently ignored. There is no message and no `required` attribute.
- Server-side 400 for empty titles is displayed through the error line if it is reached.
- No max length and no duplicate check.
- The Add button is not disabled during submission, so double submission is possible.

**Error / loading / empty states:**
- **Error:** One `<p class="error">` (colour `#b00020`). It has no `role="alert"` or `aria-live`. After a failed initial load it persists until the next add or delete.
- **Loading:** Not evidenced in repository. There is no loading indicator or flag.
- **Empty:** "No tasks yet." (`.empty`, colour `#777`). Because there is no loading state, it also appears during the initial fetch and after a failed load.
- **Success feedback:** None beyond the list refreshing.

**Responsiveness evidence:**
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">` in `index.html`.
- `.container` has `max-width: 600px` with auto margins, and the form and list rows use flexbox.
- No media queries. No overflow or wrapping rules for long titles are evidenced in `styles.css`. Behaviour on small screens was not tested.

**Accessibility evidence:**
- Present: `<html lang="en">`, semantic elements (`main`, `h1`, `form`, `ul`/`li`, `button`), and a per-row Delete button with `aria-label="Delete <title>"`.
- Absent:
  - The text input has no `<label>` or `aria-label` (placeholder only).
  - Error messages are not announced to assistive technology.
  - No custom focus styles.
  - Colour contrast was not audited.
  - Keyboard flow was not tested.
- Automated accessibility testing: Not evidenced in repository.

**Hard-coded or incomplete UI behaviour:**
- The status label is rendered but cannot be changed. The UI never sends `status`, so only `todo` appears for UI-created tasks.
- Hard-coded `/api/tasks` base path (`api.js:1`). This works through the Vite dev proxy, but nothing serves the built `dist/` together with the API (see Section 9, Build).
- Delete has no confirmation.
- After add and delete, the whole list is re-fetched; the POST response is ignored.
- Inline styles and theming: none. A single hard-coded colour set in CSS.

## 9. Engineering Quality Baseline

| Category | Current State | Evidence | Risk/Impact |
|---|---|---|---|
| Unit testing | None. No framework, test files or `test` script. | No test files in `git ls-files`; no test deps in any `package.json` | Any change is unverified. This is the largest gap for AI-assisted development. |
| Integration testing | None | Same | API contract (status codes, validation) is not protected from regression. |
| End-to-end testing | None | Same | UI-to-API flow is verified only manually. |
| Testability of existing code | `server.js` calls `app.listen()` at import time and does not export `app`. `db.js` opens the DB at `require` time (a `DB_PATH` env override exists). | `server.js:34-36`, `db.js:4-5` | Tests must either start the server as a process with a temporary `DB_PATH` or the code must be restructured. This affects how test work is scoped. |
| Code quality / linting | No linter, no type checking | No ESLint/TS config or dependencies | Style and error drift go undetected. |
| Formatting | No formatter config. Existing code is consistent (2-space indent, single quotes, semicolons) by convention only. | No Prettier/EditorConfig | Low risk today. Could drift with multiple contributors or assistants. |
| Error handling | Partial. Explicit 400 and 404 JSON errors. No try/catch around DB calls and no global error middleware. The frontend wraps calls in try/catch and shows one message. | `server.js`, `App.jsx`, `api.js` | Unexpected input can yield default 500/HTML responses. Delete 404 leaves a stale UI row. |
| Input validation | Title only (server and client). `status`, `id` and title length are unvalidated. | `server.js:17-21`, `db.js:12-13` | Arbitrary strings can be stored as `status`. This blocks reliable status workflows. |
| Security | No authentication or authorization. CORS is open to all origins (`cors()` with defaults). No security headers or rate limiting. Queries use parameterized statements (SQL injection mitigated). React escapes rendered text. `.env` and `*.db` are git-ignored. | `server.js:8,12,17-27`, `.gitignore` | Acceptable for a local demo. Unsuitable for exposure beyond localhost. Target deployment and users: Not evidenced in repository. |
| Logging / observability | One startup `console.log`. No request or error logging, no health endpoint, no metrics. | `server.js:35` | Failures are hard to diagnose. |
| Environment config & secrets | `PORT` and `DB_PATH` via `process.env` with defaults. No `.env.example`. No secrets in the repository. The Vite proxy target is hard-coded. | `server.js:6`, `db.js:4`, `vite.config.js:9`, `README.md` | `PORT` override breaks the dev proxy. Env vars are documented only in README prose. |
| Build process | The root `build` script builds only the frontend (`vite build`). `start` runs only the backend. Nothing in the backend serves `frontend/dist`. The backend has no build step. | `package.json` scripts, `server.js`, `frontend/dist/index.html` | There is no documented single-process production run path. Whether production deployment is intended: Not evidenced in repository. |
| CI/CD | None | No `.github/` or pipeline config | No automated quality gate on pushes. |
| Containerization | None | No Dockerfile or compose file | No reproducible runtime. |
| Dependency management | npm with committed lockfiles (v3) for root, backend and frontend. Caret ranges. No `engines` field. No automated dependency update or audit configuration. | `package.json` files, lockfiles | Reproducible installs. `better-sqlite3` is a native module that may need build tools (README notes this). |
| Documentation | One README: setup, structure, API table, curl examples, troubleshooting. README matches the code (3 endpoints, env vars, proxy). No testing, architecture, contribution or deployment docs, no `.env.example`, no CHANGELOG. | `README.md` | Adequate for setup. Insufficient for onboarding contributors or later SDLC stages. |
| Accessibility | Basic semantics and one `aria-label`. The input is unlabeled, errors are not announced, and there are no focus styles. No testing. | `App.jsx`, `index.html`, `styles.css` | Partial. Keyboard and screen-reader use is degraded. |

## 10. Confirmed Gaps and Enhancement Opportunities

| ID | Category | Confirmed Gap / Problem | Evidence | Proposed Enhancement | Business Value | Technical Scope | Priority (Must/Should/Could) | Dependencies/Risks |
|---|---|---|---|---|---|---|---|---|
| ENH-01 | Functional | Tasks cannot be updated. A `status` column and label exist, but there is no update route and no UI control, so every UI-created task stays `todo`. | `server.js` (only GET/POST/DELETE); `App.jsx:60` (read-only label); `api.js` (no update call) | Add `PATCH /api/tasks/:id` to change status, plus a UI control per task (for example, a select or toggle). Optional: allow title editing. | Turns the app from a list into a working task tracker. | Backend: 1 route and prepared statement. Frontend: a control and an `api.js` function. Docs: README API table. | Must | Needs the allowed status set defined (ENH-03). Related schema change is covered in ENH-12. |
| ENH-02 | Quality Engineering | No automated tests of any kind. The app is hard to test as written because `server.js` starts listening on import and does not export `app`. | No test files or scripts; `server.js:34-36`; `db.js:4-5` | Add backend API tests (temp `DB_PATH`) and frontend component tests, with a root `npm test` script. A minimal `app` export or start-in-process helper may be needed. | Regression safety for all later changes, and for assistant-generated code. | Test runner choice (Not evidenced; to be decided). About 10-20 tests covering the 3 current routes plus new behaviour, and the add/delete/list UI flows. | Must | A small refactor of `server.js` may be required. It must not change behaviour. |
| ENH-03 | Security | Input is minimally validated. `status` accepts any truthy value and type, titles have no length limit, and `:id` is unchecked. There is no error middleware, so unexpected input can yield default 500/HTML responses. | `server.js:17-23`, `db.js:12-13` | Validate `status` against an allowed set (and type), limit title length, and add a JSON error handler that returns `{error}`. Optionally add a DB `CHECK` constraint. | Data integrity and predictable API contract. | Backend validation helper and error middleware. Possibly a schema change. Tests for 400 cases. | Should | The status set is a product decision (Section 12). A DB `CHECK` requires a table migration (ENH-12). |
| ENH-04 | User Experience | No loading state. The empty message shows during the initial fetch and after a failed load. The error persists until the next action. Whitespace-only submit gives no feedback. The Add button can be double-submitted. | `App.jsx:5-7,14-16,18-22,54,67` | Add a loading flag, show the empty state only after a successful load, clear the error on a successful load, disable Add while submitting, and add inline validation feedback. | Less confusing, more trustworthy UI. | Frontend only (`App.jsx`, `styles.css`). | Should | None significant. Easier if tests exist (ENH-02). |
| ENH-05 | User Experience | Accessibility gaps. The input has no label, errors are not announced, there is no focus styling, and Delete has no confirmation. | `App.jsx:46-50,54,61`; `styles.css` | Add a visible or `aria-label` label, `role="alert"` on errors, focus-visible styles, and a delete confirmation or undo. | Usability for keyboard and screen-reader users. Lower risk of accidental deletion. | Frontend markup and CSS. | Should | Contrast and keyboard behaviour need a manual audit first (not evidenced). |
| ENH-06 | Maintainability | No linting or formatting tooling. | No ESLint/Prettier config or dependencies | Add ESLint and Prettier with `lint` and `format` scripts for backend and frontend, and apply them once. | Consistent style and early detection of bugs. | Dev dependencies, config files, scripts. A one-time formatting diff. | Should | Rule choices are a team decision. Adds dev dependencies. |
| ENH-07 | DevOps | No CI. Quality can't be gated on push, though the code is hosted on GitHub. | No `.github/`; `git remote -v` | Add a GitHub Actions workflow that runs install, lint, test and frontend build on push and pull request. | Automated quality gate and an auditable SDLC trail. | One workflow file. Node version choice (README says 18+, developed on 22). | Should | Meaningful only after ENH-02 (and ideally ENH-06). `better-sqlite3` native install on the CI runner is Not evidenced as tested. |
| ENH-08 | DevOps | The production/run path is incomplete and inconsistent. `build` and `start` are separate and nothing serves `frontend/dist`. The Vite proxy hard-codes port 4000 and ignores `PORT`. There is no Dockerfile. | `package.json` scripts; `server.js`; `vite.config.js:9` | Serve `frontend/dist` from Express (or document an alternative), make the proxy target configurable, and optionally add a Dockerfile. | Reproducible run and deploy. Removes a configuration trap. | Small Express static-serving change and config. Optional Dockerfile. | Could | Deployment target is unknown (Section 12). |
| ENH-09 | Documentation | Documentation covers setup only. There is no testing or contribution guide, no `.env.example`, and no `engines` declaration. Env vars are described only in README prose. | `README.md`; absence of `.env.example` and `engines` | Expand the README (scripts, testing, env vars, API contract with error shapes) and add `.env.example` and `engines`. | Faster onboarding. Better inputs for downstream assistants. | Docs and small config. | Could | Should follow the code changes so it stays accurate. |
| ENH-10 | Functional | The list is unfiltered and unpaginated. There is no creation timestamp or other task metadata, and ordering is by `id` only. | `server.js:12`; `db.js:9-15` | Add filter by status (and optionally search or sort). Optionally add a `created_at` column. | Usable once task counts grow. | Backend query parameters, frontend filter control, possible schema change. | Could | Depends on ENH-01 and ENH-03 (meaningful statuses). A schema change needs ENH-12. |
| ENH-11 | Security | CORS is open to all origins, there is no authentication, and there are no security headers or rate limiting. | `server.js:8`; no auth code | At minimum, restrict CORS origins via configuration and add basic hardening middleware. Authentication only if the intended use requires it. | Reduces exposure if the API is ever hosted beyond localhost. | Small middleware and config change. | Could | Whether exposure is planned is Not evidenced. Full auth would be out of proportion for this baseline. |
| ENH-12 | Maintainability | Schema is created inline with `CREATE TABLE IF NOT EXISTS`, with no migration or versioning. Any new column or constraint will not apply to an existing `tasks.db`. | `db.js:9-15`; `.gitignore` excludes `*.db` | Introduce a minimal versioned migration step (for example, `PRAGMA user_version` with ordered SQL statements) before changing the schema. | Safe schema evolution without deleting local data. | Small `db.js` change plus tests. | Could | Required if ENH-03 (CHECK) or ENH-10 (`created_at`) change the schema. Skippable if ENH-01 needs no schema change. |

## 11. Recommended Capstone Scope

### Primary functional enhancement: Task status update

- **Enhancement ID(s):** ENH-01, with the status-allowlist portion of ENH-03.
- **Why suitable for a short solo capstone:**
  - It builds on an existing, unused `status` column, so it needs no new table.
  - It is a single vertical slice (route, API client, UI control) that touches every layer.
  - It has clear acceptance criteria.
- **Expected frontend work:**
  - Add `updateTaskStatus` to `api.js`.
  - Add a per-task status control in `App.jsx`, with simple CSS.
  - Reuse the existing error line.
- **Expected backend/database work:**
  - Add `PATCH /api/tasks/:id` accepting a status from a defined set.
  - Return 400 for an invalid status or body and 404 for an unknown id.
  - Apply the same allowlist on `POST`.
  - The schema can stay unchanged (a DB `CHECK` is optional and would need ENH-12).
- **Expected testing work:**
  - API tests for success, invalid status, unknown id and `POST` with a status.
  - A component test for changing status.
- **Expected documentation work:**
  - Update the README API table and status values.
  - Update this assessment's status set once decided.
- **Key implementation risk:**
  - The status vocabulary is undefined in the repository (only `todo` is evidenced). It must be fixed up front (for example `todo`, `in-progress`, `done`), as a team or product decision.
  - Existing rows may contain arbitrary status strings (unknown, because the DB was not inspected).
- **Explicit out-of-scope items:**
  - Title editing.
  - Filtering, search and sorting (ENH-10).
  - Authentication, users and permissions.
  - Schema migration framework (ENH-12).
  - Deployment and Docker.

### Supporting quality/technical enhancement: Automated test foundation

- **Enhancement ID(s):** ENH-02 (optionally ENH-06 if time allows).
- **Why suitable:**
  - The app is tiny (about 270 lines), so a meaningful test suite is achievable quickly.
  - It de-risks the primary feature and gives the QA stage of the SDLC concrete artifacts.
- **Expected frontend work:**
  - Add a component test setup (runner, DOM test utilities).
  - Test list, add, delete and status-change flows with a mocked `fetch`.
- **Expected backend/database work:**
  - Allow tests to run against a temporary DB via the existing `DB_PATH`.
  - Make a minimal, behaviour-preserving change so the server can be started or imported in tests (for example, export `app` and listen only when run directly).
- **Expected testing work:**
  - Backend integration tests for GET, POST, DELETE and PATCH, including error cases.
  - Frontend tests as above.
  - A root `npm test` script.
- **Expected documentation work:**
  - Add a "Testing" section to the README.
- **Key implementation risk:**
  - Restructuring `server.js` for testability must not change behaviour.
  - The test-tool choice is open; keep it minimal. The `better-sqlite3` native build on a developer machine is a known risk (README troubleshooting).
- **Explicit out-of-scope items:**
  - Browser E2E suites.
  - Coverage thresholds.
  - Performance and load testing.
  - Accessibility test automation.

### Optional stretch enhancement: GitHub Actions CI

- **Enhancement ID(s):** ENH-07.
- **Why suitable:**
  - It is a single workflow file, once tests exist.
  - A GitHub remote is already evidenced.
  - It demonstrates the build/CI stage of the SDLC.
- **Expected frontend work:** None beyond ensuring `npm run build` works in CI.
- **Expected backend/database work:** None.
- **Expected testing work:** Run the ENH-02 tests, and ENH-06 lint if done, in CI.
- **Expected documentation work:** README CI badge or note.
- **Key implementation risk:**
  - Native `better-sqlite3` install on the runner.
  - Node version alignment: README says 18+ and development was on 22, with no pin.
  - Requires repository push access and a push, which is a user decision.
- **Explicit out-of-scope items:**
  - CD or deployment.
  - Containerization (ENH-08).
  - Security scanning and release automation.

## 12. Assumptions, Unknowns, and Questions

**Not evidenced in repository (cannot be verified):**
- Intended users, personas, business owner or product requirements.
- The allowed or intended set of `status` values beyond the default `todo`.
- Contents and row count of `backend/tasks.db`. Existing rows may carry statuses not produced by the UI.
- Runtime behaviour. Nothing was executed, so the following are inferred from code and framework behaviour: the default-handler responses for malformed JSON and unbindable `status` types, whether the frontend `dist/` bundle matches the current source, and how the UI renders long titles or small screens.
- Whether `npm run install:all`, `npm run dev`, `npm run build` succeed on a clean machine.
- Target deployment environment or hosting, production usage, or any exposure beyond localhost.
- Any tests, linting, formatting, CI, containerization, or monitoring (confirmed absent from tracked files, but possibly kept elsewhere, such as outside this repository).
- The SQLite engine version bundled in `better-sqlite3@11.10.0`.
- Supported browsers, accessibility conformance targets (such as WCAG level), and colour contrast ratios.
- Security requirements, data sensitivity, and compliance constraints.
- Whether the GitHub remote has branch protection, issues, or workflows configured remotely (only the local `git remote` was checked).
- Whether the parent-folder items `.claude/settings.local.json` and the empty `.codemie/` are relevant to the capstone tooling.

**Assumptions made in this report:**
- The git root `task-manager-capstone/` is "the repository". The parent folder is treated as a workspace wrapper.
- "Assessment date" uses the system date (2026-11-04). Commit timestamps show 2026-10-29.
- Versions are those resolved in the lockfiles. Actually installed `node_modules` versions were not cross-checked.

**Questions for stakeholders:**
1. What status vocabulary should tasks use (for example `todo`, `in-progress`, `done`)?
2. Should existing database rows be preserved or normalized when statuses are constrained?
3. Is the capstone expected to remain localhost-only, or deployed (which would raise ENH-08 and ENH-11)?
4. Is a specific test tooling or CI platform mandated by the capstone programme?
5. Are title editing, due dates or priorities expected in scope?

## 13. Evidence Index

| File / Location | Sections informed |
|---|---|
| `task-manager-capstone/README.md` | 2, 3, 5, 6, 9, 10, 12 |
| `task-manager-capstone/package.json` | 3, 4, 5, 9, 10 |
| `task-manager-capstone/package-lock.json` (versions queried programmatically) | 3, 9 |
| `task-manager-capstone/.gitignore` | 3, 4, 7, 9, 10 |
| `task-manager-capstone/backend/package.json` | 3, 4, 9 |
| `task-manager-capstone/backend/package-lock.json` (versions queried programmatically) | 3, 9 |
| `task-manager-capstone/backend/src/server.js` | 5, 6, 7, 9, 10, 11 |
| `task-manager-capstone/backend/src/db.js` | 3, 5, 7, 9, 10, 11 |
| `task-manager-capstone/backend/tasks.db`, `tasks.db-shm`, `tasks.db-wal` (listing and sizes only; contents not read) | 1, 4, 7, 12 |
| `task-manager-capstone/frontend/package.json` | 3, 4, 9 |
| `task-manager-capstone/frontend/package-lock.json` (versions queried programmatically) | 3, 9 |
| `task-manager-capstone/frontend/vite.config.js` | 3, 4, 5, 9, 10 |
| `task-manager-capstone/frontend/index.html` | 4, 8 |
| `task-manager-capstone/frontend/src/main.jsx` | 4, 8 |
| `task-manager-capstone/frontend/src/App.jsx` | 5, 8, 9, 10 |
| `task-manager-capstone/frontend/src/api.js` | 5, 6, 8, 10 |
| `task-manager-capstone/frontend/src/styles.css` | 5, 8, 10 |
| `task-manager-capstone/frontend/dist/index.html` (assets not read) | 4, 8, 9, 12 |
| `task-manager-capstone/node_modules/` (directory listing only) | 3, 4 |
| Git metadata via read-only commands: branch, `log`, `status --short`, `ls-files`, `remote -v` | 1, 3, 4, 9, 10 |
| Searches for `.github`, `.env*`, ESLint, Prettier, Dockerfile, test/spec files, `.nvmrc`, `.editorconfig` (none found) | 3, 4, 9, 10, 12 |
| `.claude/settings.local.json` (parent folder; outside git repo) | 1, 4, 12 |
| `.codemie/` (parent folder; empty) | 1, 4, 12 |
| Local `node --version` / `npm --version` (v22.18.0 / 10.9.3) | 3 |
