// ── Half-Moon Asset Manifest ──────────────────────────────────────────────────
//
// All asset paths live here. Swap any PNG with your final art and the game
// picks it up automatically — no code changes needed.
//
// Card faces:      public/assets/cards/moon_01_new.png  …  moon_08_waning_crescent.png
// Card backs:      public/assets/cards/card_back_player.png  /  card_back_moon.png
// UI overlays:     public/assets/ui/player_glow.png  …  connection_invalid.png
// Scene assets:    public/assets/backgrounds/rise-of-the-half-moon/…

import type { Phase } from './data/halfMoonConfig'

const CARDS_BASE = '/assets/cards'
const UI_BASE    = '/assets/ui'

const SCENE_BASE = '/assets/backgrounds/rise-of-the-half-moon'

// ── Scene-level images ────────────────────────────────────────────────────────

export const GAME_BG_PATH     = `${SCENE_BASE}/Rise%20of%20the%20Half%20Moon%20background.png`
export const MOON_LOGO_PATH   = '/assets/game_bgs/rise-of-the-half-moon.png'
export const MOON_SMILE_PATH  = `${SCENE_BASE}/smiling-moon.png`
export const MOON_SAD_PATH    = `${SCENE_BASE}/sad-moon.png`

export const GAME_BG_KEY     = 'half-moon-game-bg'
export const MOON_LOGO_KEY   = 'half-moon-logo'
export const MOON_SMILE_KEY  = 'half-moon-moon-smile'
export const MOON_SAD_KEY    = 'half-moon-moon-sad'

export const GAME_BG_HTML    = `${SCENE_BASE}/Rise of the Half Moon background.png`
export const MOON_LOGO_HTML  = '/assets/game_bgs/rise-of-the-half-moon.png'

// ── Card face images ──────────────────────────────────────────────────────────

export const CARD_FACE_PATHS: Record<Phase, string> = {
  1: `${CARDS_BASE}/moon_01_new.png`,
  2: `${CARDS_BASE}/moon_02_waxing_crescent.png`,
  3: `${CARDS_BASE}/moon_03_first_quarter.png`,
  4: `${CARDS_BASE}/moon_04_waxing_gibbous.png`,
  5: `${CARDS_BASE}/moon_05_full.png`,
  6: `${CARDS_BASE}/moon_06_waning_gibbous.png`,
  7: `${CARDS_BASE}/moon_07_third_quarter.png`,
  8: `${CARDS_BASE}/moon_08_waning_crescent.png`,
}

export function cardFaceKey(phase: Phase): string {
  return `half-moon-card-face-${phase}`
}

// ── Card back images ──────────────────────────────────────────────────────────

export const CARD_BACK_PLAYER_PATH = `${CARDS_BASE}/card_back_player.png`
export const CARD_BACK_MOON_PATH   = `${CARDS_BASE}/card_back_moon.png`
export const CARD_BACK_PLAYER_KEY  = 'half-moon-back-player'
export const CARD_BACK_MOON_KEY    = 'half-moon-back-moon'

// ── UI overlay images ─────────────────────────────────────────────────────────

export const UI_ASSET_PATHS = {
  playerGlow:        `${UI_BASE}/player_glow.png`,
  moonGlow:          `${UI_BASE}/moon_glow.png`,
  connectionPlayer:  `${UI_BASE}/connection_player.png`,
  connectionMoon:    `${UI_BASE}/connection_moon.png`,
  connectionValid:   `${UI_BASE}/connection_valid.png`,
  connectionInvalid: `${UI_BASE}/connection_invalid.png`,
} as const

export const UI_ASSET_KEYS = {
  playerGlow:        'half-moon-ui-player-glow',
  moonGlow:          'half-moon-ui-moon-glow',
  connectionPlayer:  'half-moon-ui-conn-player',
  connectionMoon:    'half-moon-ui-conn-moon',
  connectionValid:   'half-moon-ui-conn-valid',
  connectionInvalid: 'half-moon-ui-conn-invalid',
} as const

// ── Preload helper — call inside Phaser scene.preload() ───────────────────────
//
// Missing files fail silently; the game falls back to procedural graphics.

export function preloadHalfMoonAssets(scene: Phaser.Scene) {
  // Scene backgrounds and moon faces
  scene.load.image(GAME_BG_KEY,    GAME_BG_PATH)
  scene.load.image(MOON_SMILE_KEY, MOON_SMILE_PATH)
  scene.load.image(MOON_SAD_KEY,   MOON_SAD_PATH)

  // Card faces
  const phases: Phase[] = [1, 2, 3, 4, 5, 6, 7, 8]
  for (const phase of phases) {
    scene.load.image(cardFaceKey(phase), CARD_FACE_PATHS[phase])
  }

  // Card backs
  scene.load.image(CARD_BACK_PLAYER_KEY, CARD_BACK_PLAYER_PATH)
  scene.load.image(CARD_BACK_MOON_KEY,   CARD_BACK_MOON_PATH)

  // UI overlays
  for (const [key, path] of Object.entries(UI_ASSET_PATHS)) {
    scene.load.image(UI_ASSET_KEYS[key as keyof typeof UI_ASSET_KEYS], path)
  }
}

export function cardFaceLoaded(scene: Phaser.Scene, phase: Phase): boolean {
  return scene.textures.exists(cardFaceKey(phase))
}
