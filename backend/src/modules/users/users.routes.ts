import { Router } from 'express'
import usersController from './users.controller'
import { authMiddleware } from '../../core/middleware/auth.middleware'

const router = Router()

router.get('/profile', authMiddleware, usersController.getProfile)
router.put('/profile', authMiddleware, usersController.updateProfile)
router.post('/profile/avatar', authMiddleware, usersController.uploadAvatar)

export default router
