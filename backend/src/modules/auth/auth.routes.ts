import { Router } from 'express'
import { register, login, changePassword } from './auth.controller'
import { authMiddleware } from '../../core/middleware/auth.middleware'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.put('/change-password', authMiddleware, changePassword)

export default router
