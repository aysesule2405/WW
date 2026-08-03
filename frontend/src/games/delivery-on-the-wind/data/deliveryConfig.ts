export type DeliveryType = 'mushroom' | 'wildflower' | 'dew' | 'rose'
export type TileType =
  // ── Ground fills — 16 × 16 px native tiles ─────────────────────────────────
  | 'grass'            // bright green  (1.00×)
  | 'medium_grass'     // mid-tone green (1.00×)
  | 'dark_grass'       // dark green     (0.95×)
  | 'moss_grass'       // mossy green    (0.88×)
  | 'dark_grass_leaves'// dark with leaf scatter (0.90×)
  | 'grass_flowers'    // grass + small flowers  (0.97×)
  | 'grass_patch'      // tall grass patch       (0.94×)
  | 'soil'             // bare earth / garden    (0.90×)
  | 'stone_path'       // cobblestone path       (1.30×)
  | 'water'            // deep water             (flyable)
  | 'water_alt'        // water variant          (flyable)
  | 'water_grass'      // water-grass shore edge (flyable)
  | 'water_stones'     // shallow stony water    (flyable)
  | 'water_shell'      // water with shell decor (flyable)
  // ── Legacy ground tiles (kept for map compat, remapped to new images) ──────
  | 'path'             // alias → stone_path     (1.30×)
  | 'tilled_soil'      // alias → soil           (0.90×)
  | 'crop_seedling'    // seedling on soil       (0.88×)
  | 'crop_bloom'       // bloom on soil          (0.88×)
  | 'wildflowers'      // alias → grass_flowers  (0.97×)
  | 'lavender'         // alias → grass_flowers2 (0.94×)
  | 'mushroom_patch'   // dark ground cluster    (0.82×)
  | 'moss'             // alias → moss_grass     (0.82×)
  | 'fallen_leaves'    // alias → dark_grass_leaves (1.05×)
  | 'ocean_shore'      // alias → water_grass    (0.75×)
  | 'bridge'           // bridge planks          (1.25×)
  | 'horizontal_bridge_left'  // 5×3 left half of the village bridge
  | 'horizontal_bridge_right' // 3×3 right half of the village bridge
  | 'town_square'      // 6×6 circular village plaza
  | 'swamp'            // alias → water_grass    (0.55×)
  | 'wind_gust'        // speed boost            (1.65×)
  // ── Tree overlays (48 × 96 — drawn bottom-aligned in cell) ─────────────────
  | 'tree_round'       // round leafy oak        (impassable)
  | 'tree_fruit'       // red-fruit tree         (impassable)
  | 'tree_pine'        // tall pine/conifer      (impassable)
  | 'mystical_tree'    // ancient mystical (90×112) (impassable)
  // ── Legacy tree aliases ─────────────────────────────────────────────────────
  | 'tree'             // → tree_round           (impassable)
  | 'tree_dense'       // → tree_pine            (impassable)
  | 'stone'            // → stone_path decor     (impassable)
  // ── Decoration overlays ─────────────────────────────────────────────────────
  | 'small_bush'       // 32×32 bush             (impassable)
  | 'large_bush'       // 48×48 bush             (impassable)
  | 'magic_tower'      // 64×192 tower           (impassable)
  | 'old_town_hall'    // 192×160 town hall      (impassable)
  | 'old_truck'        // 63×98 delivery truck   (impassable)
  | 'tunnel'           // 32×48 secret tunnel    (1.55×)

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

export const TILE       = 16   // native tile size — trees (48×96) = 3×6 = 18 tiles
export const HOUSE_SIZE = 8        // each house occupies a HOUSE_SIZE × HOUSE_SIZE tile block
export const VIEWPORT_W = 960
export const VIEWPORT_H = 540

// ── Tile rules ────────────────────────────────────────────────────────────────

export type TileTraversalRule = { airPassable: boolean; speedMultiplier: number }

