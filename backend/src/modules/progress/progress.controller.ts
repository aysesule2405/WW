import { Response } from 'express'
import progressRepo from './progress.repository'
import { AuthRequest } from '../../core/middleware/auth.middleware'
import pool from '../../config/database'

export const upsertProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { gameId, gameSlug, levelReached = 0, xp = 0, completionPercent = 0 } = req.body || {}
    let resolvedGameId = gameId ? Number(gameId) : null
    if (!resolvedGameId) {
      if (!gameSlug) return res.status(400).json({ error: 'gameId or gameSlug is required' })
      const [rows]: any = await pool.execute('SELECT id FROM games WHERE slug = ? LIMIT 1', [gameSlug])
      if (!rows || rows.length === 0) return res.status(404).json({ error: 'Game not found' })
      resolvedGameId = rows[0].id
    }

  const result = await progressRepo.upsertProgress(userId, Number(resolvedGameId), Number(levelReached), Number(xp), Number(completionPercent))
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
