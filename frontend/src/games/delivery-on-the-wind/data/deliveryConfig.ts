export type DeliveryType = 'apple' | 'star' | 'leaf' | 'moon'
export type TileType = 'grass' | 'path' | 'tree' | 'water' | 'swamp'

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
}

export interface InspectData {
  kind: 'package' | 'house'
  type: DeliveryType
  imageIndex: number
  label: string
  colorHex: string
  hint: string
}

// ── World dimensions ──────────────────────────────────────────────────────────

export const TILE       = 48
export const MAP_COLS   = 40
export const MAP_ROWS   = 30
export const VIEWPORT_W = 960
export const VIEWPORT_H = 540
export const GAME_DURATION_MS = 120_000

// ── Tile rules ────────────────────────────────────────────────────────────────

export const TILE_RULES: Record<TileType, { walkable: boolean; speedMultiplier: number }> = {
  grass: { walkable: true,  speedMultiplier: 1.0  },
  path:  { walkable: true,  speedMultiplier: 1.35 },
  tree:  { walkable: false, speedMultiplier: 0    },
  water: { walkable: false, speedMultiplier: 0    },
  swamp: { walkable: true,  speedMultiplier: 0.5  },
}

// ── Map builder (40 cols × 30 rows) ──────────────────────────────────────────

function buildMap(): TileType[][] {
  const map: TileType[][] = Array.from({ length: MAP_ROWS }, () =>
    Array.from({ length: MAP_COLS }, (): TileType => 'grass'),
  )

  const set = (r: number, c: number, t: TileType) => {
    if (r >= 0 && r < MAP_ROWS && c >= 0 && c < MAP_COLS) map[r][c] = t
  }

  // Border trees
  for (let c = 0; c < MAP_COLS; c++) { set(0, c, 'tree'); set(MAP_ROWS - 1, c, 'tree') }
  for (let r = 0; r < MAP_ROWS; r++) { set(r, 0, 'tree'); set(r, MAP_COLS - 1, 'tree') }

  // River: rows 13-14, cols 8-31 (leaves west + east passages at cols 1-7 and 32-38)
  for (let r = 13; r <= 14; r++) {
    for (let c = 8; c <= 31; c++) set(r, c, 'water')
  }
  // Central bridge: cols 18-21
  for (let r = 13; r <= 14; r++) {
    for (let c = 18; c <= 21; c++) set(r, c, 'path')
  }

  // Central vertical path (cols 19-20) — north and south of bridge
  for (let r = 6; r <= 12; r++)  { set(r, 19, 'path'); set(r, 20, 'path') }
  for (let r = 15; r <= 23; r++) { set(r, 19, 'path'); set(r, 20, 'path') }

  // Horizontal path row 6 (upper connector, cols 4-35)
  for (let c = 4; c <= 35; c++) { if (map[6][c] !== 'tree') set(6, c, 'path') }

  // Horizontal path row 23 (lower connector, cols 4-35)
  for (let c = 4; c <= 35; c++) { if (map[23][c] !== 'tree') set(23, c, 'path') }

  // Upper-left forest (rows 7-11, cols 6-10)
  for (let r = 7; r <= 11; r++) {
    for (let c = 6; c <= 10; c++) set(r, c, 'tree')
  }
  // Thin gap at east edge to allow some passage
  set(9,  10, 'grass')
  set(10, 10, 'grass')

  // Upper-right forest (rows 7-11, cols 29-33)
  for (let r = 7; r <= 11; r++) {
    for (let c = 29; c <= 33; c++) set(r, c, 'tree')
  }
  set(9,  29, 'grass')
  set(10, 29, 'grass')

  // Lower-left forest (rows 18-22, cols 6-10)
  for (let r = 18; r <= 22; r++) {
    for (let c = 6; c <= 10; c++) set(r, c, 'tree')
  }
  set(19, 10, 'grass')
  set(20, 10, 'grass')

  // Lower-right forest (rows 18-22, cols 29-33)
  for (let r = 18; r <= 22; r++) {
    for (let c = 29; c <= 33; c++) set(r, c, 'tree')
  }
  set(19, 29, 'grass')
  set(20, 29, 'grass')

  // Swamp south-west (rows 15-17, cols 3-7) — deters west-side river bypass
  for (let r = 15; r <= 17; r++) {
    for (let c = 3; c <= 7; c++) set(r, c, 'swamp')
  }

  // Swamp south-east (rows 15-17, cols 32-36)
  for (let r = 15; r <= 17; r++) {
    for (let c = 32; c <= 36; c++) set(r, c, 'swamp')
  }

  // Small decorative tree clusters near house corners
  set(5, 6, 'tree'); set(5, 7, 'tree'); set(4, 6, 'tree')   // near NW house
  set(5, 32, 'tree'); set(5, 33, 'tree'); set(4, 33, 'tree')  // near NE house
  set(24, 6, 'tree'); set(24, 7, 'tree'); set(25, 6, 'tree')  // near SW house
  set(24, 32, 'tree'); set(24, 33, 'tree'); set(25, 33, 'tree') // near SE house

  // Clear 2×2 pads around each house and each package (guarantee walkable)
  const clearZones: [number, number][] = [
    [3,3],[3,4],[4,3],[4,4],           // NW house (apple)
    [3,35],[3,36],[4,35],[4,36],       // NE house (star)
    [25,3],[25,4],[26,3],[26,4],       // SW house (leaf)
    [25,35],[25,36],[26,35],[26,36],   // SE house (moon)
    [9,14],[9,15],[10,14],[10,15],     // pkg 1
    [9,24],[9,25],[10,24],[10,25],     // pkg 2
    [19,14],[19,15],[20,14],[20,15],   // pkg 3
    [19,24],[19,25],[20,24],[20,25],   // pkg 4
    [14,19],[14,20],[15,19],[15,20],   // player start area
  ]
  for (const [r, c] of clearZones) set(r, c, 'grass')

  return map
}

