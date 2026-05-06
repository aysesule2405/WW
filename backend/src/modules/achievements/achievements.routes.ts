import { Router } from 'express'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import achievementsController from './achievements.controller'

const router = Router()

router.get('/catalog', achievementsController.listCatalog)
router.get('/me', authMiddleware, achievementsController.listMine)

export default router
