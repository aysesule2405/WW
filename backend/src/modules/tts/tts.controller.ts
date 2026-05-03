import { Request, Response } from 'express'
import ttsService from './tts.service'
import { AuthRequest } from '../../core/middleware/auth.middleware'

const synthesizeGuardian = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const { guardianId, text } = req.body || {}
    if (!guardianId || !text) return res.status(400).json({ error: 'guardianId and text required' })

    // enqueue or synthesize immediately depending on config
    const result = await ttsService.synthesizeGuardian({ userId, guardianId, text }) as any

    if (result.stream) {
      // stream raw audio back
      res.set('Content-Type', result.contentType || 'audio/mpeg')
      result.stream.pipe(res)
      return
    }

    return res.status(200).json(result)
  } catch (err: any) {
    console.error('tts synthesize error', err)
    return res.status(500).json({ error: err.message })
  }
}

export default { synthesizeGuardian }
