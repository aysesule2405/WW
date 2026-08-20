// ── Types ─────────────────────────────────────────────────────────────────────

export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type Owner = 'player' | 'ai' | null
export type Difficulty = 'easy' | 'medium' | 'hard'
export type AIMode = 'local' | 'gemini'
export type WildCardType = 'eclipse-shield' | 'moonrise' | 'star-burst' | 'crescent-charm'

export interface SpaceDef {
  id: number
  x: number       // pixel x in scene (column * CELL_SIZE, or radial position for ring layouts)
  y: number       // pixel y in scene (row * CELL_SIZE, or radial position for ring layouts)
  adjacentIds: number[]
  ring?: number   // for ring-topology boards: 0 = innermost hub, increasing outward
}

export interface BoardTheme {
  bgTint: number
  starDensity: number
  accentColor: number
}

export interface BoardLayout {
  level: number
  label: string
  spaces: SpaceDef[]
  theme?: BoardTheme
  longLinks?: [number, number][]   // edges rendered as visually distinct "bridge" connections
}

export interface PlacedCard {
  spaceId: number
  phase: Phase
  owner: Owner
  chainId: number | null
}

export interface ScoreState {
  player: number
  ai: number
  playerCards: number
  aiCards: number
}

export interface WildCard {
  type: WildCardType
  label: string
  description: string
}

export const WILD_CARDS: Record<WildCardType, WildCard> = {
  'eclipse-shield':  { type: 'eclipse-shield',  label: 'Eclipse Shield',  description: "Block the AI's next scoring move." },
  'moonrise':        { type: 'moonrise',         label: 'Moonrise',        description: 'Duplicate one card in your hand.' },
  'star-burst':      { type: 'star-burst',       label: 'Star Burst',      description: 'Remove one AI card from the board.' },
  'crescent-charm':  { type: 'crescent-charm',   label: 'Crescent Charm',  description: 'Your next placement scores double.' },
}

// ── Moon phase names ──────────────────────────────────────────────────────────

export const PHASE_NAMES: Record<Phase, string> = {
  1: 'New Moon',
  2: 'Waxing Crescent',
  3: 'First Quarter',
  4: 'Waxing Gibbous',
  5: 'Full Moon',
  6: 'Waning Gibbous',
  7: 'Third Quarter',
  8: 'Waning Crescent',
}

// ── Moon cycle logic ──────────────────────────────────────────────────────────

// Circular moon cycle: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 1
export function isConsecutive(a: Phase, b: Phase): boolean {
  const diff = Math.abs(a - b)
  return Math.min(diff, 8 - diff) === 1
}

// The next/previous phase in the fixed lunar direction (wraps 8→1 and 1→8).
// Used to enforce that a "moon cycle" chain reads monotonically in one
// direction end-to-end, rather than just being pairwise-adjacent values.
export function nextPhase(p: Phase): Phase { return (p === 8 ? 1 : p + 1) as Phase }
export function prevPhase(p: Phase): Phase { return (p === 1 ? 8 : p - 1) as Phase }

// Complementary pairs (differ by exactly 4 in the 8-phase cycle):
//   1 + 5,  2 + 6,  3 + 7,  4 + 8
export function isComplementary(a: Phase, b: Phase): boolean {
  return Math.abs(a - b) === 4
}

// Legacy alias so old call-sites don't break during migration
export const isOpposite = isComplementary

// Returns the complementary phase for a given phase
export function complementaryPhase(p: Phase): Phase {
  return ((((p - 1) + 4) % 8) + 1) as Phase
}

// ── Seeded RNG ─────────────────────────────────────────────────────────────────
// Board layouts are generated once at module load using a fixed seed per level,
// so the same level always produces the same board on every page load (a
// stakeholder retesting level 5 should see "Crescent Cove" every time, not a
// reshuffled board) while still giving each level an organic, non-grid shape.

