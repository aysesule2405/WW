// ── Types ─────────────────────────────────────────────────────────────────────

export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type Owner = 'player' | 'ai' | null
export type Difficulty = 'easy' | 'medium' | 'hard'
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
  chainId: number | null   // which chain owns this card, if any
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
  7: 'Last Quarter',
  8: 'Waning Crescent',
}

// Opposite pairs that sum to 9 (phase + opposite = 9)
export function oppositePhase(p: Phase): Phase {
  return (9 - p) as Phase
}

export function isOpposite(a: Phase, b: Phase): boolean {
  return a + b === 9
}

// ── Board layouts ─────────────────────────────────────────────────────────────

// CELL_SIZE determines spacing between space centers in the scene
export const CELL = 110

function grid(level: number, label: string, rows: number, cols: number, skip: number[] = []): BoardLayout {
  const spaces: SpaceDef[] = []
  let id = 0
  const grid: (number | null)[][] = []

  for (let r = 0; r < rows; r++) {
    grid[r] = []
    for (let c = 0; c < cols; c++) {
      const linearIdx = r * cols + c
      if (skip.includes(linearIdx)) {
        grid[r][c] = null
      } else {
        grid[r][c] = id++
        spaces.push({ id: grid[r][c]!, x: c * CELL, y: r * CELL, adjacentIds: [] })
      }
    }
  }

  // Wire adjacency (4-directional)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const sid = grid[r]?.[c]
      if (sid == null) continue
      const space = spaces.find(s => s.id === sid)!
      const neighbors = [
        grid[r - 1]?.[c], grid[r + 1]?.[c],
        grid[r]?.[c - 1], grid[r]?.[c + 1],
      ]
      space.adjacentIds = neighbors.filter((n): n is number => n != null)
    }
  }

  return { level, label, spaces }
}

// Level 1 — 3×3 (9 spaces)
const L1 = grid(1, 'Moonrise', 3, 3)

// Level 2 — 4×3 (12 spaces)
const L2 = grid(2, 'Crescent Hollow', 4, 3)

// Level 3 — 4×4, skip 4 corner cells (12 spaces — plus-shape)
const L3 = grid(3, 'Silver Glade', 4, 4, [0, 3, 12, 15])

// Level 4 — 5×3 (15 spaces)
const L4 = grid(4, 'Starlit Marsh', 5, 3)

// Level 5 — Crescent C-shape: 5 rows × 4 cols, skip right column on rows 1-3
const L5 = grid(5, 'Crescent Cove', 5, 4, [3, 7, 11])

// Level 6 — 4×4, skip middle 2×2 (two clusters bridged at edges)
const L6 = grid(6, 'Twin Peaks', 4, 4, [5, 6, 9, 10])

// Level 7 — 5×4 (20 spaces)
const L7 = grid(7, 'Lunar Vale', 5, 4)

// Level 8 — 5×5, skip 5 scattered cells
const L8 = grid(8, 'Eclipse Reach', 5, 5, [2, 8, 16, 22])

// Level 9 — 6×5 (30 spaces, hardest)
const L9 = grid(9, 'Half Moon Summit', 6, 5)

export const BOARD_LAYOUTS: BoardLayout[] = [L1, L2, L3, L4, L5, L6, L7, L8, L9]

// ── Scoring constants ─────────────────────────────────────────────────────────

export const SCORE_PHASE_PAIR   = 1   // same phase adjacent
export const SCORE_FULL_MOON    = 2   // opposite phases adjacent (sum = 9)
export const SCORE_CARD_CONTROL = 1   // per owned card at game end

// Lunar cycle (consecutive chain 3+) = chain length points
// Chain stealing: if opponent extends your chain to 3+, they steal it all

// ── Scoring engine ────────────────────────────────────────────────────────────

export interface ScoringResult {
  playerDelta: number
  aiDelta: number
  events: ScoringEvent[]
  stolenChainId: number | null
}

export interface ScoringEvent {
  type: 'phase-pair' | 'full-moon-pair' | 'lunar-cycle' | 'chain-stolen'
  points: number
  owner: 'player' | 'ai'
  spaceIds: number[]
}

