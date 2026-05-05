export type DeliveryType = 'apple' | 'star' | 'leaf' | 'moon'

export interface DeliveryConfig {
  type: DeliveryType
  letter: string
  colorNum: number
  colorHex: string
  label: string
  imageIndex: number
  hint: string
}

// ── Shared overlay data types (used by scene + React wrapper) ─────────────────

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

// ─────────────────────────────────────────────────────────────────────────────

export const DELIVERY_TYPES: DeliveryConfig[] = [
  {
    type: 'apple',
    letter: 'A',
    colorNum: 0xC0392B,
    colorHex: '#C0392B',
    label: 'Apple Parcel',
    imageIndex: 1,
    hint: 'Find the house with the red apple sign.',
  },
  {
    type: 'star',
    letter: 'S',
    colorNum: 0x2471A3,
    colorHex: '#2471A3',
    label: 'Star Package',
    imageIndex: 2,
    hint: 'Find the house with the blue star sign.',
  },
  {
    type: 'leaf',
    letter: 'L',
    colorNum: 0x1E8449,
    colorHex: '#1E8449',
    label: 'Leaf Bundle',
    imageIndex: 3,
    hint: 'Find the house with the green leaf sign.',
  },
  {
    type: 'moon',
    letter: 'M',
    colorNum: 0xC8860A,
    colorHex: '#C8860A',
    label: 'Moon Lantern',
    imageIndex: 4,
    hint: 'Find the house with the golden moon sign.',
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

export const TILE = 48
export const COLS = 17
export const ROWS = 12
export const GAME_DURATION_MS = 120_000

export const MAP_DATA: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

export const HOUSE_POSITIONS = [
  { col: 1,  row: 1  },
  { col: 15, row: 1  },
  { col: 1,  row: 10 },
  { col: 15, row: 10 },
]

export const PACKAGE_POSITIONS = [
  { col: 4,  row: 4 },
  { col: 12, row: 4 },
  { col: 4,  row: 7 },
  { col: 12, row: 7 },
]

export const PLAYER_START = { col: 8, row: 6 }
