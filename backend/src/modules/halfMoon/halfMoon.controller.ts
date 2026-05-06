// ── Half-Moon AI move proxy ────────────────────────────────────────────────────
//
// POST /api/v1/games/half-moon/ai-move
//
// The API key NEVER leaves the server. The frontend sends board state;
// we ask Gemini for a move suggestion, validate it, and return it.
// Core scoring rules are never delegated to Gemini.

import { Request, Response } from 'express'

interface MoveRequest {
  hand:          number[]
  placed:        Array<{ spaceId: number; phase: number; owner: string }>
  layoutLevel:   number
  emptySpaceIds: number[]
}

export async function getAIMove(req: Request, res: Response) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(503).json({ move: null, error: 'Gemini AI not configured on this server' })
  }

  const { hand, placed, layoutLevel, emptySpaceIds } = req.body as MoveRequest

  // ── Input validation ──────────────────────────────────────────────────────
  if (
    !Array.isArray(hand)          || hand.length === 0 ||
    !Array.isArray(placed)        ||
    !Array.isArray(emptySpaceIds) || emptySpaceIds.length === 0 ||
    typeof layoutLevel !== 'number'
  ) {
    return res.status(400).json({ move: null, error: 'Invalid request body' })
  }

  // Sanitise: ensure all values are integers in expected range
  const safeHand = hand.filter(p => Number.isInteger(p) && p >= 1 && p <= 8) as number[]
  const safeEmpty = emptySpaceIds.filter(id => Number.isInteger(id) && id >= 0)
  if (safeHand.length === 0 || safeEmpty.length === 0) {
    return res.status(400).json({ move: null, error: 'No valid moves available' })
  }

  // ── Build Gemini prompt ───────────────────────────────────────────────────
  const boardSummary = placed
    .map(c => `space ${c.spaceId}: phase ${c.phase} (${c.owner})`)
    .join(', ')

  const prompt = `You are playing a moon-phase card placement game called Half Moon.

Moon phases: 1=New Moon, 2=Waxing Crescent, 3=First Quarter, 4=Waxing Gibbous,
5=Full Moon, 6=Waning Gibbous, 7=Third Quarter, 8=Waning Crescent.

Scoring priorities (highest first):
1. Moon Cycle: 3+ consecutive phases in order (circular: 8→1) — +1 per card
2. Complementary pair: 1+5, 2+6, 3+7, 4+8 adjacent — +2
3. Same match: same phase adjacent — +1

Board state (level ${layoutLevel}):
Current placements: ${boardSummary || 'none'}
Your hand (AI, phases): [${safeHand.join(', ')}]
Available spaces: [${safeEmpty.join(', ')}]

Choose the single best move. Respond with ONLY valid JSON like:
{"spaceId": 3, "phase": 5}

Rules:
- spaceId must be one of: [${safeEmpty.join(', ')}]
- phase must be one of your hand: [${safeHand.join(', ')}]
- No explanation, no markdown — only the JSON object.`

  // ── Call Gemini API ───────────────────────────────────────────────────────
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 64 },
        }),
        signal: AbortSignal.timeout(6000),
      },
    )

    if (!geminiRes.ok) {
      console.error('[HalfMoon AI] Gemini API error', geminiRes.status)
      return res.status(200).json({ move: null })
    }

    const geminiData = await geminiRes.json()
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    const move = parseGeminiResponse(rawText, safeHand, safeEmpty)
    return res.status(200).json({ move })

  } catch (err: any) {
    console.error('[HalfMoon AI] fetch error', err?.message)
    return res.status(200).json({ move: null })
  }
}

// ── Parse + validate Gemini's text output ────────────────────────────────────

function parseGeminiResponse(
  text: string,
  hand: number[],
  emptySpaceIds: number[],
): { spaceId: number; phase: number } | null {
  try {
    // Strip markdown fences if Gemini wraps in ```json
    const clean = text.replace(/```[a-z]*/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)

    const spaceId = Number(parsed.spaceId)
    const phase   = Number(parsed.phase)

    if (!emptySpaceIds.includes(spaceId)) return null
    if (!hand.includes(phase)) return null
    if (phase < 1 || phase > 8) return null

    return { spaceId, phase }
  } catch {
    return null
  }
}
