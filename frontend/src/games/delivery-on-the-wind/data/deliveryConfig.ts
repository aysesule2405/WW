export type DeliveryType = 'mushroom' | 'wildflower' | 'dew' | 'rose'
export type TileType =
  | 'grass'
  | 'path'
  | 'tilled_soil'
  | 'crop_seedling'
  | 'crop_bloom'
  | 'wildflowers'
  | 'lavender'
  | 'mushroom_patch'
  | 'moss'
  | 'fallen_leaves'
  | 'tree'
  | 'tree_dense'
  | 'stone'
  | 'water'
  | 'water_alt'
  | 'ocean_shore'
  | 'bridge'
  | 'swamp'
  | 'wind_gust'

export interface DeliveryConfig {
  type: DeliveryType
  letter: string
  colorNum: number
  colorHex: string
  label: string
  imageIndex: number
  hint: string
}

export interface HUDState {
  heldType: DeliveryType | null
  heldImageIndex: number | null
  heldLabel: string | null
  heldColorHex: string | null
  nearHouseType: DeliveryType | null
  nearHouseImageIndex: number | null
  nearHouseLabel: string | null
  nearNpcId: NpcId | null
  nearNpcName: string | null
  nearNpcAssetKey: string | null
}

export interface InspectData {
  kind: 'package' | 'house'
  type: DeliveryType
  imageIndex: number
  label: string
  colorHex: string
  hint: string
}

export type NpcId = 'jiji' | 'tombo' | 'ursula' | 'madame-barsa'

export interface NpcConfig {
  id: NpcId
  name: string
  assetKey: string
  role: string
  emptyLine: string
}

export interface NpcPosition {
  id: NpcId
  col: number
  row: number
}

export interface NpcTalkData {
  id: NpcId
  name: string
  assetKey: string
  role: string
  line: string
  heldLabel: string | null
  heldColorHex: string | null
}

// ── World dimensions ──────────────────────────────────────────────────────────

export const TILE       = 48
export const HOUSE_SIZE = 3        // each house occupies a HOUSE_SIZE × HOUSE_SIZE tile block
export const MAP_COLS   = 52
export const MAP_ROWS   = 32
export const VIEWPORT_W = 960
export const VIEWPORT_H = 540
export const GAME_DURATION_MS = 120_000

// ── House positions (top-left tile of each HOUSE_SIZE×HOUSE_SIZE block) ───────

export const HOUSE_POSITIONS = [
  { col: 4 , row: 3  },   // north-west cottage
  { col: 45, row: 4  },   // north-east cottage
  { col: 5 , row: 25 },   // south-west cottage
  { col: 44, row: 25 },   // south-east cottage
]

// ── Tile rules ────────────────────────────────────────────────────────────────

export const TILE_RULES: Record<TileType, { walkable: boolean; speedMultiplier: number }> = {
  grass:          { walkable: true,  speedMultiplier: 1.0  },
  path:           { walkable: true,  speedMultiplier: 1.35 },
  tilled_soil:    { walkable: true,  speedMultiplier: 0.9  },
  crop_seedling:  { walkable: true,  speedMultiplier: 0.88 },
  crop_bloom:     { walkable: true,  speedMultiplier: 0.88 },
  wildflowers:    { walkable: true,  speedMultiplier: 0.96 },
  lavender:       { walkable: true,  speedMultiplier: 0.94 },
  mushroom_patch: { walkable: true,  speedMultiplier: 0.82 },
  moss:           { walkable: true,  speedMultiplier: 0.82 },
  fallen_leaves:  { walkable: true,  speedMultiplier: 1.05 },
  tree:           { walkable: false, speedMultiplier: 0    },
  tree_dense:     { walkable: false, speedMultiplier: 0    },
  stone:          { walkable: false, speedMultiplier: 0    },
  water:          { walkable: false, speedMultiplier: 0    },
  water_alt:      { walkable: false, speedMultiplier: 0    },
  ocean_shore:    { walkable: true,  speedMultiplier: 0.75 },
  bridge:         { walkable: true,  speedMultiplier: 1.25 },
  swamp:          { walkable: true,  speedMultiplier: 0.55 },
  wind_gust:      { walkable: true,  speedMultiplier: 1.65 },
}

