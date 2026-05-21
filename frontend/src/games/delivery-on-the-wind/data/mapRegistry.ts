import type { TileType, NpcId } from './deliveryConfig'

// ─── MapConfig ────────────────────────────────────────────────────────────────

export interface MapConfig {
  id:              string
  name:            string
  description:     string
  hint:            string
  accentColor:     string
  cardGradient:    string
  bg:              string
  emoji:           string
  available:       boolean
  gameDurationMs:  number
  cols:            number
  rows:            number
  tiles:           TileType[][]
  housePositions:  Array<{ col: number; row: number }>
  packagePositions: Array<{ col: number; row: number }>
  npcPositions:    Array<{ id: NpcId; col: number; row: number }>
  playerStart:     { col: number; row: number }
}

// ─── Village map ──────────────────────────────────────────────────────────────

const VILLAGE_TILES: TileType[][] = [
  ['water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','ocean_shore','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense'],
  ['water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','ocean_shore','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree_dense'],
  ['ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','grass','grass','grass','stone','fallen_leaves','tree','grass','grass','tree','grass','tree','tree','grass','fallen_leaves','tree','swamp','swamp','swamp','swamp','swamp','swamp','swamp','fallen_leaves','grass','grass','grass','grass','grass','grass','tree','fallen_leaves','fallen_leaves','fallen_leaves','stone','grass','tree','wildflowers','wildflowers','wildflowers','tree_dense'],
  ['tree_dense','fallen_leaves','fallen_leaves','bridge','tree_dense','tree_dense','tree_dense','bridge','stone','grass','grass','grass','fallen_leaves','grass','grass','grass','grass','grass','stone','tree','grass','grass','grass','wildflowers','grass','grass','grass','fallen_leaves','tree','swamp','swamp','swamp','swamp','grass','grass','stone','lavender','lavender','lavender','lavender','lavender','lavender','grass','grass','grass','grass','fallen_leaves','grass','grass','wildflowers','wildflowers','tree_dense'],
  ['tree','fallen_leaves','grass','bridge','tree_dense','tree_dense','tree_dense','bridge','grass','grass','tree','path','path','path','path','path','wildflowers','grass','grass','grass','grass','grass','grass','grass','stone','grass','grass','grass','grass','grass','grass','grass','grass','grass','fallen_leaves','lavender','lavender','lavender','lavender','lavender','lavender','lavender','lavender','grass','bridge','tree_dense','tree_dense','tree_dense','bridge','tree','fallen_leaves','tree'],
  ['tree_dense','tree','grass','bridge','tree_dense','tree_dense','tree_dense','bridge','grass','wildflowers','path','path','wildflowers','grass','wildflowers','path','path','path','path','path','fallen_leaves','grass','grass','grass','grass','grass','grass','grass','grass','grass','stone','wildflowers','wildflowers','wildflowers','lavender','lavender','lavender','path','path','path','path','path','grass','grass','bridge','tree_dense','tree_dense','tree_dense','bridge','fallen_leaves','grass','tree_dense'],
  ['tree_dense','grass','grass','bridge','bridge','bridge','bridge','bridge','path','path','path','path','tree','tree','tree','tree','tree','tree','tree','path','path','path','path','path','path','path','path','fallen_leaves','grass','grass','grass','fallen_leaves','grass','fallen_leaves','path','path','path','path','lavender','lavender','path','path','path','path','bridge','tree_dense','tree_dense','tree_dense','bridge','fallen_leaves','tree','tree_dense'],
  ['tree','grass','grass','grass','path','path','path','path','path','path','path','tree','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree','tree','tree','path','path','path','path','path','path','path','path','path','path','path','path','path','path','path','tree','tree','tree','tree','tree','tree','tree','wildflowers','path','bridge','bridge','bridge','bridge','bridge','stone','grass','tree'],
  ['tree_dense','grass','grass','path','wildflowers','grass','wildflowers','stone','wildflowers','grass','grass','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree','fallen_leaves','stone','tree','grass','grass','grass','grass','fallen_leaves','path','path','path','path','path','path','path','path','path','fallen_leaves','stone','tree','tree_dense','tree_dense','tree','tree','tree','tree','path','path','path','path','path','path','grass','grass','tree_dense'],
  ['tree_dense','grass','path','path','tilled_soil','tilled_soil','tilled_soil','tilled_soil','tilled_soil','grass','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree','swamp','swamp','tree','grass','fallen_leaves','tilled_soil','tilled_soil','tilled_soil','tilled_soil','fallen_leaves','path','path','fallen_leaves','grass','stone','grass','grass','grass','fallen_leaves','tree','tree','tree_dense','tree_dense','tree_dense','tree','tree','grass','grass','grass','path','wildflowers','fallen_leaves','grass','grass','tree_dense'],
  ['tree','grass','path','tilled_soil','crop_seedling','crop_seedling','crop_seedling','crop_seedling','tilled_soil','grass','grass','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree','swamp','swamp','tree','grass','tilled_soil','crop_seedling','crop_seedling','crop_seedling','tilled_soil','path','path','path','fallen_leaves','grass','grass','grass','grass','grass','grass','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree','tree','grass','grass','grass','path','path','grass','fallen_leaves','tree'],
  ['tree_dense','tree','path','tilled_soil','tilled_soil','tilled_soil','tilled_soil','tilled_soil','tree','grass','grass','tree','tree','tree','tree','tree_dense','tree','swamp','swamp','tree','grass','grass','tilled_soil','tilled_soil','tilled_soil','tree','path','path','path','grass','grass','grass','grass','grass','grass','fallen_leaves','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree','stone','tree','grass','grass','grass','path','fallen_leaves','tree','tree_dense'],
  ['tree_dense','fallen_leaves','stone','path','path','grass','grass','grass','grass','grass','fallen_leaves','grass','tree','tree','tree','tree','tree','tree','tree','grass','wildflowers','tree','wildflowers','grass','grass','path','path','path','stone','fallen_leaves','grass','grass','grass','fallen_leaves','tree','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree','tree','grass','wildflowers','grass','grass','fallen_leaves','path','grass','grass','tree_dense'],
  ['ocean_shore','ocean_shore','bridge','path','bridge','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','tree','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','bridge','bridge','path','path','path','bridge','bridge','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','tree','tree','tree','tree','tree','tree','tree','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','bridge','path','bridge','ocean_shore','ocean_shore'],
  ['water_alt','water','bridge','path','bridge','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','bridge','bridge','path','path','path','bridge','bridge','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','bridge','path','bridge','water','water_alt'],
  ['water','water_alt','bridge','path','bridge','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','bridge','bridge','path','path','path','bridge','bridge','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','water','water_alt','bridge','path','bridge','water_alt','water'],
  ['ocean_shore','ocean_shore','bridge','path','bridge','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','bridge','bridge','path','path','path','bridge','bridge','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','ocean_shore','bridge','path','bridge','ocean_shore','ocean_shore'],
  ['tree_dense','tree','fallen_leaves','path','swamp','swamp','swamp','swamp','swamp','swamp','swamp','swamp','grass','grass','grass','grass','grass','tree','grass','grass','grass','grass','grass','tree','fallen_leaves','path','path','fallen_leaves','grass','wildflowers','tree','grass','grass','grass','grass','grass','fallen_leaves','tree','tree','tree','fallen_leaves','swamp','swamp','swamp','swamp','swamp','swamp','swamp','path','grass','tree','tree_dense'],
  ['tree_dense','fallen_leaves','tree','path','swamp','swamp','swamp','swamp','swamp','swamp','swamp','grass','grass','grass','wildflowers','tree','fallen_leaves','grass','fallen_leaves','grass','wildflowers','grass','wildflowers','grass','grass','wildflowers','path','grass','grass','tilled_soil','tilled_soil','tilled_soil','grass','fallen_leaves','tree','tree','tree','tree','tree','tree','tree','stone','swamp','swamp','swamp','swamp','swamp','swamp','path','grass','stone','tree_dense'],
  ['tree','grass','grass','path','path','stone','wildflowers','grass','swamp','swamp','grass','grass','tree','tree','tree','tree','tree','tree','tree','grass','path','tilled_soil','tilled_soil','tilled_soil','tilled_soil','tilled_soil','path','path','tilled_soil','lavender','lavender','lavender','tilled_soil','tree','tree','tree','tree_dense','tree_dense','tree','tree','tree','tree','grass','swamp','swamp','swamp','swamp','swamp','path','fallen_leaves','grass','tree'],
  ['tree_dense','grass','grass','grass','path','path','grass','grass','grass','grass','grass','stone','tree','tree','tree','tree_dense','tree','wildflowers','grass','grass','tilled_soil','crop_bloom','crop_bloom','crop_bloom','crop_bloom','crop_bloom','path','path','lavender','lavender','lavender','lavender','lavender','grass','grass','fallen_leaves','tree','tree_dense','tree_dense','tree_dense','tree','tree','grass','grass','fallen_leaves','swamp','swamp','swamp','path','grass','grass','tree_dense'],
  ['tree_dense','stone','grass','fallen_leaves','path','fallen_leaves','grass','grass','grass','grass','grass','tree','stone','tree_dense','tree_dense','tree_dense','tree','wildflowers','wildflowers','grass','tilled_soil','tilled_soil','tilled_soil','tilled_soil','tilled_soil','stone','path','fallen_leaves','tilled_soil','tilled_soil','lavender','tilled_soil','tilled_soil','grass','grass','grass','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree','wildflowers','grass','grass','grass','stone','path','grass','grass','tree_dense'],
  ['tree','fallen_leaves','grass','grass','path','path','path','grass','wildflowers','grass','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','stone','wildflowers','tree','tree','grass','grass','grass','grass','path','path','path','grass','fallen_leaves','tilled_soil','grass','wildflowers','tree','wildflowers','stone','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree','grass','grass','grass','fallen_leaves','grass','path','path','grass','grass','tree'],
  ['tree_dense','grass','grass','wildflowers','grass','path','path','path','path','wildflowers','fallen_leaves','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree','tree','tree','path','path','path','path','path','fallen_leaves','path','path','path','path','path','path','path','tree','tree','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree','tree','path','path','path','path','path','wildflowers','grass','grass','grass','tree_dense'],
  ['tree_dense','grass','wildflowers','wildflowers','wildflowers','tree','path','path','path','path','path','tree','tree','tree_dense','tree_dense','tree_dense','tree_dense','tree_dense','tree','tree','path','path','path','path','path','path','path','path','path','path','path','path','path','path','tree','tree','tree','tree','tree','tree','tree','path','path','path','path','path','path','path','grass','fallen_leaves','grass','tree_dense'],
  ['tree','grass','grass','wildflowers','bridge','tree_dense','tree_dense','tree_dense','bridge','path','path','wildflowers','tree','tree','tree','tree','tree','tree','tree','stone','path','tree','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','fallen_leaves','path','path','tilled_soil','tilled_soil','tree','tilled_soil','tilled_soil','path','path','grass','bridge','tree_dense','tree_dense','tree_dense','bridge','grass','grass','fallen_leaves','tree'],
  ['tree_dense','tree','grass','grass','bridge','tree_dense','tree_dense','tree_dense','bridge','fallen_leaves','path','path','mushroom_patch','mushroom_patch','mushroom_patch','tree','mushroom_patch','mushroom_patch','mushroom_patch','path','path','fallen_leaves','wildflowers','grass','fallen_leaves','grass','wildflowers','grass','stone','grass','fallen_leaves','grass','tree','tilled_soil','path','tilled_soil','tilled_soil','tilled_soil','tilled_soil','path','path','tilled_soil','tilled_soil','bridge','tree_dense','tree_dense','tree_dense','bridge','grass','grass','tree','tree_dense'],
  ['tree_dense','swamp','stone','fallen_leaves','bridge','tree_dense','tree_dense','tree_dense','bridge','grass','grass','path','path','mushroom_patch','mushroom_patch','mushroom_patch','mushroom_patch','mushroom_patch','path','path','fallen_leaves','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','tilled_soil','path','path','path','path','path','path','crop_bloom','crop_bloom','tilled_soil','bridge','tree_dense','tree_dense','tree_dense','bridge','grass','fallen_leaves','wildflowers','tree_dense'],
  ['tree','swamp','swamp','grass','bridge','bridge','bridge','bridge','bridge','grass','grass','grass','path','path','path','path','path','path','path','tree','grass','grass','grass','grass','grass','grass','grass','tree','grass','grass','grass','grass','wildflowers','stone','tilled_soil','crop_bloom','crop_bloom','crop_bloom','crop_bloom','crop_bloom','crop_bloom','tilled_soil','stone','bridge','bridge','bridge','bridge','bridge','ocean_shore','ocean_shore','ocean_shore','ocean_shore'],
  ['tree_dense','swamp','swamp','swamp','grass','grass','grass','grass','grass','grass','grass','grass','grass','tree','stone','fallen_leaves','grass','grass','grass','grass','grass','grass','grass','grass','grass','tree','wildflowers','wildflowers','wildflowers','wildflowers','tree','grass','grass','grass','tilled_soil','tilled_soil','crop_bloom','crop_bloom','crop_bloom','crop_bloom','tilled_soil','tilled_soil','grass','grass','grass','grass','swamp','water_alt','water','water_alt','water','water_alt'],
  ['tree_dense','swamp','swamp','swamp','swamp','tree','stone','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','grass','tree','fallen_leaves','wildflowers','wildflowers','wildflowers','wildflowers','wildflowers','wildflowers','tree','grass','grass','grass','fallen_leaves','tilled_soil','tilled_soil','tilled_soil','tilled_soil','fallen_leaves','grass','grass','grass','grass','swamp','swamp','swamp','water_alt','water','water_alt','water'],
  ['tree_dense','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','tree_dense','tree','tree_dense','swamp','swamp','water','water_alt','water','water_alt','water','water_alt'],
]

