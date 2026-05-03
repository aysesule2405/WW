import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes.ts'

const router = Router()

router.use('/auth', authRoutes)

export default router
