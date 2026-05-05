import type { Phase, PlacedCard, BoardLayout, Difficulty } from '../data/halfMoonConfig'
import {
  isOpposite, runScoringAfterPlacement, SCORE_PHASE_PAIR, SCORE_FULL_MOON,
} from '../data/halfMoonConfig'

export class AIOpponent {
  private difficulty: Difficulty

  constructor(difficulty: Difficulty = 'medium') {
    this.difficulty = difficulty
  }

  choosePlacement(
    hand: Phase[],
    placed: PlacedCard[],
    layout: BoardLayout,
    scoredPairs: Set<string>,
  ): { spaceId: number; phase: Phase } {
    const emptySpaces = layout.spaces.filter(s => !placed.find(c => c.spaceId === s.id))
    if (emptySpaces.length === 0 || hand.length === 0) {
      return { spaceId: layout.spaces[0].id, phase: hand[0] }
    }

    if (this.difficulty === 'easy') return this.randomMove(hand, emptySpaces)
    if (this.difficulty === 'medium') return this.greedyMove(hand, emptySpaces, placed, layout, scoredPairs)
    return this.hardMove(hand, emptySpaces, placed, layout, scoredPairs)
  }

  private randomMove(hand: Phase[], emptySpaces: BoardLayout['spaces']) {
    const spaceId = emptySpaces[Math.floor(Math.random() * emptySpaces.length)].id
    const phase   = hand[Math.floor(Math.random() * hand.length)]
    return { spaceId, phase }
  }

  private greedyMove(
    hand: Phase[],
    emptySpaces: BoardLayout['spaces'],
    placed: PlacedCard[],
    layout: BoardLayout,
    scoredPairs: Set<string>,
  ) {
    let bestScore = -Infinity
    let best = { spaceId: emptySpaces[0].id, phase: hand[0] }

    for (const space of emptySpaces) {
      for (const phase of new Set(hand)) {
        const score = this.evaluatePlacement(space.id, phase, placed, layout, scoredPairs)
        if (score > bestScore) {
          bestScore = score
          best = { spaceId: space.id, phase }
        }
      }
    }
    return best
  }

  private hardMove(
    hand: Phase[],
    emptySpaces: BoardLayout['spaces'],
    placed: PlacedCard[],
    layout: BoardLayout,
    scoredPairs: Set<string>,
  ) {
    // 1. Try to steal a player chain
    for (const space of emptySpaces) {
      for (const phase of new Set(hand)) {
        if (this.wouldStealChain(space.id, phase, placed, layout)) {
          return { spaceId: space.id, phase }
        }
      }
    }

    // 2. Try to block a player chain (player has 2-card consecutive group near empty)
    const blocking = this.findBlockingMove(hand, emptySpaces, placed, layout)
    if (blocking) return blocking

    // 3. Greedy
    return this.greedyMove(hand, emptySpaces, placed, layout, scoredPairs)
  }

  private evaluatePlacement(
    spaceId: number,
    phase: Phase,
    placed: PlacedCard[],
    layout: BoardLayout,
    scoredPairs: Set<string>,
  ): number {
    // Simulate without mutating real state
    const sim: PlacedCard[] = placed.map(c => ({ ...c }))
    const pairsSim = new Set(scoredPairs)
    sim.push({ spaceId, phase, owner: 'ai', chainId: null })

    const result = runScoringAfterPlacement(sim, spaceId, 'ai', layout, pairsSim, false)
    return result.aiDelta - result.playerDelta * 0.5
  }

  private wouldStealChain(
    spaceId: number,
    phase: Phase,
    placed: PlacedCard[],
    layout: BoardLayout,
  ): boolean {
    const space = layout.spaces.find(s => s.id === spaceId)!
    for (const adjId of space.adjacentIds) {
      const adjCard = placed.find(c => c.spaceId === adjId)
      if (!adjCard || adjCard.owner !== 'player') continue
      // Check if adjCard is part of a 2-card consecutive player run we could extend
      const diff = Math.abs(adjCard.phase - phase)
      if (diff !== 1) continue
      // See if adjCard has another consecutive neighbour (player-owned)
      const adjSpace = layout.spaces.find(s => s.id === adjId)!
      for (const adj2Id of adjSpace.adjacentIds) {
        if (adj2Id === spaceId) continue
        const adj2 = placed.find(c => c.spaceId === adj2Id)
        if (!adj2 || adj2.owner !== 'player') continue
        if (Math.abs(adj2.phase - adjCard.phase) === 1) return true
      }
    }
    return false
  }

  private findBlockingMove(
    hand: Phase[],
    emptySpaces: BoardLayout['spaces'],
    placed: PlacedCard[],
    layout: BoardLayout,
  ): { spaceId: number; phase: Phase } | null {
    // Find empty spaces adjacent to 2-card player consecutive runs
    for (const space of emptySpaces) {
      const adjPlayerCards = space.adjacentIds
        .map(id => placed.find(c => c.spaceId === id))
        .filter((c): c is PlacedCard => !!c && c.owner === 'player')

      for (let i = 0; i < adjPlayerCards.length; i++) {
        for (let j = i + 1; j < adjPlayerCards.length; j++) {
          if (Math.abs(adjPlayerCards[i].phase - adjPlayerCards[j].phase) === 1) {
            // This empty space would extend a player chain — block it
            const blockPhase = hand[0]
            return { spaceId: space.id, phase: blockPhase }
          }
        }
      }
    }
    return null
  }
}

// Evaluate hand for player hint (not used in game, exported for debugging)
export function evaluateHandValue(
  hand: Phase[],
  placed: PlacedCard[],
  layout: BoardLayout,
): Phase {
  const emptySpaces = layout.spaces.filter(s => !placed.find(c => c.spaceId === s.id))
  if (emptySpaces.length === 0) return hand[0]

  let bestPhase = hand[0]
  let bestScore = -Infinity

  for (const phase of hand) {
    let score = 0
    for (const space of emptySpaces) {
      for (const adjId of space.adjacentIds) {
        const adj = placed.find(c => c.spaceId === adjId)
        if (!adj) continue
        if (adj.phase === phase) score += SCORE_PHASE_PAIR
        if (isOpposite(adj.phase, phase)) score += SCORE_FULL_MOON
      }
    }
    if (score > bestScore) { bestScore = score; bestPhase = phase }
  }
  return bestPhase
}
