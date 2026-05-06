import { Router } from 'express'
import { kindnessCheck, guardianVoice } from './spiritSapling.controller'
import { authMiddleware } from '../../core/middleware/auth.middleware'

const router = Router()

// Public — no auth needed for kindness check
router.post('/kindness-check', kindnessCheck)

// Authenticated — guardian voice synthesis
router.post('/guardian-voice', authMiddleware, guardianVoice)

export default router
