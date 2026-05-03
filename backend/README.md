# game-backend

Scaffold and conventions for the game backend.

Run locally:

```bash
# from repo root
npm --prefix game-backend run dev
```

Structure highlights:
- `src/app` - app factory and server entry
- `src/config` - env, db, logger
- `src/core` - errors, middleware, utils
- `src/modules` - feature modules (auth, users, games, ...)
- `src/routes` - aggregate routes mounted at `/api/v1`

This scaffold is minimal; expand controllers, services and repositories per module.
