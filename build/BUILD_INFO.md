# Build Info (EPMCDMETST-72136)

- Timestamp (UTC): 2026-11-17T08:56:58Z
- Base commit: 16ae9607baa30cbd14582ccc53f68c0d1c4a3784 (origin/main)
- Node: v22.18.0, npm: 10.9.3
- Note: frontend/dist is gitignored, so the artifact is not committed; regenerate with the commands below.

## Commands
```
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm test --prefix backend      # 65 tests, 65 pass, 0 fail
npm run build                  # vite build -> frontend/dist (32 modules)
```

## Output
- dist/index.html 0.41 kB, assets/index-CIpWniYf.css 0.70 kB, assets/index-BO7cSaIx.js 146.25 kB (gzip 47.29 kB)

## Local launch verification
- Backend: node backend/src/server.js -> http://localhost:4000/api/health 200, /api/tasks 200
- Frontend: vite dev on http://localhost:5173/ 200, proxy /api/tasks 200
