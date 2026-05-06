// ── Gemini AI Client ──────────────────────────────────────────────────────────
//
// Sends the current game state to our backend proxy (which holds the API key).
// The backend calls Gemini and returns a suggested move.
// We validate the move locally before accepting it — Gemini never touches
// core scoring or game rules.
//
// API key lives ONLY in backend/.env as GEMINI_API_KEY.

import type { Phase, PlacedCard, BoardLayout } from '../data/halfMoonConfig'
import { apiUrl } from '../../../lib/api'

export type GeminiMove = { spaceId: number; phase: Phase }

// ── Request payload sent to our backend proxy ─────────────────────────────────

interface GeminiMoveRequest {
  hand:         Phase[]
  placed:       Array<{ spaceId: number; phase: Phase; owner: string }>
  layoutLevel:  number
  emptySpaceIds: number[]
}

// ── Backend response shape ────────────────────────────────────────────────────

interface GeminiMoveResponse {
  move: { spaceId: number; phase: number } | null
  error?: string
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function requestGeminiMove(
  hand: Phase[],
  placed: PlacedCard[],
  layout: BoardLayout,
  timeoutMs = 4000,
): Promise<GeminiMove | null> {
  const emptySpaceIds = layout.spaces
    .filter(s => !placed.find(c => c.spaceId === s.id))
    .map(s => s.id)

  if (emptySpaceIds.length === 0 || hand.length === 0) return null

  const payload: GeminiMoveRequest = {
    hand,
    placed: placed.map(c => ({ spaceId: c.spaceId, phase: c.phase, owner: c.owner ?? 'none' })),
    layoutLevel: layout.level,
    emptySpaceIds,
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(apiUrl('/games/half-moon/ai-move'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!response.ok) return null

    const data: GeminiMoveResponse = await response.json()
    if (!data.move) return null

    return validateMove(data.move, hand, emptySpaceIds)
  } catch {
    // Network error, timeout, or AbortError — fall back to local AI silently
    return null
  }
}

// ── Local validation of Gemini's suggestion ───────────────────────────────────
//
// Gemini may hallucinate invalid spaceIds or phases. We reject anything
// that isn't a legal move before touching game state.

function validateMove(
  raw: { spaceId: number; phase: number },
  hand: Phase[],
  emptySpaceIds: number[],
): GeminiMove | null {
  const { spaceId, phase } = raw

  if (!emptySpaceIds.includes(spaceId)) return null
  if (!Number.isInteger(phase) || phase < 1 || phase > 8) return null
  if (!hand.includes(phase as Phase)) return null

  return { spaceId, phase: phase as Phase }
}