// Kiki is airborne, so ground material does not decide whether a cell is
// traversable. Open water and shoreline are valid flight cells; tall or solid
// objects remain blocked and are represented by the obstacle tile types below.
export const TILE_RULES: Record<TileType, TileTraversalRule> = {
  grass:          { airPassable: true,  speedMultiplier: 1.0  },
  path:           { airPassable: true,  speedMultiplier: 1.15 },
  tilled_soil:    { airPassable: true,  speedMultiplier: 1.0  },
  crop_seedling:  { airPassable: true,  speedMultiplier: 1.0  },
  crop_bloom:     { airPassable: true,  speedMultiplier: 1.0  },
  wildflowers:    { airPassable: true,  speedMultiplier: 1.0  },
  lavender:       { airPassable: true,  speedMultiplier: 1.0  },
  mushroom_patch: { airPassable: true,  speedMultiplier: 1.0  },
  moss:           { airPassable: true,  speedMultiplier: 1.0  },
  fallen_leaves:  { airPassable: true,  speedMultiplier: 1.0  },
  tree:           { airPassable: false, speedMultiplier: 0    },
  tree_dense:     { airPassable: false, speedMultiplier: 0    },
  stone:          { airPassable: false, speedMultiplier: 0    },
  water:          { airPassable: true,  speedMultiplier: 1.08 },
  water_alt:      { airPassable: true,  speedMultiplier: 1.08 },
  ocean_shore:    { airPassable: true,  speedMultiplier: 1.04 },
  bridge:         { airPassable: true,  speedMultiplier: 1.15 },
  horizontal_bridge_left:  { airPassable: true, speedMultiplier: 1.15 },
  horizontal_bridge_right: { airPassable: true, speedMultiplier: 1.15 },
  town_square:           { airPassable: true,  speedMultiplier: 1.15 },
  swamp:          { airPassable: true,  speedMultiplier: 1.02 },
  wind_gust:      { airPassable: true,  speedMultiplier: 1.65 },
  // new 16×16 ground fills
  dark_grass:         { airPassable: true,  speedMultiplier: 1.00 },
  medium_grass:       { airPassable: true,  speedMultiplier: 1.00 },
  moss_grass:         { airPassable: true,  speedMultiplier: 1.00 },
  dark_grass_leaves:  { airPassable: true,  speedMultiplier: 1.00 },
  grass_flowers:      { airPassable: true,  speedMultiplier: 1.00 },
  grass_patch:        { airPassable: true,  speedMultiplier: 1.00 },
  soil:               { airPassable: true,  speedMultiplier: 1.00 },
  stone_path:         { airPassable: true,  speedMultiplier: 1.15 },
  water_grass:        { airPassable: true,  speedMultiplier: 1.04 },
  water_stones:       { airPassable: true,  speedMultiplier: 1.04 },
  water_shell:        { airPassable: true,  speedMultiplier: 1.04 },
  // new tree overlays
  tree_round:         { airPassable: false, speedMultiplier: 0    },
  tree_fruit:         { airPassable: false, speedMultiplier: 0    },
  tree_pine:          { airPassable: false, speedMultiplier: 0    },
  mystical_tree:      { airPassable: false, speedMultiplier: 0    },
  // new decoration overlays
  small_bush:         { airPassable: false, speedMultiplier: 0    },
  large_bush:         { airPassable: false, speedMultiplier: 0    },
  magic_tower:        { airPassable: false, speedMultiplier: 0    },
  old_town_hall:      { airPassable: false, speedMultiplier: 0    },
  old_truck:          { airPassable: false, speedMultiplier: 0    },
  tunnel:             { airPassable: true,  speedMultiplier: 1.15 },
}

export const WATER_TILE_TYPES: TileType[] = [
  'water', 'water_alt', 'water_grass', 'water_stones', 'water_shell', 'ocean_shore', 'swamp',
]

export const SOLID_TILE_TYPES: TileType[] = [
  'tree', 'tree_dense', 'tree_round', 'tree_fruit', 'tree_pine', 'mystical_tree',
  'stone', 'small_bush', 'large_bush', 'magic_tower', 'old_town_hall', 'old_truck',
]

export function isTileAirPassable(tile: TileType | undefined): tile is TileType {
  return tile !== undefined && TILE_RULES[tile].airPassable
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