export const NPC_CONFIGS: NpcConfig[] = [
  {
    id: 'jiji',
    name: 'Jiji',
    assetKey: 'jiji',
    role: 'Companion and careful route-checker',
    emptyLine: 'No package yet. Pick one up first, and I will help you keep the houses straight.',
  },
  {
    id: 'tombo',
    name: 'Tombo',
    assetKey: 'tombo',
    role: 'Aviation enthusiast with a sharp eye for routes',
    emptyLine: 'I can chart a route once you are carrying something. Packages are easier to track than empty air.',
  },
  {
    id: 'ursula',
    name: 'Ursula',
    assetKey: 'ursula',
    role: 'Forest artist who reads the grove by color and shape',
    emptyLine: 'Hold a package up to the light, and I can help you match its mood to the right house.',
  },
  {
    id: 'madame-barsa',
    name: 'Madame & Barsa',
    assetKey: 'madame_and_barsa',
    role: 'Kind patrons who remember every doorstep',
    emptyLine: 'Such a busy delivery day. Bring us a package to look at, dear, and we will point you to the proper home.',
  },
]

// ── Map builder (52 cols × 32 rows) ──────────────────────────────────────────

const MAP_TILES: TileType[][] = [
  ['water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'ocean_shore', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense'],
  ['water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'ocean_shore', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree_dense'],
  ['ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'grass', 'grass', 'grass', 'stone', 'fallen_leaves', 'tree', 'grass', 'grass', 'tree', 'grass', 'tree', 'tree', 'grass', 'fallen_leaves', 'tree', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'fallen_leaves', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'fallen_leaves', 'fallen_leaves', 'fallen_leaves', 'stone', 'grass', 'tree', 'wildflowers', 'wildflowers', 'wildflowers', 'tree_dense'],
  ['tree_dense', 'fallen_leaves', 'fallen_leaves', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'stone', 'grass', 'grass', 'grass', 'fallen_leaves', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone', 'tree', 'grass', 'grass', 'grass', 'wildflowers', 'grass', 'grass', 'grass', 'fallen_leaves', 'tree', 'swamp', 'swamp', 'swamp', 'swamp', 'grass', 'grass', 'stone', 'lavender', 'lavender', 'lavender', 'lavender', 'lavender', 'lavender', 'grass', 'grass', 'grass', 'grass', 'fallen_leaves', 'grass', 'grass', 'wildflowers', 'wildflowers', 'tree_dense'],
  ['tree', 'fallen_leaves', 'grass', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'grass', 'grass', 'tree', 'path', 'path', 'path', 'path', 'path', 'wildflowers', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'fallen_leaves', 'lavender', 'lavender', 'lavender', 'lavender', 'lavender', 'lavender', 'lavender', 'lavender', 'grass', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'tree', 'fallen_leaves', 'tree'],
  ['tree_dense', 'tree', 'grass', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'grass', 'wildflowers', 'path', 'path', 'wildflowers', 'grass', 'wildflowers', 'path', 'path', 'path', 'path', 'path', 'fallen_leaves', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone', 'wildflowers', 'wildflowers', 'wildflowers', 'lavender', 'lavender', 'lavender', 'path', 'path', 'path', 'path', 'path', 'grass', 'grass', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'fallen_leaves', 'grass', 'tree_dense'],
  ['tree_dense', 'grass', 'grass', 'bridge', 'bridge', 'bridge', 'bridge', 'bridge', 'path', 'path', 'path', 'path', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'fallen_leaves', 'grass', 'grass', 'grass', 'fallen_leaves', 'grass', 'fallen_leaves', 'path', 'path', 'path', 'path', 'lavender', 'lavender', 'path', 'path', 'path', 'path', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'fallen_leaves', 'tree', 'tree_dense'],
  ['tree', 'grass', 'grass', 'grass', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'tree', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'tree', 'tree', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'wildflowers', 'path', 'bridge', 'bridge', 'bridge', 'bridge', 'bridge', 'stone', 'grass', 'tree'],
  ['tree_dense', 'grass', 'grass', 'path', 'wildflowers', 'grass', 'wildflowers', 'stone', 'wildflowers', 'grass', 'grass', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'fallen_leaves', 'stone', 'tree', 'grass', 'grass', 'grass', 'grass', 'fallen_leaves', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'fallen_leaves', 'stone', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree', 'tree', 'tree', 'path', 'path', 'path', 'path', 'path', 'path', 'grass', 'grass', 'tree_dense'],
  ['tree_dense', 'grass', 'path', 'path', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'grass', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'swamp', 'swamp', 'tree', 'grass', 'fallen_leaves', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'fallen_leaves', 'path', 'path', 'fallen_leaves', 'grass', 'stone', 'grass', 'grass', 'grass', 'fallen_leaves', 'tree', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'tree', 'grass', 'grass', 'grass', 'path', 'wildflowers', 'fallen_leaves', 'grass', 'grass', 'tree_dense'],
  ['tree', 'grass', 'path', 'tilled_soil', 'crop_seedling', 'crop_seedling', 'crop_seedling', 'crop_seedling', 'tilled_soil', 'grass', 'grass', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'swamp', 'swamp', 'tree', 'grass', 'tilled_soil', 'crop_seedling', 'crop_seedling', 'crop_seedling', 'tilled_soil', 'path', 'path', 'path', 'fallen_leaves', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'tree', 'grass', 'grass', 'grass', 'path', 'path', 'grass', 'fallen_leaves', 'tree'],
  ['tree_dense', 'tree', 'path', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tree', 'grass', 'grass', 'tree', 'tree', 'tree', 'tree', 'tree_dense', 'tree', 'swamp', 'swamp', 'tree', 'grass', 'grass', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tree', 'path', 'path', 'path', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'fallen_leaves', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'stone', 'tree', 'grass', 'grass', 'grass', 'path', 'fallen_leaves', 'tree', 'tree_dense'],
  ['tree_dense', 'fallen_leaves', 'stone', 'path', 'path', 'grass', 'grass', 'grass', 'grass', 'grass', 'fallen_leaves', 'grass', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'grass', 'wildflowers', 'tree', 'wildflowers', 'grass', 'grass', 'path', 'path', 'path', 'stone', 'fallen_leaves', 'grass', 'grass', 'grass', 'fallen_leaves', 'tree', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'tree', 'grass', 'wildflowers', 'grass', 'grass', 'fallen_leaves', 'path', 'grass', 'grass', 'tree_dense'],
  ['ocean_shore', 'ocean_shore', 'bridge', 'path', 'bridge', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'tree', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'bridge', 'bridge', 'path', 'path', 'path', 'bridge', 'bridge', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'bridge', 'path', 'bridge', 'ocean_shore', 'ocean_shore'],
  ['water_alt', 'water', 'bridge', 'path', 'bridge', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'bridge', 'bridge', 'path', 'path', 'path', 'bridge', 'bridge', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'bridge', 'path', 'bridge', 'water', 'water_alt'],
  ['water', 'water_alt', 'bridge', 'path', 'bridge', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'bridge', 'bridge', 'path', 'path', 'path', 'bridge', 'bridge', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt', 'bridge', 'path', 'bridge', 'water_alt', 'water'],
  ['ocean_shore', 'ocean_shore', 'bridge', 'path', 'bridge', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'bridge', 'bridge', 'path', 'path', 'path', 'bridge', 'bridge', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'bridge', 'path', 'bridge', 'ocean_shore', 'ocean_shore'],
  ['tree_dense', 'tree', 'fallen_leaves', 'path', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'fallen_leaves', 'path', 'path', 'fallen_leaves', 'grass', 'wildflowers', 'tree', 'grass', 'grass', 'grass', 'grass', 'grass', 'fallen_leaves', 'tree', 'tree', 'tree', 'fallen_leaves', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'path', 'grass', 'tree', 'tree_dense'],
  ['tree_dense', 'fallen_leaves', 'tree', 'path', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'grass', 'grass', 'grass', 'wildflowers', 'tree', 'fallen_leaves', 'grass', 'fallen_leaves', 'grass', 'wildflowers', 'grass', 'wildflowers', 'grass', 'grass', 'wildflowers', 'path', 'grass', 'grass', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'grass', 'fallen_leaves', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'stone', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'path', 'grass', 'stone', 'tree_dense'],
  ['tree', 'grass', 'grass', 'path', 'path', 'stone', 'wildflowers', 'grass', 'swamp', 'swamp', 'grass', 'grass', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'grass', 'path', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'path', 'path', 'tilled_soil', 'lavender', 'lavender', 'lavender', 'tilled_soil', 'tree', 'tree', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree', 'tree', 'tree', 'grass', 'swamp', 'swamp', 'swamp', 'swamp', 'swamp', 'path', 'fallen_leaves', 'grass', 'tree'],
  ['tree_dense', 'grass', 'grass', 'grass', 'path', 'path', 'grass', 'grass', 'grass', 'grass', 'grass', 'stone', 'tree', 'tree', 'tree', 'tree_dense', 'tree', 'wildflowers', 'grass', 'grass', 'tilled_soil', 'crop_bloom', 'crop_bloom', 'crop_bloom', 'crop_bloom', 'crop_bloom', 'path', 'path', 'lavender', 'lavender', 'lavender', 'lavender', 'lavender', 'grass', 'grass', 'fallen_leaves', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'tree', 'grass', 'grass', 'fallen_leaves', 'swamp', 'swamp', 'swamp', 'path', 'grass', 'grass', 'tree_dense'],
  ['tree_dense', 'stone', 'grass', 'fallen_leaves', 'path', 'fallen_leaves', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'stone', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'wildflowers', 'wildflowers', 'grass', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'stone', 'path', 'fallen_leaves', 'tilled_soil', 'tilled_soil', 'lavender', 'tilled_soil', 'tilled_soil', 'grass', 'grass', 'grass', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'wildflowers', 'grass', 'grass', 'grass', 'stone', 'path', 'grass', 'grass', 'tree_dense'],
  ['tree', 'fallen_leaves', 'grass', 'grass', 'path', 'path', 'path', 'grass', 'wildflowers', 'grass', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'stone', 'wildflowers', 'tree', 'tree', 'grass', 'grass', 'grass', 'grass', 'path', 'path', 'path', 'grass', 'fallen_leaves', 'tilled_soil', 'grass', 'wildflowers', 'tree', 'wildflowers', 'stone', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'grass', 'grass', 'grass', 'fallen_leaves', 'grass', 'path', 'path', 'grass', 'grass', 'tree'],
  ['tree_dense', 'grass', 'grass', 'wildflowers', 'grass', 'path', 'path', 'path', 'path', 'wildflowers', 'fallen_leaves', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'tree', 'tree', 'path', 'path', 'path', 'path', 'path', 'fallen_leaves', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'tree', 'tree', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'tree', 'path', 'path', 'path', 'path', 'path', 'wildflowers', 'grass', 'grass', 'grass', 'tree_dense'],
  ['tree_dense', 'grass', 'wildflowers', 'wildflowers', 'wildflowers', 'tree', 'path', 'path', 'path', 'path', 'path', 'tree', 'tree', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree_dense', 'tree', 'tree', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'grass', 'fallen_leaves', 'grass', 'tree_dense'],
  ['tree', 'grass', 'grass', 'wildflowers', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'path', 'path', 'wildflowers', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'stone', 'path', 'tree', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'fallen_leaves', 'path', 'path', 'tilled_soil', 'tilled_soil', 'tree', 'tilled_soil', 'tilled_soil', 'path', 'path', 'grass', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'grass', 'grass', 'fallen_leaves', 'tree'],
  ['tree_dense', 'tree', 'grass', 'grass', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'fallen_leaves', 'path', 'path', 'mushroom_patch', 'mushroom_patch', 'mushroom_patch', 'tree', 'mushroom_patch', 'mushroom_patch', 'mushroom_patch', 'path', 'path', 'fallen_leaves', 'wildflowers', 'grass', 'fallen_leaves', 'grass', 'wildflowers', 'grass', 'stone', 'grass', 'fallen_leaves', 'grass', 'tree', 'tilled_soil', 'path', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'path', 'path', 'tilled_soil', 'tilled_soil', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'grass', 'grass', 'tree', 'tree_dense'],
  ['tree_dense', 'swamp', 'stone', 'fallen_leaves', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'grass', 'grass', 'path', 'path', 'mushroom_patch', 'mushroom_patch', 'mushroom_patch', 'mushroom_patch', 'mushroom_patch', 'path', 'path', 'fallen_leaves', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'tilled_soil', 'path', 'path', 'path', 'path', 'path', 'path', 'crop_bloom', 'crop_bloom', 'tilled_soil', 'bridge', 'tree_dense', 'tree_dense', 'tree_dense', 'bridge', 'grass', 'fallen_leaves', 'wildflowers', 'tree_dense'],
  ['tree', 'swamp', 'swamp', 'grass', 'bridge', 'bridge', 'bridge', 'bridge', 'bridge', 'grass', 'grass', 'grass', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'tree', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'grass', 'grass', 'grass', 'grass', 'wildflowers', 'stone', 'tilled_soil', 'crop_bloom', 'crop_bloom', 'crop_bloom', 'crop_bloom', 'crop_bloom', 'crop_bloom', 'tilled_soil', 'stone', 'bridge', 'bridge', 'bridge', 'bridge', 'bridge', 'ocean_shore', 'ocean_shore', 'ocean_shore', 'ocean_shore'],
  ['tree_dense', 'swamp', 'swamp', 'swamp', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'stone', 'fallen_leaves', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'wildflowers', 'wildflowers', 'wildflowers', 'wildflowers', 'tree', 'grass', 'grass', 'grass', 'tilled_soil', 'tilled_soil', 'crop_bloom', 'crop_bloom', 'crop_bloom', 'crop_bloom', 'tilled_soil', 'tilled_soil', 'grass', 'grass', 'grass', 'grass', 'swamp', 'water_alt', 'water', 'water_alt', 'water', 'water_alt'],
  ['tree_dense', 'swamp', 'swamp', 'swamp', 'swamp', 'tree', 'stone', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'fallen_leaves', 'wildflowers', 'wildflowers', 'wildflowers', 'wildflowers', 'wildflowers', 'wildflowers', 'tree', 'grass', 'grass', 'grass', 'fallen_leaves', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'tilled_soil', 'fallen_leaves', 'grass', 'grass', 'grass', 'grass', 'swamp', 'swamp', 'swamp', 'water_alt', 'water', 'water_alt', 'water'],
  ['tree_dense', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'tree_dense', 'tree', 'tree_dense', 'swamp', 'swamp', 'water', 'water_alt', 'water', 'water_alt', 'water', 'water_alt'],
]

function buildMap(): TileType[][] {
  return MAP_TILES.map((row) => [...row])
}

export const MAP_DATA: TileType[][] = buildMap()

// ── Delivery types ────────────────────────────────────────────────────────────

export const DELIVERY_TYPES: DeliveryConfig[] = [
  {
    type: 'mushroom',
    letter: 'M',
    colorNum: 0xC0392B,
    colorHex: '#C0392B',
    label: 'Mushroom Mycelium',
    imageIndex: 1,
    hint: 'Deliver to the red-ringed house in the north-west corner.',
  },
  {
    type: 'wildflower',
    letter: 'W',
    colorNum: 0x2471A3,
    colorHex: '#2471A3',
    label: 'Wild Flower',
    imageIndex: 2,
    hint: 'Deliver to the blue-ringed house in the north-east corner.',
  },
  {
    type: 'dew',
    letter: 'D',
    colorNum: 0x1E8449,
    colorHex: '#1E8449',
    label: 'Mount Dew',
    imageIndex: 3,
    hint: 'Deliver to the green-ringed house in the south-west corner.',
  },
  {
    type: 'rose',
    letter: 'R',
    colorNum: 0xC8860A,
    colorHex: '#C8860A',
    label: 'Rose Bud',
    imageIndex: 4,
    hint: 'Deliver to the golden-ringed house in the south-east corner.',
  },
]

export const CORRECT_MESSAGES = [
  'Delivered safely!',
  'The wind brought it home.',
  'You made their day brighter!',
  'Warmth delivered!',
]

export const WRONG_MESSAGES = [
  'This belongs somewhere else.',
  'The wind whispers: wrong house.',
  'That spirit lives elsewhere.',
  'Try another door.',
]

// ── Object positions ──────────────────────────────────────────────────────────

export const PACKAGE_POSITIONS = [
  { col: 20, row: 9  },   // package 1
  { col: 33, row: 10 },   // package 2
  { col: 19, row: 20 },   // package 3
  { col: 33, row: 20 },   // package 4
]

export const NPC_POSITIONS = [
  { id: NPC_CONFIGS[0].id, col: 21, row: 11 },
  { id: NPC_CONFIGS[1].id, col: 35, row: 10 },
  { id: NPC_CONFIGS[2].id, col: 18, row: 17 },
  { id: NPC_CONFIGS[3].id, col: 31, row: 22 },
]

export const PLAYER_START = { col: 26, row: 14 }
