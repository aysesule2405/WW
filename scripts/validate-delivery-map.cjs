const fs = require('fs')
const path = require('path')
const vm = require('vm')
const ts = require('../frontend/node_modules/typescript')

const root = path.resolve(__dirname, '..')

function readExports(relativePath) {
  const filename = path.join(root, relativePath)
  const source = fs.readFileSync(filename, 'utf8')
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText
  const sandbox = { exports: {}, require, console }
  vm.createContext(sandbox)
  vm.runInContext(compiled, sandbox, { filename })
  return sandbox.exports
}

const { MAP_REGISTRY } = readExports('frontend/src/games/delivery-on-the-wind/data/mapRegistry.ts')
const {
  HOUSE_SIZE,
  TILE_RULES,
  WATER_TILE_TYPES,
  SOLID_TILE_TYPES,
} = readExports('frontend/src/games/delivery-on-the-wind/data/deliveryConfig.ts')

function validateMap(map) {
  const failures = []
  const assert = (condition, message) => {
    if (!condition) failures.push(message)
  }

  assert(map.cols === 96, `expected 96 columns, found ${map.cols}`)
  assert(map.rows === 48, `expected 48 rows, found ${map.rows}`)
  assert(map.tiles.length === map.rows, 'tile row count does not match map rows')
  map.tiles.forEach((row, index) => {
    assert(row.length === map.cols, `row ${index} has ${row.length} columns`)
  })

  const houseCells = new Set()
  for (const house of map.housePositions) {
    for (let row = house.row; row < house.row + HOUSE_SIZE; row++) {
      for (let col = house.col; col < house.col + HOUSE_SIZE; col++) houseCells.add(`${col},${row}`)
    }
  }

  const isAirPassable = (col, row) => {
    if (col < 0 || col >= map.cols || row < 0 || row >= map.rows) return false
    if (houseCells.has(`${col},${row}`)) return false
    return Boolean(TILE_RULES[map.tiles[row][col]]?.airPassable)
  }

  const start = map.playerStart
  assert(isAirPassable(start.col, start.row), 'player start is not air-passable')

  const queue = [start]
  const visited = new Set([`${start.col},${start.row}`])
  for (let index = 0; index < queue.length; index++) {
    const cell = queue[index]
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const col = cell.col + dx
      const row = cell.row + dy
      const key = `${col},${row}`
      if (!visited.has(key) && isAirPassable(col, row)) {
        visited.add(key)
        queue.push({ col, row })
      }
    }
  }

  for (const [index, position] of map.packagePositions.entries()) {
    assert(visited.has(`${position.col},${position.row}`), `package ${index + 1} is unreachable`)
  }
  for (const npc of map.npcPositions) {
    assert(visited.has(`${npc.col},${npc.row}`), `NPC ${npc.id} is unreachable`)
  }
  for (const [index, house] of map.housePositions.entries()) {
    let reachableApproach = false
    for (let row = house.row - 1; row <= house.row + HOUSE_SIZE; row++) {
      for (let col = house.col - 1; col <= house.col + HOUSE_SIZE; col++) {
        if (!houseCells.has(`${col},${row}`) && visited.has(`${col},${row}`)) reachableApproach = true
      }
    }
    assert(reachableApproach, `house ${index + 1} has no reachable delivery approach`)
  }

  const counts = {}
  for (const row of map.tiles) {
    for (const tile of row) counts[tile] = (counts[tile] ?? 0) + 1
  }

  assert(counts.town_square === 1, `expected one town-square anchor, found ${counts.town_square ?? 0}`)
  assert(counts.horizontal_bridge_left === 2, `expected two left bridge anchors, found ${counts.horizontal_bridge_left ?? 0}`)
  assert(counts.horizontal_bridge_right === 2, `expected two right bridge anchors, found ${counts.horizontal_bridge_right ?? 0}`)
  for (const tile of WATER_TILE_TYPES) {
    assert(TILE_RULES[tile]?.airPassable, `${tile} must be flyable for Kiki`)
  }
  for (const tile of SOLID_TILE_TYPES) {
    assert(!TILE_RULES[tile]?.airPassable, `${tile} must remain a solid obstacle`)
  }

  let reachableWaterCells = 0
  for (let row = 0; row < map.rows; row++) {
    for (let col = 0; col < map.cols; col++) {
      if (WATER_TILE_TYPES.includes(map.tiles[row][col]) && visited.has(`${col},${row}`)) reachableWaterCells++
    }
  }
  assert(reachableWaterCells > 0, 'no water cells are reachable by flight')

  return {
    id: map.id,
    map: `${map.cols}x${map.rows}`,
    reachableCells: visited.size,
    reachableWaterCells,
    houses: map.housePositions.length,
    packages: map.packagePositions.length,
    npcs: map.npcPositions.length,
    landmarkAnchors: {
      townSquare: counts.town_square ?? 0,
      bridgeLeft: counts.horizontal_bridge_left ?? 0,
      bridgeRight: counts.horizontal_bridge_right ?? 0,
    },
    failures,
  }
}

const results = MAP_REGISTRY.filter((map) => map.available).map(validateMap)
console.log(JSON.stringify(results, null, 2))
if (results.some((result) => result.failures.length)) process.exitCode = 1
