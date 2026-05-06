import { Request, Response } from 'express'
import { checkKindness, generateGuardianMessage } from './spiritSapling.service'
import ttsService from '../tts/tts.service'
import { AuthRequest } from '../../core/middleware/auth.middleware'

// POST /api/v1/spirit-sapling/kindness-check
export async function kindnessCheck(req: Request, res: Response) {
  try {
    const { message } = req.body ?? {}
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' })
    }
    const result = await checkKindness(message)
    return res.status(200).json(result)
  } catch (err: any) {
    console.error('[SpiritSapling] kindnessCheck error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// POST /api/v1/spirit-sapling/guardian-voice
// Generates a dynamic guardian message via Gemini, then synthesizes via ElevenLabs
export async function guardianVoice(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { guardianId, gameState } = req.body ?? {}
    if (!guardianId || typeof guardianId !== 'string') {
      return res.status(400).json({ error: 'guardianId is required' })
    }

    const text = await generateGuardianMessage(guardianId, gameState ?? {})

    // Synthesize via ElevenLabs and stream audio back
    const result = await ttsService.synthesizeGuardian({ userId, guardianId, text }) as any

    if (result.stream) {
      res.set('Content-Type', result.contentType || 'audio/mpeg')
      res.set('X-Guardian-Text', encodeURIComponent(text))
      result.stream.pipe(res)
      return
    }

    return res.status(200).json({ text })
  } catch (err: any) {
    console.error('[SpiritSapling] guardianVoice error', err)
    return res.status(500).json({ error: err.message })
  }
}
