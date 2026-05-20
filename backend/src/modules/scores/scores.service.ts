import { Types } from 'mongoose'
import { ScoreSubmission } from '../../models/ScoreSubmission'
import { UserHighScore } from '../../models/UserHighScore'
import { User } from '../../models/User'
import { Game } from '../../models/Game'
import achievementsService from '../achievements/achievements.service'

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

    const game = await Game.findById(gameOid).select('slug').lean()
    const achievements = game
      ? await achievementsService.awardForScore({ userId, gameSlug: game.slug, score })
      : []

    return { success: true, id: submission._id.toString(), newPersonalBest, achievements }
  },

  getLeaderboard: async (gameId: string, limit = 100) => {
    const gameOid = new Types.ObjectId(gameId)
    const rows = await UserHighScore
      .find({ gameId: gameOid })
      .sort({ score: -1, achievedAt: 1 })
      .limit(limit)
      .lean()

    const userIds = rows.map((r) => r.userId)
    const users   = await User.find({ _id: { $in: userIds } }).select('_id username avatarUrl avatarConfig richAvatarConfig avatarPreference').lean()
    const userMap = new Map(users.map((u) => [u._id.toString(), u]))

    return rows.map((r, i) => {
      const u = userMap.get(r.userId.toString())
      return {
        rank:             i + 1,
        userId:           r.userId.toString(),
        username:         u?.username ?? 'Unknown',
        avatarUrl:        (u as any)?.avatarUrl ?? null,
        avatarConfig:     (u as any)?.avatarConfig ?? null,
        richAvatarConfig:  (u as any)?.richAvatarConfig ?? null,
        avatarPreference:  (u as any)?.avatarPreference ?? null,
        score:        r.score,
        achievedAt:   r.achievedAt,
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

  // Returns the most recent score submissions for a player in one game.
  getRecentScores: async (userId: string, gameId: string, limit = 10) => {
    const rows = await ScoreSubmission
      .find({
        userId: new Types.ObjectId(userId),
        gameId: new Types.ObjectId(gameId),
      })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .lean()

    return rows.map((r) => ({
      id:        r._id.toString(),
      score:     r.score,
      metadata:  r.metadata ?? {},
      createdAt: r.createdAt,
    }))
  },
}