export const MAP_DATA: TileType[][] = buildMap()

// ── Delivery types ────────────────────────────────────────────────────────────

export const DELIVERY_TYPES: DeliveryConfig[] = [
  {
    type: 'apple',
    letter: 'A',
    colorNum: 0xC0392B,
    colorHex: '#C0392B',
    label: 'Apple Parcel',
    imageIndex: 1,
    hint: 'Deliver to the red-signed house in the north-west corner.',
  },
  {
    type: 'star',
    letter: 'S',
    colorNum: 0x2471A3,
    colorHex: '#2471A3',
    label: 'Star Package',
    imageIndex: 2,
    hint: 'Deliver to the blue-starred house in the north-east corner.',
  },
  {
    type: 'leaf',
    letter: 'L',
    colorNum: 0x1E8449,
    colorHex: '#1E8449',
    label: 'Leaf Bundle',
    imageIndex: 3,
    hint: 'Deliver to the green-leaf house in the south-west corner.',
  },
  {
    type: 'moon',
    letter: 'M',
    colorNum: 0xC8860A,
    colorHex: '#C8860A',
    label: 'Moon Lantern',
    imageIndex: 4,
    hint: 'Deliver to the golden-moon house in the south-east corner.',
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

export const HOUSE_POSITIONS = [
  { col: 3,  row: 3  },   // apple — NW
  { col: 35, row: 3  },   // star  — NE
  { col: 3,  row: 25 },   // leaf  — SW
  { col: 35, row: 25 },   // moon  — SE
]

export const PACKAGE_POSITIONS = [
  { col: 14, row: 9  },   // matches DELIVERY_TYPES order
  { col: 25, row: 9  },
  { col: 14, row: 19 },
  { col: 25, row: 19 },
]

export const PLAYER_START = { col: 19, row: 14 }
