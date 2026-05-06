import { Router } from 'express'
import { kindnessCheck, saplingChat, guardianVoice } from './spiritSapling.controller'
import { authMiddleware } from '../../core/middleware/auth.middleware'

const router = Router()

router.post('/kindness-check', kindnessCheck)
router.post('/chat', saplingChat)
router.post('/guardian-voice', authMiddleware, guardianVoice)

export default router