function mulberry32(seed: number): () => number {
  let s = seed
  return function () {
    s |= 0
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Board layouts ─────────────────────────────────────────────────────────────

export const CELL = 110

function isConnectedCellSet(cells: Set<string>, start: string, dirs: [number, number][]): boolean {
  if (cells.size === 0) return true
  const visited = new Set([start])
  const stack = [start]
  while (stack.length) {
    const key = stack.pop()!
    const [r, c] = key.split(',').map(Number)
    for (const [dr, dc] of dirs) {
      const nk = `${r + dr},${c + dc}`
      if (cells.has(nk) && !visited.has(nk)) { visited.add(nk); stack.push(nk) }
    }
  }
  return visited.size === cells.size
}

function link(spaces: SpaceDef[], a: number, b: number) {
  const sa = spaces.find(s => s.id === a)!
  const sb = spaces.find(s => s.id === b)!
  if (!sa.adjacentIds.includes(b)) sa.adjacentIds.push(b)
  if (!sb.adjacentIds.includes(a)) sb.adjacentIds.push(a)
}

// Rectangular grid, 4-directional adjacency, optional skipped cells (by linear index).
function grid(level: number, label: string, rows: number, cols: number, skip: number[] = []): BoardLayout {
  const spaces: SpaceDef[] = []
  let id = 0
  const gridArr: (number | null)[][] = []

  for (let r = 0; r < rows; r++) {
    gridArr[r] = []
    for (let c = 0; c < cols; c++) {
      const linearIdx = r * cols + c
      if (skip.includes(linearIdx)) {
        gridArr[r][c] = null
      } else {
        gridArr[r][c] = id++
        spaces.push({ id: gridArr[r][c]!, x: c * CELL, y: r * CELL, adjacentIds: [] })
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sid = gridArr[r]?.[c]
      if (sid == null) continue
      const space = spaces.find(s => s.id === sid)!
      const neighbors = [
        gridArr[r - 1]?.[c], gridArr[r + 1]?.[c],
        gridArr[r]?.[c - 1], gridArr[r]?.[c + 1],
      ]
      space.adjacentIds = neighbors.filter((n): n is number => n != null)
    }
  }

  return { level, label, spaces }
}

// Organic flood-fill blob: grows a random connected blob of `finalSize + holes`
// cells on a loose grid, punches `holes` interior cells back out, then jitters
// each surviving cell's pixel position slightly so it doesn't read as grid-snapped.
function organicLayout(
  level: number, label: string, seed: number, finalSize: number, holes = 0,
): BoardLayout {
  const rng = mulberry32(seed)
  const growTarget = finalSize + holes
  const DIM = Math.max(3, Math.ceil(Math.sqrt(growTarget * 1.7)))
  const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]

  const included = new Set<string>()
  const frontier: [number, number][] = []
  const startR = Math.floor(rng() * DIM)
  const startC = Math.floor(rng() * DIM)
  included.add(`${startR},${startC}`)
  frontier.push([startR, startC])

  while (included.size < growTarget) {
    const pivot = frontier[Math.floor(rng() * frontier.length)]
    const neighbors = DIRS
      .map(([dr, dc]) => [pivot[0] + dr, pivot[1] + dc] as [number, number])
      .filter(([r, c]) => r >= 0 && r < DIM && c >= 0 && c < DIM && !included.has(`${r},${c}`))
    if (neighbors.length === 0) continue
    const chosen = neighbors[Math.floor(rng() * neighbors.length)]
    included.add(`${chosen[0]},${chosen[1]}`)
    frontier.push(chosen)
  }

  // Punch a few interior holes (cells fully surrounded on all 4 sides).
  // Each removal is verified with a full connectivity check and reverted if
  // it would split the board — a "surrounded" cell isn't always safe to
  // remove (it can still be an articulation point in an oddly-shaped blob).
  let holesLeft = holes
  for (const key of Array.from(included)) {
    if (holesLeft <= 0) break
    const [r, c] = key.split(',').map(Number)
    const surrounded = DIRS.every(([dr, dc]) => included.has(`${r + dr},${c + dc}`))
    if (!surrounded || rng() >= 0.6) continue

    included.delete(key)
    const probe = included.values().next().value
    if (probe && isConnectedCellSet(included, probe, DIRS)) {
      holesLeft--
    } else {
      included.add(key) // would have disconnected the board — revert
    }
  }

  const cells = Array.from(included)
    .map(k => { const [r, c] = k.split(',').map(Number); return { r, c } })
    .sort((a, b) => a.r - b.r || a.c - b.c)

  const minR = Math.min(...cells.map(c => c.r))
  const minC = Math.min(...cells.map(c => c.c))
  const cellMap = new Map<string, number>()
  cells.forEach(({ r, c }, i) => cellMap.set(`${r},${c}`, i))

  const jitter = 14
  const spaces: SpaceDef[] = cells.map(({ r, c }, i) => {
    const adjacentIds: number[] = []
    for (const [dr, dc] of DIRS) {
      const adjId = cellMap.get(`${r + dr},${c + dc}`)
      if (adjId !== undefined) adjacentIds.push(adjId)
    }
    const jx = (rng() - 0.5) * jitter
    const jy = (rng() - 0.5) * jitter
    return { id: i, x: (c - minC) * CELL + jx, y: (r - minR) * CELL + jy, adjacentIds }
  })

  return { level, label, spaces }
}

// Two separate organic blobs joined by a single narrow bridge — "Crescent Cove".
function twoLobeLayout(level: number, label: string, seed: number, sizeA: number, sizeB: number): BoardLayout {
  const lobeA = organicLayout(level, label, seed, sizeA)
  const lobeB = organicLayout(level, label, seed + 977, sizeB)

  const offsetX = Math.max(...lobeA.spaces.map(s => s.x)) + CELL * 2.1
  const idOffset = lobeA.spaces.length

  const spaces: SpaceDef[] = [
    ...lobeA.spaces,
    ...lobeB.spaces.map(s => ({
      id: s.id + idOffset,
      x: s.x + offsetX,
      y: s.y,
      adjacentIds: s.adjacentIds.map(a => a + idOffset),
    })),
  ]

  // Bridge: connect lobeA's rightmost cell to lobeB's leftmost cell
  const aRight = lobeA.spaces.reduce((best, s) => (s.x > best.x ? s : best))
  const bLeft  = lobeB.spaces.reduce((best, s) => (s.x < best.x ? s : best))
  link(spaces, aRight.id, bLeft.id + idOffset)

  return { level, label, spaces, longLinks: [[aRight.id, bLeft.id + idOffset]] }
}

// Concentric rings around a central hub. ringCounts[0] is the hub (usually 1),
// each subsequent ring connects to its own neighbors plus spokes inward.
function ringLayout(level: number, label: string, seed: number, ringCounts: number[]): BoardLayout {
  const rng = mulberry32(seed)
  const spaces: SpaceDef[] = []
  const ringNodeIds: number[][] = []
  let id = 0
  const baseRadius = CELL

  ringCounts.forEach((count, ringIdx) => {
    const ids: number[] = []
    const radius = ringIdx === 0 ? 0 : baseRadius * ringIdx
    const angleOffset = rng() * Math.PI * 2
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + angleOffset
      const x = Math.round(Math.cos(angle) * radius)
      const y = Math.round(Math.sin(angle) * radius)
      spaces.push({ id, x, y, adjacentIds: [], ring: ringIdx })
      ids.push(id)
      id++
    }
    ringNodeIds.push(ids)
  })

  // Connect nodes within each ring to their immediate neighbors
  for (const ids of ringNodeIds) {
    if (ids.length < 2) continue
    ids.forEach((sid, i) => link(spaces, sid, ids[(i + 1) % ids.length]))
  }

  // Connect each ring outward-to-inward via a limited, evenly-spaced set of
  // spokes (not one per outer node — a small inner ring, especially a
  // single-node hub, would otherwise collect a spoke from every outer node
  // and blow past the board's max-degree budget). Ring-internal links already
  // keep each ring's own nodes connected to each other, so spokes only need
  // to bridge the rings, not touch every node.
  for (let r = 1; r < ringNodeIds.length; r++) {
    const outer = ringNodeIds[r]
    const inner = ringNodeIds[r - 1]
    const spokeCount = Math.min(outer.length, Math.max(inner.length, Math.ceil(outer.length / 3)))
    for (let k = 0; k < spokeCount; k++) {
      const outerIdx = Math.floor((k / spokeCount) * outer.length)
      const innerIdx = Math.floor((k / spokeCount) * inner.length)
      link(spaces, outer[outerIdx], inner[innerIdx])
    }
  }

  const minX = Math.min(...spaces.map(s => s.x))
  const minY = Math.min(...spaces.map(s => s.y))
  spaces.forEach(s => { s.x -= minX; s.y -= minY })

  return { level, label, spaces }
}

// Two ring clusters joined by a single bridge — "Twin Peaks".
function twinHubLayout(level: number, label: string, seed: number, clusterRingCounts: number[]): BoardLayout {
  const clusterA = ringLayout(level, label, seed, clusterRingCounts)
  const clusterB = ringLayout(level, label, seed + 977, clusterRingCounts)

  const offsetX = Math.max(...clusterA.spaces.map(s => s.x)) + CELL * 2.4
  const idOffset = clusterA.spaces.length

  const spaces: SpaceDef[] = [
    ...clusterA.spaces,
    ...clusterB.spaces.map(s => ({
      id: s.id + idOffset,
      x: s.x + offsetX,
      y: s.y,
      adjacentIds: s.adjacentIds.map(a => a + idOffset),
      ring: s.ring,
    })),
  ]

  const aRight = clusterA.spaces.reduce((best, s) => (s.x > best.x ? s : best))
  const bLeft  = clusterB.spaces.reduce((best, s) => (s.x < best.x ? s : best))
  link(spaces, aRight.id, bLeft.id + idOffset)

  return { level, label, spaces, longLinks: [[aRight.id, bLeft.id + idOffset]] }
}

// Adds `count` extra non-adjacent "long link" edges between cells that are
// visually close but not already connected — read as intentional shortcuts
// on the board, rendered with a distinct dashed style. Respects a max degree
// of 6 per node so no hub becomes a scoring/AI-search hotspot.
function addLongLinks(layout: BoardLayout, count: number, seed: number): BoardLayout {
  const rng = mulberry32(seed)
  const added: [number, number][] = []
  const spaces = layout.spaces
  let attempts = 0

  while (added.length < count && attempts < 300) {
    attempts++
    const a = spaces[Math.floor(rng() * spaces.length)]
    const b = spaces[Math.floor(rng() * spaces.length)]
    if (a.id === b.id) continue
    if (a.adjacentIds.includes(b.id)) continue
    if (a.adjacentIds.length >= 6 || b.adjacentIds.length >= 6) continue
    const dist = Math.hypot(a.x - b.x, a.y - b.y)
    if (dist < CELL * 1.3 || dist > CELL * 2.6) continue
    link(spaces, a.id, b.id)
    added.push([a.id, b.id])
  }

  return { ...layout, longLinks: [...(layout.longLinks ?? []), ...added] }
}

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return (r << 16) | (g << 8) | bl
}

