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
  worldImage?:     string
}

const COLS = 96
const ROWS = 48

const HOUSE_POSITIONS = [
  { col: 7, row: 8 },
  { col: 79, row: 8 },
  { col: 19, row: 18 },
  { col: 84, row: 20 },
]

function pick<T>(items: T[], row: number, col: number): T {
  return items[Math.abs((row * 31 + col * 17 + row * col) % items.length)]
}

function makeBaseGround(): TileType[][] {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col): TileType => {
      if (row < 3 || row > ROWS - 4 || col < 3 || col > COLS - 4) {
        return pick(['dark_grass', 'dark_grass_leaves', 'moss_grass'], row, col)
      }

      if (col < 24 && row > 29) return pick(['medium_grass', 'grass', 'medium_grass'], row, col)
      if (col > 72 && row < 17) return pick(['medium_grass', 'grass_flowers', 'medium_grass'], row, col)
      if (col > 60 && row > 28) return pick(['moss_grass', 'dark_grass', 'moss_grass'], row, col)

      return pick(
        ['grass', 'medium_grass', 'grass', 'grass', 'medium_grass'],
        row,
        col,
      )
    }),
  )
}

function paintRect(tiles: TileType[][], col: number, row: number, width: number, height: number, tile: TileType) {
  for (let r = row; r < row + height; r++) {
    for (let c = col; c < col + width; c++) {
      if (tiles[r]?.[c]) tiles[r][c] = tile
    }
  }
}

function paintPath(tiles: TileType[][], points: Array<[number, number]>, width = 1) {
  const radius = Math.floor(width / 2)
  const stamp = (col: number, row: number) => {
    paintRect(tiles, col - radius, row - radius, width, width, 'stone_path')
  }

  for (let i = 1; i < points.length; i++) {
    const [fromCol, fromRow] = points[i - 1]
    const [toCol, toRow] = points[i]
    const dx = Math.sign(toCol - fromCol)
    const dy = Math.sign(toRow - fromRow)
    let col = fromCol
    let row = fromRow

    while (col !== toCol || row !== toRow) {
      stamp(col, row)
      if (col !== toCol) col += dx
      else if (row !== toRow) row += dy
    }
    stamp(toCol, toRow)
  }
}

function scatter(
  tiles: TileType[][],
  tile: TileType,
  count: number,
  predicate: (row: number, col: number) => boolean,
) {
  let placed = 0
  const occupied = new Set<string>()
  for (let seed = 0; seed < COLS * ROWS * 2 && placed < count; seed++) {
    const row = 2 + ((seed * 19 + 7) % (ROWS - 4))
    const col = 2 + ((seed * 29 + 11) % (COLS - 4))
    const key = `${row},${col}`
    if (!occupied.has(key) && predicate(row, col)) {
      tiles[row][col] = tile
      occupied.add(key)
      placed++
    }
  }
}

function paintWater(tiles: TileType[][]) {
  const paintPond = (centerCol: number, centerRow: number, radiusCol: number, radiusRow: number) => {
    for (let row = Math.floor(centerRow - radiusRow); row <= Math.ceil(centerRow + radiusRow); row++) {
      for (let col = Math.floor(centerCol - radiusCol); col <= Math.ceil(centerCol + radiusCol); col++) {
        if (!tiles[row]?.[col]) continue
        const dx = (col - centerCol) / radiusCol
        const dy = (row - centerRow) / radiusRow
        const distance = dx * dx + dy * dy
        if (distance <= 1) {
          tiles[row][col] = distance > 0.72
            ? pick(['water_grass', 'water_stones', 'water_grass'], row, col)
            : pick(['water', 'water_alt', 'water', 'water_shell'], row, col)
        }
      }
    }
  }

  // Collision water follows the generated background: a wide northern pond,
  // two small plaza ponds, and the larger lake continuing off the south edge.
  paintRect(tiles, 44, 0, 7, 7, 'water')
  paintPond(47.5, 12, 9, 10)
  paintPond(42.5, 32, 5, 6)
  paintPond(53, 32, 5, 6)
  paintPond(47.5, 44, 12, 10)
}

