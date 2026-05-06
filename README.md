# Whisperwind Grove

![Whisperwind Grove logo](frontend/public/assets/grove-logo.png)

**Whisperwind Grove** is a full-stack browser mini-game platform built around cozy play, persistent progression, AI-assisted interaction, and character voice synthesis. The platform includes four playable games, a dashboard, user profiles, achievements, leaderboards, settings, background audio, and MongoDB-backed game history.

The project is organized as a TypeScript monorepo with a Vite + React frontend and an Express + Mongoose backend.

![Whisperwind Grove preview](frontend/public/assets/whisperwind-grove.jpg)

## Games

| Game | Summary |
| --- | --- |
| **Spirit Drift** | Phaser arcade game where players guide a wind spirit, collect drifting sprites, build combos, and chase high scores. |
| **Delivery on the Wind** | Timed delivery game with Kiki-inspired movement, package matching, fastest-time tracking, and delivery leaderboard data. |
| **Spirit Sapling** | Nurturing game where players grow a sacred tree with water, sunlight, guardian speech, and Gemini-powered sapling chat. |
| **Rise of the Half Moon** | Three-level moon-phase card placement strategy game inspired by Google's Half Moon card game, with local or Gemini-assisted AI. |

## Core Features

- JWT authentication with password hashing.
- MongoDB-only persistence for users, sessions, scores, progress, and achievements.
- Game-specific leaderboards and player history.
- Achievement unlock system with animated frontend toasts.
- Profile customization with avatar upload, status, favorite music, favorite Steam games, and avatar builder.
- Settings for theme, background, music, sound, particles, reduced motion, and gameplay preferences.
- Background music per game, including `spirit-sapling.mp3`.
- Sound effects for Phaser games and Spirit Sapling nurturing actions.
- Gemini-backed gameplay:
  - Spirit Sapling chat classifies positive, negative, or neutral energy.
  - Positive sapling chat reduces recharge time by 4 seconds.
  - Negative sapling chat increases recharge time by 4 seconds.
  - Rise of the Half Moon can optionally request Gemini AI moves.
- ElevenLabs guardian voice synthesis with per-guardian voice IDs and settings.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Game engine | Phaser 3 |
| Styling | CSS variables, custom CSS, React style objects |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB |
| ODM | Mongoose |
| Auth | JWT, bcrypt |
| AI | Google Gemini |
| Voice | ElevenLabs Text-to-Speech |
| Audio | HTMLAudioElement, WebAudio API |
| Tooling | ESLint, TypeScript, Vite build |

## Monorepo Structure

```text
WW/
  frontend/
    public/assets/          # game art, music, UI, sprites, backgrounds
    src/
      components/           # shared UI and game wrappers
      games/                # game-specific React/Phaser modules
      game/                 # legacy/engine-level game code
      pages/                # dashboard pages
      lib/                  # API and audio helpers
      hooks/                # shared React hooks
      theme/                # font and theme tokens

  backend/
    src/
      app/                  # Express app/server bootstrap
      config/               # MongoDB connection
      core/                 # middleware and shared backend utilities
      models/               # Mongoose models
      modules/              # auth, scores, sessions, users, AI, TTS
      routes/               # API route composition
    scripts/                # seed scripts

  docs/                     # technical report and project documentation
```

## Architecture Overview

The frontend runs as a Vite single-page app. Authenticated users enter the dashboard shell, where they can launch games, view progress, edit settings, check achievements, and personalize their profile.

The backend exposes a REST API under `/api/v1`. It handles authentication, profile data, score/session submission, leaderboard queries, achievement evaluation, Gemini proxy calls, and ElevenLabs voice synthesis. API secrets stay server-side.

Vite proxies local development requests:

```ts
// frontend/vite.config.ts
server.proxy['/api']     = 'http://localhost:4000'
server.proxy['/uploads'] = 'http://localhost:4000'
```

## Local Setup

### 1. Install Dependencies

```bash
npm run bootstrap
```

This installs dependencies for both `frontend` and `backend`.

### 2. Configure Backend Environment

Create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