export const VILLAGE_MAP: MapConfig = {
  id:           'village',
  name:         'Village Round',
  description:  'Wind-swept paths through the grove village. Cross the river bridges and deliver to each cottage.',
  hint:         'Use the bridges — stepping off the path into swamp will slow you down.',
  accentColor:  '#ADC178',
  cardGradient: 'linear-gradient(145deg, rgba(10,22,8,0.96) 0%, rgba(20,38,12,0.96) 100%)',
  bg:           `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url('/assets/backgrounds/delivery-on-the-wind/game-bg.png') center/cover no-repeat`,
  emoji:        '🏡',
  available:    true,
  gameDurationMs: 120_000,
  cols:  52,
  rows:  32,
  tiles: VILLAGE_TILES,
  housePositions: [
    { col: 4,  row: 3  },
    { col: 45, row: 4  },
    { col: 5,  row: 25 },
    { col: 44, row: 25 },
  ],
  packagePositions: [
    { col: 20, row: 9  },
    { col: 33, row: 10 },
    { col: 19, row: 20 },
    { col: 33, row: 20 },
  ],
  npcPositions: [
    { id: 'jiji',        col: 21, row: 11 },
    { id: 'tombo',       col: 35, row: 10 },
    { id: 'ursula',      col: 18, row: 17 },
    { id: 'madame-barsa', col: 31, row: 22 },
  ],
  playerStart: { col: 26, row: 14 },
}

