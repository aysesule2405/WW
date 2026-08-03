const fs = require('fs')
const os = require('os')
const path = require('path')
const vm = require('vm')
const cp = require('child_process')
const ts = require('../frontend/node_modules/typescript')

const root = path.resolve(__dirname, '..')
const mapPath = path.join(root, 'frontend/src/games/delivery-on-the-wind/data/mapRegistry.ts')
const outputPath = path.resolve(process.argv[2] || path.join(root, 'docs/delivery-on-the-wind-map-preview.png'))
const tileRoot = path.join(root, 'frontend/public/assets/new_tiles')
const tileSize = 16

function readMap() {
  const source = fs.readFileSync(mapPath, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const sandbox = { exports: {}, require, console }
  vm.createContext(sandbox)
  vm.runInContext(compiled, sandbox, { filename: mapPath })
  return sandbox.exports.MEADOW_MAP
}

const map = readMap()
const layers = []
const add = (file, x, y, crop = null) => layers.push({
  path: path.join(tileRoot, file),
  x,
  y,
  ...(crop ?? {}),
})

function grassFile(row, col) {
  return (row * map.cols + col) % 4 < 2 ? 'grass.png' : 'medium_grass.png'
}

function groundFile(tile, row, col) {
  const index = (row * map.cols + col) % 8
  switch (tile) {
    case 'grass': return grassFile(row, col)
    case 'medium_grass': return 'medium_grass.png'
    case 'dark_grass': return 'dark_grass.png'
    case 'moss_grass': return 'moss_grass.png'
    case 'dark_grass_leaves': return 'dark_grass_leaves.png'
    case 'grass_flowers': return `grass_flowers_${(index % 3) + 1}.png`
    case 'grass_patch': return `grass_patch_${(index % 2) + 1}.png`
    case 'soil':
    case 'tilled_soil': return 'soil.png'
    case 'path':
    case 'stone_path': return 'stone_path_fixed.png'
    case 'water': return 'water_1.png'
    case 'water_alt': return 'water_2.png'
    case 'water_grass':
    case 'ocean_shore':
    case 'swamp': return 'water_grass.png'
    case 'water_stones': return 'water_stones.png'
    case 'water_shell': return 'water_shell.png'
    case 'bridge':
    case 'horizontal_bridge_left':
    case 'horizontal_bridge_right': return index % 2 === 0 ? 'bridge_1.png' : 'bridge_2.png'
    case 'town_square': return `stone_path_${(index % 8) + 1}.png`
    default: return grassFile(row, col)
  }
}

const overlays = {
  tree: ['tree_1.png', 0, -80],
  tree_dense: ['tree_3.png', 0, -80],
  tree_round: ['tree_1.png', 0, -80],
  tree_fruit: ['tree_2.png', 0, -80],
  tree_pine: ['tree_3.png', 0, -80],
  mystical_tree: ['mystical_tree.png', -37, -96],
  small_bush: ['small_bush.png', -8, -16],
  large_bush: ['large_bush.png', -16, -32],
  magic_tower: ['magic_tower.png', -24, -176],
  old_town_hall: ['old_town_hall.png', -88, -144],
  old_truck: ['old_truck.png', -24, -82],
  tunnel: ['secret_tunel.png', -8, -32],
  town_square: ['town_square.png', 0, 0],
  horizontal_bridge_left: ['horizontal_bridge_left.png', 0, 0],
  horizontal_bridge_right: ['horizontal_bridge_right.png', 0, 0],
}

for (let row = 0; row < map.rows; row++) {
  for (let col = 0; col < map.cols; col++) {
    const file = groundFile(map.tiles[row][col], row, col)
    const crop = file === 'stone_path_fixed.png'
      ? {
          sourceX: (col % 2) * tileSize,
          sourceY: (row % 2) * tileSize,
          sourceWidth: tileSize,
          sourceHeight: tileSize,
        }
      : null
    add(file, col * tileSize, row * tileSize, crop)
  }
}

for (let row = 0; row < map.rows; row++) {
  for (let col = 0; col < map.cols; col++) {
    const overlay = overlays[map.tiles[row][col]]
    if (overlay) add(overlay[0], col * tileSize + overlay[1], row * tileSize + overlay[2])
  }
}

map.housePositions.forEach((house, index) => {
  const file = path.join(tileRoot, `house_${index + 1}.png`)
  const size = cp.execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' })
  const width = Number(size.match(/pixelWidth: (\d+)/)?.[1])
  const height = Number(size.match(/pixelHeight: (\d+)/)?.[1])
  layers.push({
    path: file,
    x: (house.col + 4) * tileSize - width / 2,
    y: (house.row + 8) * tileSize - 10 - height,
  })
})

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'delivery-map-preview-'))
const manifestPath = path.join(temporaryDirectory, 'manifest.json')
fs.writeFileSync(manifestPath, JSON.stringify({
  width: map.cols * tileSize,
  height: map.rows * tileSize,
  layers,
}))

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
const result = cp.spawnSync('swift', [path.join(__dirname, 'render-delivery-map-preview.swift'), manifestPath, outputPath], {
  encoding: 'utf8',
})
fs.rmSync(temporaryDirectory, { recursive: true, force: true })

if (result.stdout) process.stdout.write(result.stdout)
if (result.stderr) process.stderr.write(result.stderr)
if (result.error) console.error(result.error)
if (result.status !== 0) {
  console.error(`Swift renderer failed (status=${result.status}, signal=${result.signal ?? 'none'})`)
  process.exit(result.status ?? 1)
}
console.log(`Wrote ${outputPath}`)
