# Whisperwind Grove

Whisperwind Grove is a small game workspace built around calm, nature-themed mini-games. The current playable experience is Spirit Drift, a browser game where players catch drifting wind spirits across a soft, animated scene. The project is organized as a pnpm workspace with a React and Phaser frontend and a lightweight Express backend.

The main app lives in the [whisperwind-grove](/workspaces/WW/whisperwind-grove) directory.

## Overview

The project is structured as a mini-game hub:

- A selection screen presents multiple planned games.
- Spirit Drift is currently playable.
- Delivery on the Wind and Spirit Sapling are present as planned entries but are not implemented yet.
- The backend currently provides a minimal API that is suitable for health checks and future game data or session features.

## Current Features

- React-based mini-game selection UI
- Phaser-powered Spirit Drift gameplay
- Animated drifting spirit targets with score tracking
- 60-second timed round with restart flow
- Simple Express API with JSON responses
- Vite dev server with `/api` proxying to the backend

## Tech Stack

- Frontend: React 19, TypeScript, Vite
- Game engine: Phaser 3
- Backend: Node.js, Express
- Workspace tooling: pnpm workspaces, concurrently

## Repository Layout

```text
.
├── README.md
└── whisperwind-grove/
	├── package.json
	├── apps/
	│   ├── server/
	│   │   ├── package.json
	│   │   └── src/index.js
	│   └── web/
	│       ├── package.json
	│       ├── public/assets/
	│       └── src/
	│           ├── App.tsx
	│           ├── components/
	│           └── game/createGame.ts
	└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Node.js 20 or newer recommended
- pnpm installed globally

If pnpm is not installed:

```bash
npm install -g pnpm
```

### Install Dependencies

From the project workspace directory:

```bash
cd whisperwind-grove
pnpm install
```

### Start the Full Project

```bash
pnpm dev
```

This starts both applications in parallel:

- Web app: `http://localhost:5173`
- API server: `http://localhost:4000`

The frontend is configured to proxy requests from `/api` to the backend during local development.

## Running Apps Individually

From [whisperwind-grove](/workspaces/WW/whisperwind-grove):

### Frontend Only

```bash
pnpm --filter ./apps/web dev
```

### Backend Only

```bash
pnpm --filter ./apps/server dev
```

## Available Scripts

### Workspace Scripts

From [whisperwind-grove/package.json](/workspaces/WW/whisperwind-grove/package.json):

- `pnpm dev`: starts the frontend and backend together

### Frontend Scripts

From [whisperwind-grove/apps/web/package.json](/workspaces/WW/whisperwind-grove/apps/web/package.json):

- `pnpm --filter ./apps/web dev`: runs the Vite dev server
- `pnpm --filter ./apps/web build`: builds the production frontend bundle
- `pnpm --filter ./apps/web lint`: runs ESLint
- `pnpm --filter ./apps/web preview`: previews the production build locally

### Backend Scripts

From [whisperwind-grove/apps/server/package.json](/workspaces/WW/whisperwind-grove/apps/server/package.json):

- `pnpm --filter ./apps/server dev`: starts the server with nodemon
- `pnpm --filter ./apps/server start`: starts the server with Node.js

## Gameplay Summary

Spirit Drift is the first implemented mini-game.

- Goal: catch as many drifting wind spirits as possible before time runs out
- Round length: 60 seconds
- Scoring: most spirits are worth 1 point; rare gold spirits are worth more
- Penalty: clicking empty space reduces the score
- Flow: start screen, active round, game-over state, restart

The game logic is primarily implemented in [whisperwind-grove/apps/web/src/game/createGame.ts](/workspaces/WW/whisperwind-grove/apps/web/src/game/createGame.ts).

## API Endpoints

The backend currently exposes two simple endpoints:

- `GET /api/health`: returns a basic health payload with a timestamp
- `GET /api/greeting`: returns a sample greeting message

See [whisperwind-grove/apps/server/src/index.js](/workspaces/WW/whisperwind-grove/apps/server/src/index.js) for the current API implementation.

## Frontend Structure

- [whisperwind-grove/apps/web/src/App.tsx](/workspaces/WW/whisperwind-grove/apps/web/src/App.tsx): top-level app routing between the selection screen and the playable game
- [whisperwind-grove/apps/web/src/components/GameSelectionScreen.tsx](/workspaces/WW/whisperwind-grove/apps/web/src/components/GameSelectionScreen.tsx): mini-game hub UI
- [whisperwind-grove/apps/web/src/components/SpiritDriftGame.tsx](/workspaces/WW/whisperwind-grove/apps/web/src/components/SpiritDriftGame.tsx): React wrapper for the Phaser game
- [whisperwind-grove/apps/web/src/components/gameData.ts](/workspaces/WW/whisperwind-grove/apps/web/src/components/gameData.ts): game card metadata and availability flags
- [whisperwind-grove/apps/web/src/game/createGame.ts](/workspaces/WW/whisperwind-grove/apps/web/src/game/createGame.ts): Phaser scene creation and gameplay behavior

## Assets

Visual assets are stored under [whisperwind-grove/apps/web/public/assets](/workspaces/WW/whisperwind-grove/apps/web/public/assets), including:

- backgrounds
- sprites
- thumbnails

## Known State Of The Project

- The project is in an early playable prototype stage.
- Only one mini-game is fully wired into the UI.
- The backend is intentionally minimal and does not yet store progress, scores, or player state.
- The game selection experience already anticipates expansion to additional mini-games.

## Troubleshooting

### `pnpm` command not found

Install pnpm globally:

```bash
npm install -g pnpm
```

### Frontend cannot reach the API

Check that the backend is running on port `4000`. The Vite config proxies `/api` requests to that port during development.

### Assets are missing in the game

Confirm that the expected files exist under [whisperwind-grove/apps/web/public/assets](/workspaces/WW/whisperwind-grove/apps/web/public/assets) and that the app is being served through Vite rather than opened directly as a static file.

## Next Development Areas

- Implement the remaining mini-games listed on the selection screen
- Add a stronger API layer for scores, settings, or saved progress
- Replace placeholder art and thumbnails with final assets
- Add tests for frontend interactions and backend endpoints
- Prepare a production deployment path for both apps