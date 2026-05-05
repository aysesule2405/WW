export type DeliveryType = 'apple' | 'star' | 'leaf' | 'moon'

export interface DeliveryConfig {
  type: DeliveryType
  letter: string
  colorNum: number
  colorHex: string
  label: string
}

export const DELIVERY_TYPES: DeliveryConfig[] = [
  { type: 'apple', letter: 'A', colorNum: 0xC0392B, colorHex: '#C0392B', label: 'Apple Parcel'  },
  { type: 'star',  letter: '★', colorNum: 0x2471A3, colorHex: '#2471A3', label: 'Star Package'  },
  { type: 'leaf',  letter: 'L', colorNum: 0x1E8449, colorHex: '#1E8449', label: 'Leaf Bundle'   },
  { type: 'moon',  letter: 'M', colorNum: 0xC8860A, colorHex: '#C8860A', label: 'Moon Lantern'  },
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