// Ramps each level's visual identity from a deep indigo, sparse-star opening
// board to a gold-violet eclipse tone with a dense starfield by level 9 — no
// new art assets required, this only tints the existing procedural starfield.
function themeFor(level: number): BoardTheme {
  const t = (level - 1) / 8
  return {
    bgTint: lerpColor(0x0A1628, 0x241033, t),
    accentColor: lerpColor(0xC8A84B, 0xB080FF, t),
    starDensity: Math.round(40 + t * 220),
  }
}

const RAW_LAYOUTS: BoardLayout[] = [
  grid(1, 'Moonrise', 3, 3, [4]),
  organicLayout(2, 'Crescent Hollow', 2001, 11, 1),
  organicLayout(3, 'Silver Glade', 3001, 14, 2),
  addLongLinks(organicLayout(4, 'Starlit Marsh', 4001, 16), 1, 4501),
  twoLobeLayout(5, 'Crescent Cove', 5001, 9, 9),
  twinHubLayout(6, 'Twin Peaks', 6001, [1, 9]),
  addLongLinks(ringLayout(7, 'Lunar Vale', 7001, [1, 7, 14]), 2, 7501),
  addLongLinks(organicLayout(8, 'Eclipse Reach', 8001, 25, 3), 2, 8501),
  addLongLinks(ringLayout(9, 'Half Moon Summit', 9001, [1, 6, 9, 13]), 3, 9501),
]

