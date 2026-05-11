import { Router } from 'express'
import authRoutes         from '../modules/auth/auth.routes'
import progressRoutes     from '../modules/progress/progress.routes'
import usersRoutes        from '../modules/users/users.routes'
import scoresRoutes       from '../modules/scores/scores.routes'
import ttsRoutes          from '../modules/tts/tts.routes'
import halfMoonRoutes     from '../modules/halfMoon/halfMoon.routes'
import spiritSaplingRoutes from '../modules/spiritSapling/spiritSapling.routes'
import achievementsRoutes from '../modules/achievements/achievements.routes'
import communityRoutes    from '../modules/community/community.routes'

const router = Router()

router.use('/auth',           authRoutes)
router.use('/progress',       progressRoutes)
router.use('/users',          usersRoutes)
router.use('/games',          scoresRoutes)
router.use('/games/half-moon', halfMoonRoutes)
router.use('/tts',            ttsRoutes)
router.use('/spirit-sapling', spiritSaplingRoutes)
router.use('/achievements',   achievementsRoutes)
router.use('/community',      communityRoutes)

export default router
