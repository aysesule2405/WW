const fs = require('fs')
const cp = require('child_process')

const xlsxPath = process.argv[2] || 'docs/delivery-map-current.xlsx'
const configPath = 'frontend/src/games/delivery-on-the-wind/data/deliveryConfig.ts'
const MAP_ROWS = 32
const MAP_COLS = 52
const HOUSE_SIZE = 3

const VALID_TILES = new Set([
  'grass',
  'path',
  'tilled_soil',
  'crop_seedling',
  'crop_bloom',
  'wildflowers',
  'lavender',
  'mushroom_patch',
  'moss',
  'fallen_leaves',
  'tree',
  'tree_dense',
  'stone',
  'water',
  'water_alt',
  'ocean_shore',
  'bridge',
  'swamp',
  'wind_gust',
])

const TILE_ALIASES = new Map([
  ['vertically flipped ocean_shore', 'ocean_shore'],
  ['flipped ocean_shore', 'ocean_shore'],
  ['vertical ocean_shore', 'ocean_shore'],
])

function decodeXml(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function colName(n) {
  let s = ''
  while (n > 0) {
    const mod = (n - 1) % 26
    s = String.fromCharCode(65 + mod) + s
    n = Math.floor((n - mod) / 26)
  }
  return s
}

function readZipText(file) {
  try {
    return cp.execFileSync('unzip', ['-p', xlsxPath, file], { encoding: 'utf8' })
  } catch {
    return ''
  }
}

function readSheetCells() {
  const sheetXml = readZipText('xl/worksheets/sheet1.xml')
  const sharedXml = readZipText('xl/sharedStrings.xml')
  const sharedStrings = [...sharedXml.matchAll(/<si[^>]*>(.*?)<\/si>/gs)].map((match) =>
    decodeXml([...match[1].matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map((text) => text[1]).join('')),
  )

  const cells = new Map()
  for (const match of sheetXml.matchAll(/<c\s+([^>]*)>(.*?)<\/c>/gs)) {
    const attrs = match[1]
    const body = match[2]
    const ref = attrs.match(/r="([^"]+)"/)?.[1]
    if (!ref) continue

    const type = attrs.match(/t="([^"]+)"/)?.[1]
    let value = ''
    if (type === 's') {
      const index = Number(body.match(/<v>(.*?)<\/v>/)?.[1])
      value = sharedStrings[index] ?? ''
    } else if (type === 'inlineStr') {
      value = decodeXml([...body.matchAll(/<t[^>]*>(.*?)<\/t>/gs)].map((text) => text[1]).join(''))
    } else {
      value = decodeXml(body.match(/<v>(.*?)<\/v>/)?.[1] ?? '')
    }

    cells.set(ref, value.trim())
  }
  return cells
}

const cells = readSheetCells()
const map = []
const houseCells = new Map()
const packagePositions = []
const npcPositions = []
let playerStart = null

for (let row = 0; row < MAP_ROWS; row++) {
  const mapRow = []
  for (let col = 0; col < MAP_COLS; col++) {
    const ref = `${colName(col + 2)}${row + 2}`
    const rawValue = cells.get(ref) || 'grass'
    const value = TILE_ALIASES.get(rawValue) ?? rawValue

    const houseMatch = value.match(/^HOUSE_(\d+)$/)
    const packageMatch = value.match(/^PACKAGE_(\d+)$/)
    const npcMatch = value.match(/^NPC_(\d+)$/)
    if (houseMatch) {
      const houseIndex = Number(houseMatch[1]) - 1
      if (!houseCells.has(houseIndex)) houseCells.set(houseIndex, [])
      houseCells.get(houseIndex).push({ row, col })
      mapRow.push('tree_dense')
    } else if (packageMatch) {
      packagePositions[Number(packageMatch[1]) - 1] = { col, row }
      mapRow.push('grass')
    } else if (npcMatch) {
      npcPositions[Number(npcMatch[1]) - 1] = { col, row }
      mapRow.push('grass')
    } else if (value === 'PLAYER_START') {
      playerStart = { col, row }
      mapRow.push('path')
    } else if (VALID_TILES.has(value)) {
      mapRow.push(value)
    } else {
      throw new Error(`Unknown tile or marker "${value}" at row ${row}, col ${col}`)
    }
  }
  map.push(mapRow)
}

