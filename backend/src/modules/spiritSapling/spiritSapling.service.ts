// Gemini kindness check — never exposes API key to the frontend

const GUARDIAN_PERSONALITIES: Record<string, string> = {
  deer:     'warm, gentle, steadfast, nurturing — like still water nourishing deep roots',
  fox:      'playful, bright, mischievous, energetic — like sunlight dancing through leaves',
  kodama:   'airy, ancient, spirit-like, peaceful — like the breath of the old forest',
  mononoke: 'bold, dramatic, powerful, wild — like a mountain storm that clears the air',
}

export async function checkKindness(message: string): Promise<{
  approved: boolean
  reason: string
  growthBoost: number
}> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Graceful fallback: approve if no API key configured (dev mode)
    console.warn('[SpiritSapling] GEMINI_API_KEY not set — approving by default')
    return { approved: true, reason: 'Kind words accepted.', growthBoost: 1 }
  }

  if (typeof message !== 'string' || message.trim().length < 3) {
    return { approved: false, reason: 'Message too short.', growthBoost: 0 }
  }
  if (message.length > 500) {
    return { approved: false, reason: 'Message too long.', growthBoost: 0 }
  }

  const prompt = `You are the sapling in a cozy magical forest game. A player is trying to encourage you so your energy recharges faster.

Message: "${message.trim()}"

Evaluate whether this message is:
1. Kind and caring toward the sapling
2. Encouraging or hopeful
3. Safe and appropriate for all ages
4. Not insulting, harmful, or negative

Respond ONLY with valid JSON, no markdown, no explanation:
{"approved": true or false, "reason": "one short in-character sapling reply", "growthBoost": 0, 1, or 2}

Rules:
- approved: true if the message is kind, encouraging, and safe
- approved: false if it is harmful, insulting, negative, or unsafe
- growthBoost: 2 for especially specific, warm, hopeful encouragement
- growthBoost: 1 for simple kind encouragement
- growthBoost: 0 if not approved
- reason: speak as the sapling, warmly and briefly; mention energy only when approved
- Never include harsh or negative wording in the reason — always stay warm and forest-like`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 80 },
        }),
        signal: AbortSignal.timeout(6000),
      },
    )

    if (!res.ok) {
      console.error('[SpiritSapling] Gemini API error', res.status)
      return { approved: true, reason: 'The grove felt your intention.', growthBoost: 1 }
    }

    const data = await res.json()
    const raw: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = raw.replace(/```[a-z]*/gi, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)

    const boost = Number(parsed.growthBoost)
    return {
      approved:    Boolean(parsed.approved),
      reason:      typeof parsed.reason === 'string' ? parsed.reason : '',
      growthBoost: parsed.approved ? Math.max(1, Math.min(2, Number.isFinite(boost) ? boost : 1)) : 0,
    }
  } catch (err: any) {
    console.error('[SpiritSapling] kindness check error', err?.message)
    return { approved: true, reason: 'The grove heard your voice.', growthBoost: 1 }
  }
}

export async function generateGuardianMessage(
  guardianId: string,
  gameState: { saplingsGrown?: number; fruitsCollected?: number; score?: number },
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  const personality = GUARDIAN_PERSONALITIES[guardianId] ?? 'wise and caring'

  const fallbacks: Record<string, string> = {
    deer:     'Your sapling feels your care. Keep going.',
    fox:      'The grove is listening. One more kind word can help it grow.',
    kodama:   'You grow with patience and heart.',
    mononoke: 'Stand proud. The forest watches your strength.',
  }

  if (!apiKey) return fallbacks[guardianId] ?? fallbacks.deer

  const prompt = `You are the ${guardianId} guardian spirit in a magical forest game. Your personality is: ${personality}.

The player's current game state:
- Score: ${gameState.score ?? 0}
- Fruits collected: ${gameState.fruitsCollected ?? 0}

Speak ONE short, warm, encouraging sentence (under 20 words) to the player about their sapling journey.
Respond with ONLY the sentence text — no quotes, no labels, no explanation.`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 40 },
        }),
        signal: AbortSignal.timeout(6000),
      },
    )
    if (!res.ok) return fallbacks[guardianId] ?? fallbacks.deer
    const data = await res.json()
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return text.trim().replace(/^["']|["']$/g, '') || (fallbacks[guardianId] ?? fallbacks.deer)
  } catch {
    return fallbacks[guardianId] ?? fallbacks.deer
  }
}
