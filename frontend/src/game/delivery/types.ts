export type DeliveryType = 'mushroom' | 'wildflower' | 'dew' | 'rose'

export interface DeliveryConfig {
  type: DeliveryType
  letter: string
  colorNum: number
  colorHex: string
  label: string
}

export const DELIVERY_TYPES: DeliveryConfig[] = [
  { type: 'mushroom',   letter: 'M', colorNum: 0xC0392B, colorHex: '#C0392B', label: 'Mushroom Mycelium' },
  { type: 'wildflower', letter: 'W', colorNum: 0x2471A3, colorHex: '#2471A3', label: 'Wild Flower'       },
  { type: 'dew',        letter: 'D', colorNum: 0x1E8449, colorHex: '#1E8449', label: 'Mount Dew'         },
  { type: 'rose',       letter: 'R', colorNum: 0xC8860A, colorHex: '#C8860A', label: 'Rose Bud'          },
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
