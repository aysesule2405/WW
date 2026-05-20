import bcrypt from 'bcrypt'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { AuthRequest } from '../../core/middleware/auth.middleware'
import userRepo from '../users/users.repository'

const authService = new AuthService()

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body || {}
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'email, username and password are required' })
    }

    const result = await authService.register(email, username, password)
    return res.status(201).json(result)
  } catch (error: any) {
    return res.status(400).json({ error: error.message })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const result = await authService.login(email, password)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(401).json({ error: error.message })
  }
}

export const changePassword = async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' })
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' })
  }

  try {
    const user = await userRepo.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' })

    const newHash = await bcrypt.hash(newPassword, 10)
    await userRepo.updatePassword(userId, newHash)
    return res.status(200).json({ updated: true })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
