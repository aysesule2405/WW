// ── Types ─────────────────────────────────────────────────────────────────────

export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type Owner = 'player' | 'ai' | null
export type Difficulty = 'easy' | 'medium' | 'hard'
export type AIMode = 'local' | 'gemini'
export type WildCardType = 'eclipse-shield' | 'moonrise' | 'star-burst' | 'crescent-charm'

export interface SpaceDef {
  id: number
  x: number       // pixel x in scene (column * CELL_SIZE)
  y: number       // pixel y in scene (row * CELL_SIZE)
  adjacentIds: number[]
}

export interface BoardLayout {
  level: number
  label: string
  spaces: SpaceDef[]
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

// ── Board layouts ─────────────────────────────────────────────────────────────

export const CELL = 110

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

const L1 = grid(1, 'Moonrise',        3, 3, [4])
const L2 = grid(2, 'Crescent Hollow', 4, 3)
const L3 = grid(3, 'Silver Glade',    4, 4)
const L4 = grid(4, 'Starlit Marsh',   5, 3)
const L5 = grid(5, 'Crescent Cove',   5, 4, [3, 7, 11])
const L6 = grid(6, 'Twin Peaks',      4, 4, [5, 6, 9, 10])
const L7 = grid(7, 'Lunar Vale',      5, 4)
const L8 = grid(8, 'Eclipse Reach',   5, 5, [2, 8, 16, 22])
const L9 = grid(9, 'Half Moon Summit',6, 5)

export const BOARD_LAYOUTS: BoardLayout[] = [L1, L2, L3, L4, L5, L6, L7, L8, L9]

// ── Random board generator ────────────────────────────────────────────────────

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

// ── Consecutive chain DFS (handles circular 8→1 wrap) ────────────────────────

function findConsecutiveChain(placed: PlacedCard[], startId: number, layout: BoardLayout): number[] {
  const startCard = placed.find(c => c.spaceId === startId)
  if (!startCard) return []

  const best: number[] = []

  function dfs(currentId: number, path: number[], visited: Set<number>) {
    if (path.length > best.length) {
      best.length = 0
      best.push(...path)
    }
    const currentCard = placed.find(c => c.spaceId === currentId)!
    const space = layout.spaces.find(s => s.id === currentId)!

    for (const adjId of space.adjacentIds) {
      if (visited.has(adjId)) continue
      const adjCard = placed.find(c => c.spaceId === adjId)
      if (!adjCard || adjCard.owner === null) continue

      // Circular consecutive check: handles 8→1 and 1→8 wrap
      if (isConsecutive(adjCard.phase, currentCard.phase)) {
        visited.add(adjId)
        dfs(adjId, [...path, adjId], visited)
        visited.delete(adjId)
      }
    }
  }

  dfs(startId, [startId], new Set([startId]))
  return best.length >= 3 ? best : []
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