// ─── Future maps ──────────────────────────────────────────────────────────────

const COMING_SOON = (id: string, name: string, description: string, hint: string, accentColor: string, cardGradient: string, emoji: string): MapConfig => ({
  id, name, description, hint, accentColor, cardGradient, emoji,
  bg: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url('/assets/backgrounds/delivery-on-the-wind/${id}-bg.png') center/cover no-repeat`,
  available: false,
  gameDurationMs: 0,
  cols: 0, rows: 0,
  tiles: [], housePositions: [], packagePositions: [], npcPositions: [], playerStart: { col: 0, row: 0 },
})

export const MAP_REGISTRY: MapConfig[] = [
  VILLAGE_MAP,
  COMING_SOON(
    'forest', 'Forest Circuit',
    'Ancient trees and winding paths through a dense woodland.',
    "Don't lose the path — the trees close in fast.",
    '#6AAF60',
    'linear-gradient(145deg, rgba(8,22,8,0.96) 0%, rgba(14,34,10,0.96) 100%)',
    '🌲',
  ),
  COMING_SOON(
    'coastal', 'Coastal Run',
    'Clifftop paths and sea breezes over crashing waves.',
    'The ocean wind speeds you up — if you know the edge.',
    '#5DD6C8',
    'linear-gradient(145deg, rgba(8,18,28,0.96) 0%, rgba(10,30,42,0.96) 100%)',
    '🌊',
  ),
  COMING_SOON(
    'mountain', 'Mountain Pass',
    'Steep trails and misty peaks where spirits gather.',
    'High paths are fast; swamp valleys will ruin your time.',
    '#A78BC4',
    'linear-gradient(145deg, rgba(16,10,28,0.96) 0%, rgba(26,16,42,0.96) 100%)',
    '⛰️',
  ),
]

export function getMapConfig(id: string): MapConfig {
  return MAP_REGISTRY.find((m) => m.id === id) ?? VILLAGE_MAP
}
