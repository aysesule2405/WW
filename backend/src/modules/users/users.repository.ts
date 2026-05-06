import { User } from '../../models/User'

export class UserRepository {
  async findByEmail(email: string) {
    return User.findOne({ email: email.toLowerCase() }).lean()
  }

  async findByUsername(username: string) {
    return User.findOne({ username }).lean()
  }

  async create(userData: { email: string; username: string; passwordHash: string }) {
    const user = await User.create({
      email: userData.email.toLowerCase(),
      username: userData.username,
      passwordHash: userData.passwordHash,
    })
    return user._id.toString()
  }

  async findById(id: string) {
    return User.findById(id).lean()
  }

  async updateProfile(id: string, data: {
    username?: string
    avatarUrl?: string
    status?: string
    favoriteSong?: string
    favoriteSteamGames?: string
    avatarConfig?: { face?: string; color?: string; accessory?: string }
  }) {
    const update: Record<string, unknown> = {}
    if (data.username) update.username = data.username
    if (data.avatarUrl) update.avatarUrl = data.avatarUrl
    if (data.status !== undefined) update.status = data.status
    if (data.favoriteSong !== undefined) update.favoriteSong = data.favoriteSong
    if (data.favoriteSteamGames !== undefined) update.favoriteSteamGames = data.favoriteSteamGames
    if (data.avatarConfig !== undefined) update.avatarConfig = data.avatarConfig
    if (Object.keys(update).length === 0) return { updated: false }
    await User.findByIdAndUpdate(id, { $set: update })
    return { updated: true }
  }
}

export default new UserRepository()
