const fs = require('fs')
const path = require('path')
const vm = require('vm')
const cp = require('child_process')
const ts = require('../frontend/node_modules/typescript')

const root = path.resolve(__dirname, '..')
const configPath = path.join(root, 'frontend/src/games/delivery-on-the-wind/data/deliveryConfig.ts')
const outDir = path.join(root, 'docs')
const buildDir = path.join(root, '.tmp-delivery-map-xlsx')
const xlsxPath = path.join(outDir, 'delivery-map-current.xlsx')
const csvPath = path.join(outDir, 'delivery-map-current.csv')

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

const {
  MAP_DATA,
  MAP_COLS,
  MAP_ROWS,
  HOUSE_POSITIONS,
  PACKAGE_POSITIONS,
  PLAYER_START,
  HOUSE_SIZE,
  TILE_RULES,
} = sandbox.exports

const tileStyles = {
  grass: 'C6E0B4',
  path: 'C6A879',
  tilled_soil: 'A77A4D',
  crop_seedling: '8FBC5A',
  crop_bloom: 'E6B8C7',
  wildflowers: 'F4B183',
  lavender: 'B4A7D6',
  mushroom_patch: 'C0504D',
  moss: '93A46F',
  fallen_leaves: 'D9A066',
  tree: '548235',
  tree_dense: '375623',
  stone: 'A5A5A5',
  water: '5B9BD5',
  water_alt: '9DC3E6',
  ocean_shore: 'BDD7EE',
  bridge: '806000',
  swamp: '667A3D',
  wind_gust: 'DAEAF7',
}

const styleOrder = [
  'default',
  ...Object.keys(tileStyles),
  'player',
  'package',
  'house',
]
const styleIndex = Object.fromEntries(styleOrder.map((name, index) => [name, index]))

const houseLabels = new Map()
for (let i = 0; i < HOUSE_POSITIONS.length; i++) {
  const { col, row } = HOUSE_POSITIONS[i]
  for (let r = row; r < row + HOUSE_SIZE; r++) {
    for (let c = col; c < col + HOUSE_SIZE; c++) {
      houseLabels.set(`${r},${c}`, `HOUSE_${i + 1}`)
    }
  }
}

const packageLabels = new Map(PACKAGE_POSITIONS.map((pos, i) => [`${pos.row},${pos.col}`, `PACKAGE_${i + 1}`]))
const playerKey = `${PLAYER_START.row},${PLAYER_START.col}`

