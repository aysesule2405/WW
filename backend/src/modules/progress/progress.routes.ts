import { Router } from 'express'
import * as progressController from './progress.controller'
import { authMiddleware } from '../../core/middleware/auth.middleware'

const router = Router()

router.post('/', authMiddleware, progressController.upsertProgress)
router.get('/', authMiddleware, progressController.getMyProgress)

export default router
