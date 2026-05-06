import { Router } from 'express'
import { getAIMove } from './halfMoon.controller'

const router = Router()

// POST /api/v1/games/half-moon/ai-move
// No auth required — the client sends board state, not player identity.
// The response is just a move suggestion; core scoring is validated client-side.
router.post('/ai-move', getAIMove)

export default router
