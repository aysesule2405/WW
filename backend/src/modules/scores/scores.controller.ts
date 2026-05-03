import { Request, Response } from 'express'
import scoresService from './scores.service'
import { AuthRequest } from '../../core/middleware/auth.middleware'

const submitScore = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { score, durationMs, metadata } = req.body || {}
    const gameId = Number(req.params.gameId)
    if (!gameId || typeof score !== 'number') {
      return res.status(400).json({ error: 'gameId and numeric score are required' })
    }

    const result = await scoresService.submitScore({ userId, gameId, score, durationMs, metadata })
    return res.status(201).json(result)
  } catch (err: any) {
    console.error('submitScore error', err)
    return res.status(500).json({ error: err.message })
  }
}

const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const gameId = Number(req.params.gameId)
    const limit = Math.min(Number(req.query.limit) || 100, 500)
    if (!gameId) return res.status(400).json({ error: 'gameId required' })
    const rows = await scoresService.getLeaderboard(gameId, limit)
    return res.status(200).json({ leaderboard: rows })
  } catch (err: any) {
    console.error('getLeaderboard error', err)
    return res.status(500).json({ error: err.message })
  }
}

const getMyBest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const gameId = Number(req.params.gameId)
    if (!gameId) return res.status(400).json({ error: 'gameId required' })
    const row = await scoresService.getMyBest(userId, gameId)
    return res.status(200).json({ best: row })
  } catch (err: any) {
    console.error('getMyBest error', err)
    return res.status(500).json({ error: err.message })
  }
}

export default { submitScore, getLeaderboard, getMyBest }