export const BOARD_LAYOUTS: BoardLayout[] = RAW_LAYOUTS.map(l => ({
  ...l,
  theme: l.theme ?? themeFor(l.level),
}))

// ── Random board generator (fallback for level 10+, not used by BOARD_LAYOUTS) ─

const LEVEL_SPACE_COUNTS = [8, 12, 16, 15, 17, 12, 20, 21, 30]
const RANDOM_GRID_DIMS = [
  { rows: 3, cols: 3 },
  { rows: 4, cols: 3 },
  { rows: 4, cols: 4 },
  { rows: 5, cols: 3 },
  { rows: 5, cols: 4 },
  { rows: 4, cols: 4 },
  { rows: 5, cols: 4 },
  { rows: 5, cols: 5 },
  { rows: 6, cols: 5 },
]

const LEVEL_NAMES: string[][] = [
  ['Moonrise', 'Twilight Hollow', 'Silver Creek', 'Dusk Vale'],
  ['Crescent Hollow', 'Nightfall Glen', 'Ember Reach', 'Mist Path'],
  ['Silver Glade', 'Lunar Arch', 'Shadow Crest', 'Pale Crossing'],
  ['Starlit Marsh', 'Mystic Shore', 'Tide Mirror', 'Night Basin'],
  ['Crescent Cove', 'Tidal Ledge', 'Dusk Reef', 'Eclipse Bay'],
  ['Twin Peaks', 'Double Ridge', 'Mirror Spires', 'Binary Rise'],
  ['Lunar Vale', 'Moon Garden', 'Star Meadow', 'Night Prairie'],
  ['Eclipse Reach', 'Obsidian Field', 'Dark Crossing', 'Void Step'],
  ['Half Moon Summit', 'Celestial Crown', 'Apex Lunar', 'Peak of Night'],
]

