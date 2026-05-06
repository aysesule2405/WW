import { Router } from 'express'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import scoresController from './scores.controller'
import sessionsController from '../sessions/sessions.controller'

const router = Router()

// ── Static routes first (must precede /:gameSlug params) ─────────────────────
router.get('/delivery-on-the-wind/leaderboard/fastest', sessionsController.getDeliveryLeaderboard)
router.get('/progress/summary', authMiddleware, sessionsController.getProgressSummary)

// ── Score routes ──────────────────────────────────────────────────────────────
router.post('/:gameSlug/scores',     authMiddleware, scoresController.submitScore)
router.get('/:gameSlug/leaderboard',                 scoresController.getLeaderboard)
router.get('/:gameSlug/me',          authMiddleware, scoresController.getMyBest)
router.get('/:gameSlug/recent',      authMiddleware, scoresController.getRecentScores)

// ── Session routes ────────────────────────────────────────────────────────────
router.post('/:gameSlug/sessions',    authMiddleware, sessionsController.createSession)
router.get('/:gameSlug/sessions/me',  authMiddleware, sessionsController.getMySessionsForGame)

export default router
