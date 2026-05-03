import { Response } from 'express'
import { AuthRequest } from '../../core/middleware/auth.middleware'
import userRepo from './users.repository'
import fs from 'fs'
import path from 'path'

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  const user = await userRepo.findById(userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  // sanitize
  const { id, email, username, avatar_url } = user
  return res.status(200).json({ id, email, username, avatarUrl: avatar_url })
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  const { username } = req.body || {}
  if (!username) return res.status(400).json({ error: 'username is required' })
  try {
    await userRepo.updateProfile(userId, { username })
    return res.status(200).json({ updated: true })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  const { avatarBase64 } = req.body || {}
  if (!avatarBase64) return res.status(400).json({ error: 'avatarBase64 is required' })

  try {
    const matches = avatarBase64.match(/^data:(image\/\w+);base64,(.+)$/)
    if (!matches) return res.status(400).json({ error: 'Invalid base64 image' })
    const ext = matches[1].split('/')[1]
    const data = matches[2]
    const buffer = Buffer.from(data, 'base64')

    const uploadDir = path.resolve(__dirname, '../../../../backend/public/uploads/avatars')
    await fs.promises.mkdir(uploadDir, { recursive: true })
    const filename = `${userId}-${Date.now()}.${ext}`
    const filePath = path.join(uploadDir, filename)
    await fs.promises.writeFile(filePath, buffer)

    // construct public URL (backend serves /uploads from backend/public/uploads)
    const publicUrl = `/uploads/avatars/${filename}`
    await userRepo.updateProfile(userId, { avatarUrl: publicUrl })

    return res.status(200).json({ avatarUrl: publicUrl })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export default { getProfile, updateProfile, uploadAvatar }
