import { Response } from 'express'
import progressRepo from './progress.repository'
import { AuthRequest } from '../../core/middleware/auth.middleware'
import { Game } from '../../models/Game'

export const upsertProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { gameSlug, levelReached = 0, xp = 0, completionPercent = 0 } = req.body || {}
    if (!gameSlug) return res.status(400).json({ error: 'gameSlug is required' })

    const game = await Game.findOne({ slug: gameSlug }).lean()
    if (!game) return res.status(404).json({ error: 'Game not found' })

    const result = await progressRepo.upsertProgress(
      userId,
      (game as any)._id.toString(),
      Number(levelReached),
      Number(xp),
      Number(completionPercent)
    )
    return res.status(200).json(result)
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export const getMyProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const rows = await progressRepo.getProgressForUser(userId)
    return res.status(200).json({ progress: rows })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
