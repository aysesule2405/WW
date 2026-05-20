import { Router } from 'express'
import { authMiddleware } from '../../core/middleware/auth.middleware'
import communityController from './community.controller'

const router = Router()

router.get('/posts', authMiddleware, communityController.listPosts)
router.post('/posts', authMiddleware, communityController.createPost)
router.post('/posts/:postId/replies', authMiddleware, communityController.createReply)
router.post('/posts/:postId/vote', authMiddleware, communityController.votePost)

export default router
