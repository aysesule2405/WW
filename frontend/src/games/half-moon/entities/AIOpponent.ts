import type { Phase, PlacedCard, BoardLayout, Difficulty, AIMode } from '../data/halfMoonConfig'
import { isComplementary, SCORE_SAME_MATCH, SCORE_COMPLEMENTARY } from '../data/halfMoonConfig'
import { chooseBestMove } from '../ai/localAI'
import { requestGeminiMove } from '../ai/geminiAI'

export class AIOpponent {
  private difficulty: Difficulty
  private mode: AIMode

  constructor(difficulty: Difficulty = 'medium', mode: AIMode = 'local') {
    this.difficulty = difficulty
    this.mode       = mode
  }

  // ── Public: choose a placement ────────────────────────────────────────────

  async choosePlacement(
    hand: Phase[],
    placed: PlacedCard[],
    layout: BoardLayout,
    scoredPairs: Set<string>,
  ): Promise<{ spaceId: number; phase: Phase }> {
    const emptySpaces = layout.spaces.filter(s => !placed.find(c => c.spaceId === s.id))
    if (emptySpaces.length === 0 || hand.length === 0) {
      return { spaceId: layout.spaces[0].id, phase: hand[0] ?? 1 }
    }

    if (this.mode === 'gemini') {
      const geminiMove = await requestGeminiMove(hand, placed, layout)
      if (geminiMove) return geminiMove
      // Gemini failed or timed out — fall through to local AI silently
    }

    return chooseBestMove(hand, placed, layout, scoredPairs, this.difficulty)
  }

  // Synchronous fallback for contexts that can't await
  choosePlacementSync(
    hand: Phase[],
    placed: PlacedCard[],
    layout: BoardLayout,
    scoredPairs: Set<string>,
  ): { spaceId: number; phase: Phase } {
    return chooseBestMove(hand, placed, layout, scoredPairs, this.difficulty)
  }

  setMode(mode: AIMode)           { this.mode = mode }
  setDifficulty(d: Difficulty)    { this.difficulty = d }
}

// ── Player hint utility ───────────────────────────────────────────────────────

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
        if (!adj || adj.owner !== 'player') continue
        if (adj.phase === phase)                score += SCORE_SAME_MATCH
        if (isComplementary(adj.phase, phase))  score += SCORE_COMPLEMENTARY
      }
    }
    if (score > bestScore) { bestScore = score; bestPhase = phase }
  }
  return bestPhase
}