const getCell = (row, col) => {
  const key = `${row},${col}`
  if (key === playerKey) return { value: 'PLAYER_START', style: 'player' }
  if (packageLabels.has(key)) return { value: packageLabels.get(key), style: 'package' }
  if (houseLabels.has(key)) return { value: houseLabels.get(key), style: 'house' }
  const tile = MAP_DATA[row][col]
  return { value: tile, style: tile }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function columnName(index) {
  let name = ''
  let n = index
  while (n > 0) {
    const mod = (n - 1) % 26
    name = String.fromCharCode(65 + mod) + name
    n = Math.floor((n - mod) / 26)
  }
  return name
}

function cellRef(row, col) {
  return `${columnName(col)}${row}`
}

fs.mkdirSync(outDir, { recursive: true })

const csvRows = []
csvRows.push(['row/col', ...Array.from({ length: MAP_COLS }, (_, col) => col)].join(','))
for (let row = 0; row < MAP_ROWS; row++) {
  const values = [row]
  for (let col = 0; col < MAP_COLS; col++) values.push(getCell(row, col).value)
  csvRows.push(values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
}
fs.writeFileSync(csvPath, `${csvRows.join('\n')}\n`)

fs.rmSync(buildDir, { recursive: true, force: true })
fs.mkdirSync(path.join(buildDir, 'xl/worksheets'), { recursive: true })
fs.mkdirSync(path.join(buildDir, 'xl/_rels'), { recursive: true })
fs.mkdirSync(path.join(buildDir, '_rels'), { recursive: true })
fs.mkdirSync(path.join(buildDir, 'docProps'), { recursive: true })

const rows = []
rows.push(`<row r="1" ht="24" customHeight="1"><c r="A1" t="inlineStr"><is><t>row/col</t></is></c>${Array.from({ length: MAP_COLS }, (_, col) => {
  const ref = cellRef(1, col + 2)
  return `<c r="${ref}" t="inlineStr"><is><t>${col}</t></is></c>`
}).join('')}</row>`)

for (let row = 0; row < MAP_ROWS; row++) {
  const excelRow = row + 2
  const cells = [`<c r="A${excelRow}" t="inlineStr"><is><t>${row}</t></is></c>`]
  for (let col = 0; col < MAP_COLS; col++) {
    const { value, style } = getCell(row, col)
    cells.push(
      `<c r="${cellRef(excelRow, col + 2)}" s="${styleIndex[style] ?? 0}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`,
    )
  }
  rows.push(`<row r="${excelRow}" ht="24" customHeight="1">${cells.join('')}</row>`)
}

const legendStart = MAP_ROWS + 5
const legendRows = [
  ['Tile/Object', 'Air passable', 'Speed', 'Notes'],
  ...Object.keys(tileStyles).map((tile) => [
    tile,
    TILE_RULES[tile]?.airPassable ? 'yes' : 'no',
    TILE_RULES[tile]?.speedMultiplier ?? '',
    'Edit map cells using this exact tile name.',
  ]),
  ['PLAYER_START', 'yes', '', 'Move by changing PLAYER_START in deliveryConfig.ts.'],
  ['PACKAGE_1..4', 'yes', '', 'Move by changing PACKAGE_POSITIONS in deliveryConfig.ts.'],
  ['HOUSE_1..4', 'no center, deliver near edge', '', 'Move by changing HOUSE_POSITIONS in deliveryConfig.ts.'],
]

for (let i = 0; i < legendRows.length; i++) {
  const excelRow = legendStart + i
  rows.push(`<row r="${excelRow}">${legendRows[i].map((value, col) =>
    `<c r="${cellRef(excelRow, col + 1)}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`,
  ).join('')}</row>`)
}

const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"><pane xSplit="1" ySplit="1" topLeftCell="B2" activePane="bottomRight" state="frozen"/></sheetView></sheetViews>
  <cols><col min="1" max="1" width="9" customWidth="1"/><col min="2" max="${MAP_COLS + 1}" width="15" customWidth="1"/></cols>
  <sheetData>${rows.join('')}</sheetData>
</worksheet>`

const fills = styleOrder.map((name) => {
  if (name === 'default') return '<fill><patternFill patternType="none"/></fill>'
  const color = name === 'player'
    ? 'FFD966'
    : name === 'package'
      ? 'F4CCCC'
      : name === 'house'
        ? '674EA7'
        : tileStyles[name]
  return `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`
})

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="10"/><name val="Aptos"/></font></fonts>
  <fills count="${fills.length}">${fills.join('')}</fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="${styleOrder.length}">${styleOrder.map((_, i) => `<xf numFmtId="0" fontId="0" fillId="${i}" borderId="0" xfId="0" applyFill="1"/>`).join('')}</cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`

const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Delivery Map" sheetId="1" r:id="rId1"/></sheets>
</workbook>`

const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Codex</Application>
</Properties>`

const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Delivery on the Wind Current Map</dc:title>
  <dc:creator>Codex</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
</cp:coreProperties>`

fs.writeFileSync(path.join(buildDir, '[Content_Types].xml'), contentTypesXml)
fs.writeFileSync(path.join(buildDir, '_rels/.rels'), rootRelsXml)
fs.writeFileSync(path.join(buildDir, 'xl/workbook.xml'), workbookXml)
fs.writeFileSync(path.join(buildDir, 'xl/styles.xml'), stylesXml)
fs.writeFileSync(path.join(buildDir, 'xl/_rels/workbook.xml.rels'), workbookRelsXml)
fs.writeFileSync(path.join(buildDir, 'xl/worksheets/sheet1.xml'), sheetXml)
fs.writeFileSync(path.join(buildDir, 'docProps/app.xml'), appXml)
fs.writeFileSync(path.join(buildDir, 'docProps/core.xml'), coreXml)

fs.rmSync(xlsxPath, { force: true })
cp.execFileSync('zip', ['-qr', xlsxPath, '.'], { cwd: buildDir })
fs.rmSync(buildDir, { recursive: true, force: true })

console.log(`Wrote ${xlsxPath}`)
console.log(`Wrote ${csvPath}`)
