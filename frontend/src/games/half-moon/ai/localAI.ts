// ── Local (deterministic) AI ──────────────────────────────────────────────────
//
// Move priority (highest to lowest):
//   1. Moon cycle match — steal opponent's chain or extend own (most points)
//   2. Complementary match — 1+5, 2+6, 3+7, 4+8 (+2 each)
//   3. Same-card match — identical phase adjacent (+1)
//   4. Blocking move — deny opponent a pending cycle
//   5. Greedy — best scoring placement by full simulation
//   6. Random fallback

import type { Phase, PlacedCard, BoardLayout, Difficulty } from '../data/halfMoonConfig'
import {
  isConsecutive, isComplementary, runScoringAfterPlacement,
  SCORE_SAME_MATCH, SCORE_COMPLEMENTARY,
} from '../data/halfMoonConfig'

export type Move = { spaceId: number; phase: Phase }

// ── Public entry point ────────────────────────────────────────────────────────

export function chooseBestMove(
  hand: Phase[],
  placed: PlacedCard[],
  layout: BoardLayout,
  scoredPairs: Set<string>,
  difficulty: Difficulty,
): Move {
  const emptySpaces = layout.spaces.filter(s => !placed.find(c => c.spaceId === s.id))
  if (emptySpaces.length === 0 || hand.length === 0) {
    return { spaceId: layout.spaces[0].id, phase: hand[0] ?? 1 }
  }

  if (difficulty === 'easy')   return randomMove(hand, emptySpaces)
  if (difficulty === 'medium') return mediumMove(hand, emptySpaces, placed, layout, scoredPairs)
  return hardMove(hand, emptySpaces, placed, layout, scoredPairs)
}

// ── Easy: pure random ─────────────────────────────────────────────────────────

function randomMove(hand: Phase[], emptySpaces: BoardLayout['spaces']): Move {
  return {
    spaceId: emptySpaces[Math.floor(Math.random() * emptySpaces.length)].id,
    phase:   hand[Math.floor(Math.random() * hand.length)],
  }
}

// ── Medium: greedy simulation (highest immediate score) ───────────────────────

function mediumMove(
  hand: Phase[],
  emptySpaces: BoardLayout['spaces'],
  placed: PlacedCard[],
  layout: BoardLayout,
  scoredPairs: Set<string>,
): Move {
  return greedyMove(hand, emptySpaces, placed, layout, scoredPairs)
}

// ── Hard: full strategic play ─────────────────────────────────────────────────

function hardMove(
  hand: Phase[],
  emptySpaces: BoardLayout['spaces'],
  placed: PlacedCard[],
  layout: BoardLayout,
  scoredPairs: Set<string>,
): Move {
  // 1. Steal a player chain (highest value)
  for (const space of emptySpaces) {
    for (const phase of uniquePhases(hand)) {
      if (wouldStealChain(space.id, phase, placed, layout)) {
        return { spaceId: space.id, phase }
      }
    }
  }

  // 2. Create a cycle match (3+ consecutive)
  const cycleMoves = findCycleMoves(hand, emptySpaces, placed, layout)
  if (cycleMoves.length > 0) return cycleMoves[0]

  // 3. Create a complementary match (+2)
  const complementaryMoves = findComplementaryMoves(hand, emptySpaces, placed)
  if (complementaryMoves.length > 0) return complementaryMoves[0]

  // 4. Block opponent's pending cycle
  const blocking = findBlockingMove(hand, emptySpaces, placed)
  if (blocking) return blocking

  // 5. Greedy fallback
  return greedyMove(hand, emptySpaces, placed, layout, scoredPairs)
}

// ── Strategy helpers ──────────────────────────────────────────────────────────

function greedyMove(
  hand: Phase[],
  emptySpaces: BoardLayout['spaces'],
  placed: PlacedCard[],
  layout: BoardLayout,
  scoredPairs: Set<string>,
): Move {
  let bestScore = -Infinity
  let best: Move = { spaceId: emptySpaces[0].id, phase: hand[0] }

  for (const space of emptySpaces) {
    for (const phase of uniquePhases(hand)) {
      const score = simulatePlacement(space.id, phase, placed, layout, scoredPairs)
      if (score > bestScore) {
        bestScore = score
        best = { spaceId: space.id, phase }
      }
    }
  }
  return best
}