let _nextChainId = 1
export function nextChainId() { return _nextChainId++ }
export function resetChainIds() { _nextChainId = 1 }

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

  const mult = doublePlacement ? 2 : 1

  // ── Pair scoring ──────────────────────────────────────────────────────────
  for (const adjId of space.adjacentIds) {
    const adjCard = placed.find(c => c.spaceId === adjId)
    if (!adjCard || adjCard.owner === null) continue

    const pairKey = [newSpaceId, adjId].sort((a, b) => a - b).join('-')
    if (scoredPairs.has(pairKey)) continue
    scoredPairs.add(pairKey)

    if (adjCard.phase === newCard.phase) {
      // Phase pair — points go to whoever placed the new card
      const pts = SCORE_PHASE_PAIR * mult
      if (placedBy === 'player') result.playerDelta += pts
      else result.aiDelta += pts
      result.events.push({ type: 'phase-pair', points: pts, owner: placedBy, spaceIds: [newSpaceId, adjId] })
    } else if (isOpposite(adjCard.phase, newCard.phase)) {
      // Full moon pair
      const pts = SCORE_FULL_MOON * mult
      if (placedBy === 'player') result.playerDelta += pts
      else result.aiDelta += pts
      result.events.push({ type: 'full-moon-pair', points: pts, owner: placedBy, spaceIds: [newSpaceId, adjId] })
    }
  }

  // ── Lunar cycle (DFS for consecutive chain through newSpaceId) ────────────
  const chain = findConsecutiveChain(placed, newSpaceId, layout)

  if (chain.length >= 3) {
    const chainCards = chain.map(id => placed.find(c => c.spaceId === id)!)
    const ownerCounts = { player: 0, ai: 0 }
    for (const cc of chainCards) {
      if (cc.owner === 'player') ownerCounts.player++
      else if (cc.owner === 'ai') ownerCounts.ai++
    }

    // Determine if this is stealing: new card extends an existing chain owned by opponent
    const prevChainOwner = getMajorityOwner(chainCards.filter(cc => cc.spaceId !== newSpaceId))

    let chainOwner: 'player' | 'ai'
    if (prevChainOwner && prevChainOwner !== placedBy && chainCards.filter(c => c.spaceId !== newSpaceId).length >= 2) {
      // Steal!
      chainOwner = placedBy
      result.stolenChainId = chainCards[0].chainId ?? null
      result.events.push({ type: 'chain-stolen', points: chain.length * mult, owner: placedBy, spaceIds: chain })
    } else {
      chainOwner = placedBy
    }

    const cid = nextChainId()
    for (const cc of chainCards) {
      cc.chainId = cid
      cc.owner = chainOwner
    }

    const pts = chain.length * mult
    if (chainOwner === 'player') result.playerDelta += pts
    else result.aiDelta += pts

    if (result.events[result.events.length - 1]?.type !== 'chain-stolen') {
      result.events.push({ type: 'lunar-cycle', points: pts, owner: chainOwner, spaceIds: chain })
    }
  }

  return result
}

function findConsecutiveChain(placed: PlacedCard[], startId: number, layout: BoardLayout): number[] {
  const startCard = placed.find(c => c.spaceId === startId)
  if (!startCard) return []

  // BFS/DFS: find longest connected path of consecutive phases including startId
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

      const diff = Math.abs(adjCard.phase - currentCard.phase)
      if (diff === 1) {
        visited.add(adjId)
        dfs(adjId, [...path, adjId], visited)
        visited.delete(adjId)
      }
    }
  }

  dfs(startId, [startId], new Set([startId]))
  return best.length >= 3 ? best : []
}

function getMajorityOwner(cards: PlacedCard[]): 'player' | 'ai' | null {
  if (cards.length === 0) return null
  let p = 0, a = 0
  for (const c of cards) {
    if (c.owner === 'player') p++
    else if (c.owner === 'ai') a++
  }
  if (p === a) return null
  return p > a ? 'player' : 'ai'
}

// ── Deck helpers ──────────────────────────────────────────────────────────────

export function buildDeck(): Phase[] {
  // 4 copies of each phase (1–8) = 32 cards
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
