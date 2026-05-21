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
export const VIEWPORT_W = 960
export const VIEWPORT_H = 540

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
