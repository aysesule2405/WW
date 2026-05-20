import { Response } from 'express'
import { AuthRequest } from '../../core/middleware/auth.middleware'
import userRepo from './users.repository'

export const getProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  const user = await userRepo.findById(userId)
  if (!user) return res.status(404).json({ error: 'User not found' })
  return res.status(200).json({
    id: (user as any)._id.toString(),
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl ?? null,
    status: user.status ?? '',
    favoriteSong: user.favoriteSong ?? '',
    favoriteSteamGames: user.favoriteSteamGames ?? '',
    avatarConfig: user.avatarConfig ?? null,
    richAvatarConfig: user.richAvatarConfig ?? null,
    avatarPreference: (user as any).avatarPreference ?? null,
  })
}

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })
  const { username, status, favoriteSong, favoriteSteamGames, avatarConfig, richAvatarConfig } = req.body || {}
  if (!username) return res.status(400).json({ error: 'username is required' })
  try {
    await userRepo.updateProfile(userId, {
      username,
      status: String(status ?? '').slice(0, 180),
      favoriteSong: String(favoriteSong ?? '').slice(0, 140),
      favoriteSteamGames: String(favoriteSteamGames ?? '').slice(0, 300),
      avatarConfig: avatarConfig && typeof avatarConfig === 'object'
        ? {
            face: String(avatarConfig.face ?? '🙂').slice(0, 8),
            color: String(avatarConfig.color ?? '#ADC178').slice(0, 32),
            accessory: String(avatarConfig.accessory ?? 'leaf').slice(0, 40),
          }
        : undefined,
      richAvatarConfig: typeof richAvatarConfig === 'string'
        ? richAvatarConfig.slice(0, 4000)
        : undefined,
      avatarPreference: typeof richAvatarConfig === 'string' ? 'rich' : undefined,
    })
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
    if (matches[2].length > 2_800_000) return res.status(400).json({ error: 'Image too large (max ~2MB)' })

    await userRepo.updateProfile(userId, { avatarUrl: avatarBase64, avatarPreference: 'photo' })
    return res.status(200).json({ avatarUrl: avatarBase64 })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export default { getProfile, updateProfile, uploadAvatar }
