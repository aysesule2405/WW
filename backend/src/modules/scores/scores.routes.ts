import { Router } from 'express'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import scoresController from './scores.controller'

const router = Router()

router.post('/:gameSlug/scores', authMiddleware, scoresController.submitScore)
router.get('/:gameSlug/leaderboard', scoresController.getLeaderboard)
router.get('/:gameSlug/me', authMiddleware, scoresController.getMyBest)

export default router