function paintVillagePaths(tiles: TileType[][]) {
  // Main plaza road and two river-bank promenades.
  paintPath(tiles, [[12, 24], [83, 24]], 3)
  paintPath(tiles, [[41, 9], [41, 39]], 3)
  paintPath(tiles, [[54, 9], [54, 39]], 3)

  // North houses connect through the upper bridge loop.
  paintPath(tiles, [[8, 12], [8, 15], [41, 15]], 3)
  paintPath(tiles, [[86, 13], [86, 15], [54, 15]], 3)
  paintPath(tiles, [[41, 11], [54, 11]], 3)

  // South houses connect through the lower bridge loop.
  paintPath(tiles, [[9, 33], [9, 31], [41, 31]], 3)
  paintPath(tiles, [[87, 33], [87, 31], [54, 31]], 3)
  paintPath(tiles, [[41, 35], [54, 35]], 3)

  // Short spokes bring the town square into both loops.
  paintPath(tiles, [[47, 18], [47, 29]], 3)

  // Each bridge is eight tiles wide and three tiles deep. The marker tiles at
  // the top-left of each PNG are restored after the collision footprint.
  for (const row of [10, 34]) {
    paintRect(tiles, 44, row, 8, 3, 'bridge')
    tiles[row][44] = 'horizontal_bridge_left'
    tiles[row][49] = 'horizontal_bridge_right'
  }
}

function paintHouseGrounds(tiles: TileType[][]) {
  for (const { col, row } of HOUSE_POSITIONS) paintRect(tiles, col - 1, row - 1, 10, 10, 'medium_grass')

  // Doorstep approaches remain intentionally open so the one-tile delivery
  // ring around every 8×8 house footprint is easy to read and reach.
  paintRect(tiles, 9, 16, 3, 3, 'stone_path')
  paintRect(tiles, 82, 16, 3, 3, 'stone_path')
  paintRect(tiles, 22, 26, 3, 3, 'stone_path')
  paintRect(tiles, 87, 28, 3, 3, 'stone_path')
}

function paintOverlayObjects(tiles: TileType[][]) {
  // These invisible collision footprints align with the large landmarks that
  // are already painted into the generated world image.
  paintRect(tiles, 16, 29, 12, 9, 'tree_dense') // old town hall
  paintRect(tiles, 61, 13, 5, 12, 'tree_dense') // magic tower
  paintRect(tiles, 32, 38, 4, 6, 'tree_dense')  // delivery truck
  paintRect(tiles, 62, 29, 7, 7, 'tree_dense')  // tunnel
}

function paintArtAlignedObstacles(tiles: TileType[][]) {
  // Shared solid silhouettes visible in every biome painting. Depending on the
  // route these areas are dense tree crowns/roots, coastal rock shelves, or
  // alpine cliff-and-fir masses. They deliberately stop before nearby roads,
  // delivery rings, NPC cells, and water so collision matches the readable art.
  const zones = [
    // Northern tree / cliff line
    { col: 2,  row: 0, width: 4, height: 6 },
    { col: 15, row: 0, width: 4, height: 6 },
    { col: 20, row: 0, width: 4, height: 6 },
    { col: 25, row: 0, width: 4, height: 6 },
    { col: 30, row: 0, width: 4, height: 6 },
    { col: 34, row: 0, width: 4, height: 6 },
    { col: 63, row: 0, width: 4, height: 6 },
    { col: 68, row: 0, width: 4, height: 6 },
    { col: 90, row: 0, width: 4, height: 6 },
    // Side tree / rock columns
    { col: 1,  row: 6,  width: 4, height: 6 },
    { col: 1,  row: 14, width: 4, height: 6 },
    { col: 1,  row: 20, width: 4, height: 6 },
    { col: 91, row: 7,  width: 4, height: 6 },
    { col: 91, row: 14, width: 4, height: 6 },
    { col: 91, row: 26, width: 4, height: 6 },
    // Large lower-left and lower-right landmark trees / cliff masses
    { col: 1,  row: 29, width: 8,  height: 12 },
    { col: 68, row: 29, width: 11, height: 17 },
    { col: 64, row: 37, width: 4,  height: 11 },
  ]
  for (const zone of zones) paintRect(tiles, zone.col, zone.row, zone.width, zone.height, 'tree_dense')
}

function makeDeliveryVillageTiles(): TileType[][] {
  const tiles = makeBaseGround()

  paintWater(tiles)
  paintHouseGrounds(tiles)
  paintVillagePaths(tiles)

  // Two compact gardens give the corner homes distinct delivery districts.
  paintRect(tiles, 14, 7, 9, 6, 'soil')
  paintRect(tiles, 73, 35, 8, 7, 'soil')
  scatter(tiles, 'grass_patch', 26, (row, col) => tiles[row][col] === 'soil')

  scatter(tiles, 'grass_flowers', 110, (_row, _col) =>
    ['grass', 'medium_grass', 'dark_grass', 'moss_grass'].includes(tiles[_row][_col]),
  )

  // The supplied town-square PNG is exactly 6×6 tiles and is anchored by
  // its top-left map cell after the underlying air-passable plaza is prepared.
  paintRect(tiles, 45, 21, 6, 6, 'stone_path')
  tiles[21][45] = 'town_square'

  paintOverlayObjects(tiles)
  paintArtAlignedObstacles(tiles)

  return tiles
}

