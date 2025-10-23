# FC Masters Cup – Cursor Rules

CONTEXT:
- This is a PRODUCTION web app deployed on a Hostinger VPS under /var/www/fcmasters.
- Frontend: React+Vite in /client (build → /client/dist)
- Backend: Node/TS in /server (build → /server/dist), runs with PM2 as "fcmasters".
- DB: SQLite at /server/tournaments.sqlite (never delete or move in deploy).
- CI/CD: GitHub Actions on every push to branch "master" → rsync/tar to VPS → PM2 restart.

NEVER DO:
- Do NOT assume localhost or change URLs to http://localhost.
- Do NOT rename branches or workflows. Keep branch = master and workflow name Deploy.
- Do NOT change .github/workflows unless explicitly asked.
- Do NOT touch Nginx/PM2/DB paths unless explicitly asked.
- Do NOT remove Google OAuth or email flows without an explicit request.
- Do NOT add dotenv loading in production. Production env vars come from the server.

ALWAYS DO:
- Keep client build output in client/dist; server build output in server/dist.
- Use NODE_ENV to branch behavior: development vs production.
- Before proposing changes, respect: DB_PATH=./server/tournaments.sqlite, PM2 name=fcmasters, VPS path=/var/www/fcmasters.
- If any rule conflicts with a task, ASK before changing.
