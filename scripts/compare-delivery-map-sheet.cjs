const fs = require('fs')
const cp = require('child_process')
const vm = require('vm')
const ts = require('../frontend/node_modules/typescript')

const xlsxPath = process.argv[2] || 'docs/delivery-map-current.xlsx'
const configPath = 'frontend/src/games/delivery-on-the-wind/data/deliveryConfig.ts'

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

    cells.set(ref, value)
  }
  return cells
}

function readConfig() {
  const source = fs.readFileSync(configPath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const sandbox = { exports: {}, require, console }
  vm.createContext(sandbox)
  vm.runInContext(compiled, sandbox, { filename: configPath })
  return sandbox.exports
}

const cells = readSheetCells()
const {
  MAP_DATA,
  MAP_COLS,
  MAP_ROWS,
  HOUSE_POSITIONS,
  HOUSE_SIZE,
  PACKAGE_POSITIONS,
  NPC_POSITIONS,
  PLAYER_START,
} = readConfig()

const houseLabels = new Map()
HOUSE_POSITIONS.forEach((position, index) => {
  for (let row = position.row; row < position.row + HOUSE_SIZE; row++) {
    for (let col = position.col; col < position.col + HOUSE_SIZE; col++) {
      houseLabels.set(`${row},${col}`, `HOUSE_${index + 1}`)
    }
  }
})

const packageLabels = new Map(
  PACKAGE_POSITIONS.map((position, index) => [`${position.row},${position.col}`, `PACKAGE_${index + 1}`]),
)
const npcLabels = new Map(
  (NPC_POSITIONS ?? []).map((position, index) => [`${position.row},${position.col}`, `NPC_${index + 1}`]),
)

function expectedCell(row, col) {
  const key = `${row},${col}`
  if (key === `${PLAYER_START.row},${PLAYER_START.col}`) return 'PLAYER_START'
  if (packageLabels.has(key)) return packageLabels.get(key)
  if (npcLabels.has(key)) return npcLabels.get(key)
  if (houseLabels.has(key)) return houseLabels.get(key)
  return MAP_DATA[row][col]
}

const diffs = []
for (let row = 0; row < MAP_ROWS; row++) {
  for (let col = 0; col < MAP_COLS; col++) {
    const ref = `${colName(col + 2)}${row + 2}`
    const excel = cells.get(ref) || ''
    const code = expectedCell(row, col)
    const normalizedExcel = TILE_ALIASES.get(excel) ?? excel
    if (normalizedExcel !== code) diffs.push({ row, col, excel, code })
  }
}

console.log(JSON.stringify({
  xlsxPath,
  configPath,
  mapRows: MAP_ROWS,
  mapCols: MAP_COLS,
  diffCount: diffs.length,
  firstDiffs: diffs.slice(0, 30),
}, null, 2))