const housePositions = Array.from({ length: 4 }, (_, index) => {
  const cells = houseCells.get(index) || []
  if (cells.length === 0) throw new Error(`HOUSE_${index + 1} is missing from ${xlsxPath}`)
  return {
    col: Math.min(...cells.map((cell) => cell.col)),
    row: Math.min(...cells.map((cell) => cell.row)),
  }
})

for (let index = 0; index < 4; index++) {
  if (!packagePositions[index]) throw new Error(`PACKAGE_${index + 1} is missing from ${xlsxPath}`)
}
for (let index = 0; index < 4; index++) {
  if (!npcPositions[index]) throw new Error(`NPC_${index + 1} is missing from ${xlsxPath}`)
}
if (!playerStart) throw new Error(`PLAYER_START is missing from ${xlsxPath}`)

const mapLiteral = map
  .map((row) => `  [${row.map((tile) => `'${tile}'`).join(', ')}],`)
  .join('\n')

const housesLiteral = housePositions
  .map((position, index) => {
    const comments = [
      'north-west cottage',
      'north-east cottage',
      'south-west cottage',
      'south-east cottage',
    ]
    return `  { col: ${String(position.col).padEnd(2)}, row: ${String(position.row).padEnd(2)} },   // ${comments[index]}`
  })
  .join('\n')

const packagesLiteral = packagePositions
  .map((position, index) =>
    `  { col: ${String(position.col).padEnd(2)}, row: ${String(position.row).padEnd(2)} },   // package ${index + 1}`,
  )
  .join('\n')

const npcLiteral = npcPositions
  .map((position, index) =>
    `  { id: NPC_CONFIGS[${index}].id, col: ${String(position.col).padEnd(2)}, row: ${String(position.row).padEnd(2)} },`,
  )
  .join('\n')

let config = fs.readFileSync(configPath, 'utf8')

config = config.replace(
  /export const HOUSE_POSITIONS = \[[\s\S]*?\]\n\n\/\/ ── Tile rules/,
  `export const HOUSE_POSITIONS = [\n${housesLiteral}\n]\n\n// ── Tile rules`,
)

config = config.replace(
  /(?:const MAP_TILES: TileType\[\]\[\] = \[[\s\S]*?export const MAP_DATA: TileType\[\]\[\] = buildMap\(\))|(?:function buildMap\(\): TileType\[\]\[\] \{[\s\S]*?\n\}\n\nexport const MAP_DATA: TileType\[\]\[\] = buildMap\(\))/,
  `const MAP_TILES: TileType[][] = [\n${mapLiteral}\n]\n\nfunction buildMap(): TileType[][] {\n  return MAP_TILES.map((row) => [...row])\n}\n\nexport const MAP_DATA: TileType[][] = buildMap()`,
)

config = config.replace(
  /export const PACKAGE_POSITIONS = \[[\s\S]*?\]\n\nexport const PLAYER_START = \{ col: \d+, row: \d+ \}/,
  `export const PACKAGE_POSITIONS = [\n${packagesLiteral}\n]\n\nexport const NPC_POSITIONS = [\n${npcLiteral}\n]\n\nexport const PLAYER_START = { col: ${playerStart.col}, row: ${playerStart.row} }`,
)

fs.writeFileSync(configPath, config)

console.log(`Imported ${xlsxPath} into ${configPath}`)
console.log(`Houses: ${JSON.stringify(housePositions)}`)
console.log(`Packages: ${JSON.stringify(packagePositions)}`)
console.log(`NPCs: ${JSON.stringify(npcPositions)}`)
console.log(`Player: ${JSON.stringify(playerStart)}`)
