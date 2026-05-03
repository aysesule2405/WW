import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes'
import progressRoutes from '../modules/progress/progress.routes'
import usersRoutes from '../modules/users/users.routes'
import scoresRoutes from '../modules/scores/scores.routes'
import ttsRoutes from '../modules/tts/tts.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/progress', progressRoutes)
router.use('/users', usersRoutes)
router.use('/games', scoresRoutes)
router.use('/tts', ttsRoutes)

export default router