// Grows a random connected blob of `targetSize` cells within a ROWS×COLS grid,
// then converts it to a SpaceDef array with correct adjacency.
export function generateRandomLayout(level: number): BoardLayout {
  const idx         = Math.min(level - 1, LEVEL_SPACE_COUNTS.length - 1)
  const dims        = RANDOM_GRID_DIMS[idx] ?? { rows: 5, cols: 4 }
  const ROWS        = dims.rows
  const COLS        = dims.cols
  const targetSize  = Math.min(LEVEL_SPACE_COUNTS[idx], ROWS * COLS)
  const namePool    = LEVEL_NAMES[idx]
  const label       = namePool[Math.floor(Math.random() * namePool.length)]

  const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]

  const included = new Set<string>()
  const frontier: [number, number][] = []

  const startR = Math.floor(Math.random() * ROWS)
  const startC = Math.floor(Math.random() * COLS)
  const startKey = `${startR},${startC}`
  included.add(startKey)
  frontier.push([startR, startC])

  while (included.size < targetSize) {
    const pivot = frontier[Math.floor(Math.random() * frontier.length)]
    const neighbors = DIRS
      .map(([dr, dc]) => [pivot[0] + dr, pivot[1] + dc] as [number, number])
      .filter(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS && !included.has(`${r},${c}`))

    if (neighbors.length === 0) continue

    const chosen = neighbors[Math.floor(Math.random() * neighbors.length)]
    included.add(`${chosen[0]},${chosen[1]}`)
    frontier.push(chosen)
  }

  const cells = Array.from(included)
    .map(k => { const [r, c] = k.split(',').map(Number); return { r, c } })
    .sort((a, b) => a.r - b.r || a.c - b.c)

  const minR = Math.min(...cells.map(c => c.r))
  const minC = Math.min(...cells.map(c => c.c))

  const cellMap = new Map<string, number>()
  cells.forEach(({ r, c }, i) => cellMap.set(`${r},${c}`, i))

  const spaces: SpaceDef[] = cells.map(({ r, c }, i) => {
    const adjacentIds: number[] = []
    for (const [dr, dc] of DIRS) {
      const adjId = cellMap.get(`${r + dr},${c + dc}`)
      if (adjId !== undefined) adjacentIds.push(adjId)
    }
    return { id: i, x: (c - minC) * CELL, y: (r - minR) * CELL, adjacentIds }
  })

  return { level, label, spaces }
}

