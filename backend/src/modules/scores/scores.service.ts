import { Types } from 'mongoose'
import { ScoreSubmission } from '../../models/ScoreSubmission'
import { UserHighScore } from '../../models/UserHighScore'
import { User } from '../../models/User'

export default {
  submitScore: async ({ userId, gameId, score, durationMs, metadata }: {
    userId: string
    gameId: string
    score: number
    durationMs?: number
    metadata?: Record<string, unknown>
  }) => {
    const userOid = new Types.ObjectId(userId)
    const gameOid = new Types.ObjectId(gameId)

    const submission = await ScoreSubmission.create({
      userId: userOid,
      gameId: gameOid,
      score,
      durationMs: durationMs ?? null,
      metadata: metadata ?? {},
    })

    const existing = await UserHighScore.findOne({ userId: userOid, gameId: gameOid })
    let newPersonalBest = false

    if (!existing) {
      await UserHighScore.create({ userId: userOid, gameId: gameOid, score, achievedAt: new Date() })
      newPersonalBest = true
    } else if (score > existing.score) {
      existing.score = score
      existing.achievedAt = new Date()
      await existing.save()
      newPersonalBest = true
    }

    return { success: true, id: submission._id.toString(), newPersonalBest }
  },

  getLeaderboard: async (gameId: string, limit = 100) => {
    const gameOid = new Types.ObjectId(gameId)
    const rows = await UserHighScore
      .find({ gameId: gameOid })
      .sort({ score: -1, achievedAt: 1 })
      .limit(limit)
      .lean()

    const userIds = rows.map((r) => r.userId)
    const users = await User.find({ _id: { $in: userIds } }).select('_id username avatarUrl').lean()
    const userMap = new Map(users.map((u) => [u._id.toString(), u]))

    return rows.map((r) => {
      const u = userMap.get(r.userId.toString())
      return {
        userId: r.userId.toString(),
        username: u?.username ?? 'Unknown',
        avatarUrl: u?.avatarUrl ?? null,
        score: r.score,
        achievedAt: r.achievedAt,
      }
    })
  },

  getMyBest: async (userId: string, gameId: string) => {
    const row = await UserHighScore
      .findOne({ userId: new Types.ObjectId(userId), gameId: new Types.ObjectId(gameId) })
      .lean()
    if (!row) return null
    return { score: row.score, achievedAt: row.achievedAt }
  },
}
