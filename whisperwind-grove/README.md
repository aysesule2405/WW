# Whisperwind Grove

Run the full project locally (frontend + backend):

1. Install dependencies (pnpm recommended):

```bash
pnpm install
```

2. Start dev servers for all workspaces:

```bash
pnpm dev
```

This runs both the `apps/web` (Vite) and `apps/server` (Express) dev servers in parallel. The frontend proxies `/api` to the backend at `http://localhost:4000`.
