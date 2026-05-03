import { Router } from 'express'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import ttsController from './tts.controller'

const router = Router()

router.post('/guardian', authMiddleware, ttsController.synthesizeGuardian)

export default router