// ── Scoring constants ─────────────────────────────────────────────────────────

export const SCORE_SAME_MATCH    = 1  // same phase adjacent: +1
export const SCORE_COMPLEMENTARY = 2  // complementary pair adjacent (1+5, 2+6, 3+7, 4+8): +2
export const SCORE_CYCLE_PER_CARD = 1 // moon cycle match: +1 per card in chain (min 3 cards)
export const SCORE_CARD_CONTROL  = 1  // per owned card at game end

// Legacy aliases
export const SCORE_PHASE_PAIR = SCORE_SAME_MATCH
export const SCORE_FULL_MOON  = SCORE_COMPLEMENTARY

// ── Scoring result types ──────────────────────────────────────────────────────

export interface ScoringResult {
  playerDelta: number
  aiDelta: number
  events: ScoringEvent[]
  stolenChainId: number | null
}

export interface ScoringEvent {
  type: 'same-match' | 'complementary-match' | 'moon-cycle' | 'chain-stolen'
  points: number
  owner: 'player' | 'ai'
  spaceIds: number[]
}

// ── Chain ID counter ──────────────────────────────────────────────────────────

let _nextChainId = 1
export function nextChainId() { return _nextChainId++ }
export function resetChainIds() { _nextChainId = 1 }

// ── Main scoring engine ───────────────────────────────────────────────────────

export function runScoringAfterPlacement(
  placed: PlacedCard[],
  newSpaceId: number,
  placedBy: 'player' | 'ai',
  layout: BoardLayout,
  scoredPairs: Set<string>,
  doublePlacement: boolean,
): ScoringResult {
  const result: ScoringResult = { playerDelta: 0, aiDelta: 0, events: [], stolenChainId: null }

  const newCard = placed.find(c => c.spaceId === newSpaceId)
  if (!newCard) return result

  const space = layout.spaces.find(s => s.id === newSpaceId)!
  const mult  = doublePlacement ? 2 : 1

  // ── A. Adjacent pair scoring ──────────────────────────────────────────────
  for (const adjId of space.adjacentIds) {
    const adjCard = placed.find(c => c.spaceId === adjId)
    if (!adjCard || adjCard.owner === null) continue

    // Only score pairs between cards of the same owner (mixed ownership doesn't score)
    if (adjCard.owner !== placedBy) continue

    const pairKey = [newSpaceId, adjId].sort((a, b) => a - b).join('-')
    if (scoredPairs.has(pairKey)) continue
    scoredPairs.add(pairKey)

    if (adjCard.phase === newCard.phase) {
      // B. Same-card match: +1
      const pts = SCORE_SAME_MATCH * mult
      if (placedBy === 'player') result.playerDelta += pts
      else result.aiDelta += pts
      result.events.push({ type: 'same-match', points: pts, owner: placedBy, spaceIds: [newSpaceId, adjId] })

    } else if (isComplementary(adjCard.phase, newCard.phase)) {
      // B. Complementary match (1+5, 2+6, 3+7, 4+8): +2
      const pts = SCORE_COMPLEMENTARY * mult
      if (placedBy === 'player') result.playerDelta += pts
      else result.aiDelta += pts
      result.events.push({ type: 'complementary-match', points: pts, owner: placedBy, spaceIds: [newSpaceId, adjId] })
    }
  }

  // ── C. Moon cycle scoring (3+ consecutive phases, circular wrap) ──────────
  const chain = findConsecutiveChain(placed, newSpaceId, layout)

  if (chain.length >= 3) {
    const chainCards = chain.map(id => placed.find(c => c.spaceId === id)!)

    // Chains must belong to a single owner to score
    const chainOwnerCounts = countOwners(chainCards)
    const prevChainCards   = chainCards.filter(cc => cc.spaceId !== newSpaceId)
    const prevChainOwner   = getMajorityOwner(prevChainCards)

    let chainOwner: 'player' | 'ai'

    // Chain stealing: opponent placed card extends our 2-card run to 3+
    if (prevChainOwner && prevChainOwner !== placedBy && prevChainCards.length >= 2) {
      chainOwner = placedBy
      result.stolenChainId = chainCards[0].chainId ?? null
      result.events.push({ type: 'chain-stolen', points: chain.length * mult, owner: placedBy, spaceIds: chain })
    } else if (chainOwnerCounts[placedBy] >= chainOwnerCounts[placedBy === 'player' ? 'ai' : 'player']) {
      chainOwner = placedBy
    } else {
      // Mixed ownership — don't score
      return result
    }

    const cid = nextChainId()
    for (const cc of chainCards) {
      cc.chainId = cid
      cc.owner   = chainOwner
    }

    const pts = chain.length * SCORE_CYCLE_PER_CARD * mult
    if (chainOwner === 'player') result.playerDelta += pts
    else result.aiDelta += pts

    if (result.events[result.events.length - 1]?.type !== 'chain-stolen') {
      result.events.push({ type: 'moon-cycle', points: pts, owner: chainOwner, spaceIds: chain })
    }
  }

  return result
}