function findCycleMoves(
  hand: Phase[],
  emptySpaces: BoardLayout['spaces'],
  placed: PlacedCard[],
  layout: BoardLayout,
): Move[] {
  const moves: Move[] = []
  for (const space of emptySpaces) {
    for (const phase of uniquePhases(hand)) {
      if (wouldExtendCycle(space.id, phase, placed, layout)) {
        moves.push({ spaceId: space.id, phase })
      }
    }
  }
  return moves
}

function findComplementaryMoves(
  hand: Phase[],
  emptySpaces: BoardLayout['spaces'],
  placed: PlacedCard[],
): Move[] {
  const moves: Move[] = []
  for (const space of emptySpaces) {
    for (const phase of uniquePhases(hand)) {
      for (const adjId of space.adjacentIds) {
        const adjCard = placed.find(c => c.spaceId === adjId)
        if (!adjCard || adjCard.owner !== 'ai') continue
        if (isComplementary(phase, adjCard.phase)) {
          moves.push({ spaceId: space.id, phase })
          break
        }
      }
    }
  }
  return moves
}

// Both checks below run the real scoring engine on a simulated placement
// rather than re-deriving consecutive-neighbor heuristics locally. This keeps
// the AI's move-priority ranking exactly in sync with `findConsecutiveChain`'s
// directional (monotonic-run) rule — a heuristic based on raw `isConsecutive`
// adjacency would flag "cycle" moves that the real engine now refuses to
// score (e.g. reversing back into an existing chain), making the AI waste its
// top move priorities on placements worth zero points.

function wouldExtendCycle(
  spaceId: number,
  phase: Phase,
  placed: PlacedCard[],
  layout: BoardLayout,
): boolean {
  const sim = placed.map(c => ({ ...c }))
  sim.push({ spaceId, phase, owner: 'ai', chainId: null })
  const result = runScoringAfterPlacement(sim, spaceId, 'ai', layout, new Set(), false)
  return result.events.some(e => e.type === 'moon-cycle')
}

function wouldStealChain(
  spaceId: number,
  phase: Phase,
  placed: PlacedCard[],
  layout: BoardLayout,
): boolean {
  const sim = placed.map(c => ({ ...c }))
  sim.push({ spaceId, phase, owner: 'ai', chainId: null })
  const result = runScoringAfterPlacement(sim, spaceId, 'ai', layout, new Set(), false)
  return result.events.some(e => e.type === 'chain-stolen')
}

function findBlockingMove(
  hand: Phase[],
  emptySpaces: BoardLayout['spaces'],
  placed: PlacedCard[],
): Move | null {
  for (const space of emptySpaces) {
    const adjPlayerCards = space.adjacentIds
      .map(id => placed.find(c => c.spaceId === id))
      .filter((c): c is PlacedCard => !!c && c.owner === 'player')

    for (let i = 0; i < adjPlayerCards.length; i++) {
      for (let j = i + 1; j < adjPlayerCards.length; j++) {
        if (isConsecutive(adjPlayerCards[i].phase, adjPlayerCards[j].phase)) {
          // This empty space would complete a player cycle — block it
          return { spaceId: space.id, phase: hand[0] }
        }
      }
    }
  }
  return null
}

// ── Simulation ────────────────────────────────────────────────────────────────

function simulatePlacement(
  spaceId: number,
  phase: Phase,
  placed: PlacedCard[],
  layout: BoardLayout,
  scoredPairs: Set<string>,
): number {
  const sim      = placed.map(c => ({ ...c }))
  const pairsSim = new Set(scoredPairs)
  sim.push({ spaceId, phase, owner: 'ai', chainId: null })

  const result = runScoringAfterPlacement(sim, spaceId, 'ai', layout, pairsSim, false)
  // Weight: own gain full; opponent gain penalised at half
  return result.aiDelta - result.playerDelta * 0.5
}

// ── Utility ───────────────────────────────────────────────────────────────────

function uniquePhases(hand: Phase[]): Phase[] {
  return [...new Set(hand)]
}

// ── Re-export scoring helpers for convenience ─────────────────────────────────

export { SCORE_SAME_MATCH, SCORE_COMPLEMENTARY, isConsecutive, isComplementary }