Minimum required values:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/whisperwind_grove?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
PORT=4000
NODE_ENV=development
```

Optional AI and voice values:

```env
GEMINI_API_KEY=

ELEVENLABS_API_KEY=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_VOICE_ID_DEER=
ELEVENLABS_VOICE_ID_FOX=
ELEVENLABS_VOICE_ID_KODAMA=
ELEVENLABS_VOICE_ID_MONONOKE=
```

Do not commit real API keys or database credentials.

### 3. Run the App

Run frontend and backend together:

```bash
npm run dev
```

Or run each side separately:

```bash
npm --prefix backend run dev
npm --prefix frontend run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`
- API base: `http://localhost:4000/api/v1`

### 4. Seed Optional Data

```bash
npm --prefix backend run seed
```

## Verification

Run these before submitting changes:

```bash
npm --prefix frontend run build
npm --prefix frontend run lint
cd backend && npx tsc --noEmit
```

The frontend build may warn about large chunks because the current app bundles several games and assets into one SPA. That warning is not a failed build.

## Important API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/v1/auth/register` | Create account |
| `POST /api/v1/auth/login` | Log in and receive JWT |
| `GET /api/v1/users/profile` | Fetch profile |
| `PUT /api/v1/users/profile` | Update profile |
| `POST /api/v1/users/profile/avatar` | Upload profile photo |
| `POST /api/v1/games/:slug/sessions` | Save game session |
| `POST /api/v1/games/:slug/scores` | Save score |
| `GET /api/v1/games/:slug/leaderboard` | Fetch leaderboard |
| `GET /api/v1/achievements/me` | Fetch unlocked achievements |
| `POST /api/v1/spirit-sapling/chat` | Gemini sapling chatbot |
| `POST /api/v1/tts/guardian` | ElevenLabs guardian speech |

## Audio and AI Setup Notes

Spirit Sapling uses:

- `frontend/public/assets/audio/music/spirit-sapling.mp3` for background music.
- WebAudio-generated SFX for water, sunlight, and soft guardian chimes.
- ElevenLabs for guardian speech.
- Gemini for sapling chat and energy classification.

If guardian voices sound generic, check the browser Network tab for `/api/v1/tts/guardian`.

Expected successful response:

- `Content-Type: audio/mpeg`
- `X-ElevenLabs-Voice-Id: <configured voice id>`
- `X-ElevenLabs-Model-Id: eleven_multilingual_v2`

If ElevenLabs fails, the app logs the backend error instead of falling back to generic browser speech.

## Persistence Model

Whisperwind Grove uses MongoDB through Mongoose. Game sessions store shared fields such as:

- `playerId`
- `username`
- `gameSlug`
- `score`
- `completed`
- `won`
- `completionTime`
- `createdAt`

Game-specific fields are also stored when relevant:

- Delivery completion time and package count.
- Spirit Sapling guardian, growth stage, water/sun/talk actions, fruit harvest, and harmony bonus.
- Half Moon level reached, card points, moon score, final player score, and winner.
- Spirit Drift score history.

## Project Status

The project currently supports:

- Four playable mini-games.
- MongoDB-backed accounts and progress.
- Score/session persistence.
- Dashboard progress and leaderboard pages.
- Profile and settings pages.
- Achievements with unlock feedback.
- Gemini and ElevenLabs integrations.

Planned future improvements include expanded game levels, multiplayer/co-op events, deeper guardian customization, richer accessibility settings, stronger automated testing, seasonal challenges, and more advanced AI companion behavior.

## Useful Commands

```bash
# Install frontend and backend deps
npm run bootstrap

# Run both apps
npm run dev

# Frontend only
npm --prefix frontend run dev

# Backend only
npm --prefix backend run dev

# Production frontend build
npm --prefix frontend run build

# Lint frontend
npm --prefix frontend run lint

# Backend typecheck
cd backend && npx tsc --noEmit
```

## Credits

Whisperwind Grove was created as a capstone-style full-stack game platform by Ayse Sule Ekiz. It combines custom browser gameplay, persistent backend systems, AI interaction, voice synthesis, and a cohesive visual/audio identity.