const DELIVERY_VILLAGE_TILES = makeDeliveryVillageTiles()

export const MEADOW_MAP: MapConfig = {
  id:           'meadow',
  name:         'Wind Village',
  description:  'A lively delivery village with grassy yards, water crossings, stone paths, and landmark buildings.',
  hint:         'Fly across open water when it helps, but circle around cottages, trees, and the town landmarks.',
  accentColor:  '#ADC178',
  cardGradient: 'linear-gradient(145deg, rgba(28,47,16,0.96) 0%, rgba(82,111,46,0.96) 100%)',
  bg:           `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.48)), url('/assets/backgrounds/delivery-on-the-wind/delivery-map.png') center/cover no-repeat`,
  worldImage:   '/assets/backgrounds/delivery-on-the-wind/delivery-map.png',
  emoji:        '🏡',
  available:    true,
  gameDurationMs: 120_000,
  cols: COLS,
  rows: ROWS,
  tiles: DELIVERY_VILLAGE_TILES,
  housePositions: HOUSE_POSITIONS,
  packagePositions:[{ col: 31, row: 23 }, { col: 67, row: 23 }, { col: 35, row: 15 }, { col: 47, row: 29 }],
  npcPositions: [
    { id: 'jiji',         col: 15, row: 16 },
    { id: 'tombo',        col: 76, row: 16 },
    { id: 'ursula',       col: 25, row: 27 },
    { id: 'madame-barsa', col: 70, row: 27 },
  ],
  playerStart: { col: 47, row: 28 },
}

function makeBiomeMap({
  id,
  name,
  description,
  hint,
  accentColor,
  cardGradient,
  emoji,
  gameDurationMs,
}: Pick<MapConfig, 'id' | 'name' | 'description' | 'hint' | 'accentColor' | 'cardGradient' | 'emoji' | 'gameDurationMs'>): MapConfig {
  const worldImage = `/assets/backgrounds/delivery-on-the-wind/${id}-map.png`
  const tiles = MEADOW_MAP.tiles.map((row) => [...row])

  // The generated biome art uses dense trees, surf, or cliffs around its
  // perimeter. Mirror that visual boundary in the movement grid.
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (row < 2 || row >= ROWS - 2 || col < 2 || col >= COLS - 2) tiles[row][col] = 'tree_dense'
    }
  }

  return {
    ...MEADOW_MAP,
    id,
    name,
    description,
    hint,
    accentColor,
    cardGradient,
    emoji,
    gameDurationMs,
    tiles,
    worldImage,
    bg: `linear-gradient(rgba(0,0,0,0.34), rgba(0,0,0,0.48)), url('${worldImage}') center/cover no-repeat`,
    available: true,
  }
}

export const FOREST_MAP = makeBiomeMap({
  id: 'forest',
  name: 'Enchanted Forest',
  description: 'A luminous old woodland of mossy lanes, roots, mushrooms, and lantern-lit homes.',
  hint: 'Open water is flyable; use the mossy lanes to judge turns around dense trees and buildings.',
  accentColor: '#6FD08C',
  cardGradient: 'linear-gradient(145deg, rgba(5,24,16,0.97) 0%, rgba(13,61,38,0.96) 100%)',
  emoji: '🌲',
  gameDurationMs: 135_000,
})

export const COASTAL_MAP = makeBiomeMap({
  id: 'coastal',
  name: 'Coastal Run',
  description: 'A sunlit island route of turquoise tide pools, shell paths, salt grass, and sea wind.',
  hint: 'Cross tide pools freely, then turn around houses, large trees, rocks, and the island boundary.',
  accentColor: '#64E1D2',
  cardGradient: 'linear-gradient(145deg, rgba(8,43,55,0.97) 0%, rgba(28,116,122,0.95) 100%)',
  emoji: '🌊',
  gameDurationMs: 125_000,
})

export const MOUNTAIN_MAP = makeBiomeMap({
  id: 'mountain',
  name: 'Mountain Pass',
  description: 'A snowy alpine village of slate terraces, crystal streams, lavender, and fir trees.',
  hint: 'Fly over crystal streams, but route around fir trees, buildings, rock walls, and snowy cliff edges.',
  accentColor: '#B9A7F5',
  cardGradient: 'linear-gradient(145deg, rgba(19,23,50,0.97) 0%, rgba(57,66,108,0.96) 100%)',
  emoji: '⛰️',
  gameDurationMs: 145_000,
})

export const MAP_REGISTRY: MapConfig[] = [
  MEADOW_MAP,
  FOREST_MAP,
  COASTAL_MAP,
  MOUNTAIN_MAP,
]

export function getMapConfig(id: string): MapConfig {
  return MAP_REGISTRY.find((m) => m.id === id) ?? MEADOW_MAP
}
