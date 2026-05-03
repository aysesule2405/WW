# Whisperwind Grove (monorepo)

Top-level scripts convenience for the Whisperwind Grove monorepo.

Run both frontend and backend in development (concurrently):

```bash
npm run dev
```

Start backend only (wrapper forwards to existing project):

```bash
npm --prefix backend run dev
```

Start frontend only (wrapper forwards to existing web app):

```bash
npm --prefix frontend run dev
```

Migrate database and seed (runs the backend's migrate/seed scripts):

```bash
npm --prefix backend run migrate
npm --prefix backend run seed
```

Notes
- The repository has been reorganized: the backend and server were copied into `backend/`, and the web app was copied into `frontend/`.
- Backups of the originals were placed in `.move-backups/`.
- After confirming everything works you can remove the original folders or keep them as archival copies.
