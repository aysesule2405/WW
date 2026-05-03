import { Router } from 'express'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import scoresController from './scores.controller'

const router = Router()

// submit a score
router.post('/:gameId/scores', authMiddleware, scoresController.submitScore)
// fetch leaderboard
router.get('/:gameId/leaderboard', scoresController.getLeaderboard)
// get my best
router.get('/:gameId/me', authMiddleware, scoresController.getMyBest)

export default router