// ── Directional chain walk (replaces undirected pairwise DFS) ────────────────
//
// A "moon cycle" chain must read as a strictly monotonic run of phases (mod 8)
// end-to-end — e.g. 2-3-4 or 6-7-8-1 — not just a set of pairwise-adjacent
// values. Walking undirected would let a player insert a card that reverses
// back into an existing chain (2-3-4 + a second 3 next to the 4 → "2-3-4-3")
// and have it wrongly scored as a longer cycle.
//
// Fix: from the newly placed card, walk outward in the "forward" direction
// (phase → nextPhase(phase)) and separately in the "backward" direction
// (phase → prevPhase(phase)), then splice the two walks together. This still
// correctly recognizes a new card that bridges two existing fragments on
// either side of it (e.g. placing a 3 between an existing 2 and an existing
// 4), since that's a legitimate single monotonic run read end-to-end.

function walkDirectional(
  placed: PlacedCard[],
  startId: number,
  layout: BoardLayout,
  dir: 'forward' | 'backward',
  visited: Set<number> = new Set([startId]),
): number[] {
  const startCard = placed.find(c => c.spaceId === startId)!
  const wantPhase = dir === 'forward' ? nextPhase(startCard.phase) : prevPhase(startCard.phase)
  const space = layout.spaces.find(s => s.id === startId)!

  let best: number[] = [startId]
  for (const adjId of space.adjacentIds) {
    if (visited.has(adjId)) continue
    const adjCard = placed.find(c => c.spaceId === adjId)
    if (!adjCard || adjCard.owner === null || adjCard.phase !== wantPhase) continue

    visited.add(adjId)
    const candidate = [startId, ...walkDirectional(placed, adjId, layout, dir, visited)]
    visited.delete(adjId)

    if (candidate.length > best.length) best = candidate
  }
  return best
}

function findConsecutiveChain(placed: PlacedCard[], startId: number, layout: BoardLayout): number[] {
  if (!placed.find(c => c.spaceId === startId)) return []

  const forward  = walkDirectional(placed, startId, layout, 'forward')
  const backward = walkDirectional(placed, startId, layout, 'backward')
  const full = [...backward.slice(1).reverse(), ...forward]

  // Cap at 8 = one full lunar cycle, guarding the edge case of a walk
  // spiraling past a full 8-phase loop across more than 8 distinct spaces.
  return full.length >= 3 && full.length <= 8 ? full : []
}

function countOwners(cards: PlacedCard[]): { player: number; ai: number } {
  let player = 0, ai = 0
  for (const c of cards) {
    if (c.owner === 'player') player++
    else if (c.owner === 'ai') ai++
  }
  return { player, ai }
}

function getMajorityOwner(cards: PlacedCard[]): 'player' | 'ai' | null {
  if (cards.length === 0) return null
  const { player, ai } = countOwners(cards)
  if (player === ai) return null
  return player > ai ? 'player' : 'ai'
}

// ── Deck helpers ──────────────────────────────────────────────────────────────

export function buildDeck(): Phase[] {
  const deck: Phase[] = []
  for (let phase = 1; phase <= 8; phase++) {
    for (let copy = 0; copy < 4; copy++) {
      deck.push(phase as Phase)
    }
  }
  return shuffle(deck)
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
