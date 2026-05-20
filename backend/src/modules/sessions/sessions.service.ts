import { Types } from 'mongoose'
import { GameSession } from '../../models/GameSession'
import { UserHighScore } from '../../models/UserHighScore'
import { ScoreSubmission } from '../../models/ScoreSubmission'
import { User } from '../../models/User'
import { Game } from '../../models/Game'
import achievementsService from '../achievements/achievements.service'

export interface CreateSessionInput {
  userId: string
  gameSlug: string
  gameName?: string | null
  score?: number | null
  completed: boolean
  won?: boolean | null
  levelReached?: number | null
  completionTimeSeconds?: number | null
  completionTime?: number | null
  shortestTime?: number | null
  deliveriesCompleted?: number | null
  guardianId?: string | null
  growthStageReached?: string | null
  waterActions?: number | null
  sunActions?: number | null
  talkActions?: number | null
  harmonyBonus?: boolean | null
  totalCardPoints?: number | null
  moonScore?: number | null
  winner?: string | null
  finalPlayerScore?: number | null
  saplingsGrown?: number | null
  fruitsCollected?: number | null
  shortestGrowthTimeSeconds?: number | null
}

const sessionsService = {
  createSession: async (input: CreateSessionInput) => {
    const { userId, gameSlug, score, ...rest } = input
    const userOid = new Types.ObjectId(userId)
    const defaultTitle = input.gameName ?? gameSlug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

    const [user, game] = await Promise.all([
      User.findById(userOid).select('_id username').lean(),
      Game.findOneAndUpdate(
        { slug: gameSlug },
        { $setOnInsert: { slug: gameSlug, title: defaultTitle, isActive: true } },
        { upsert: true, new: true }
      ).select('_id slug title').lean(),
    ])

    const session = await GameSession.create({
      userId: userOid,
      playerId: userId,
      username: user?.username ?? null,
      gameSlug,
      gameName: input.gameName ?? game?.title ?? null,
      score: score ?? null,
      date: new Date(),
      ...rest,
    })

    // Keep UserHighScore in sync for score-based games (enables existing leaderboard)
    if (score !== null && score !== undefined) {
      if (game) {
        const gameOid = (game as any)._id
        await ScoreSubmission.create({
          userId: userOid,
          gameId: gameOid,
          score,
          durationMs: rest.completionTimeSeconds ? rest.completionTimeSeconds * 1000 : null,
          metadata: {
            source: 'session',
            gameSlug,
            completed: rest.completed,
            won: rest.won ?? null,
            levelReached: rest.levelReached ?? null,
            guardianId: rest.guardianId ?? null,
            totalCardPoints: rest.totalCardPoints ?? null,
            moonScore: rest.moonScore ?? null,
            finalPlayerScore: rest.finalPlayerScore ?? null,
            fruitsCollected: rest.fruitsCollected ?? null,
            saplingsGrown: rest.saplingsGrown ?? null,
          },
        })

        await UserHighScore.findOneAndUpdate(
          { userId: userOid, gameId: gameOid },
          { $max: { score }, $setOnInsert: { achievedAt: new Date() } },
          { upsert: true }
        )
        // Update achievedAt only when it's a new best
        const doc = await UserHighScore.findOne({ userId: userOid, gameId: gameOid })
        if (doc && doc.score === score) {
          doc.achievedAt = new Date()
          await doc.save()
        }
      }
    }

    const achievements = await achievementsService.awardForSession({
      userId,
      gameSlug,
      score: score ?? null,
      completed: Boolean(rest.completed),
      completionTimeSeconds: rest.completionTimeSeconds ?? null,
      guardianId: rest.guardianId ?? null,
      won: rest.won ?? null,
    })

    return { id: session._id.toString(), achievements }
  },

  getMySessionsForGame: async (userId: string, gameSlug: string, limit = 20) => {
    const rows = await GameSession
      .find({ userId: new Types.ObjectId(userId), gameSlug })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .lean()

    return rows.map((r) => ({
      id:                    r._id.toString(),
      playerId:              r.playerId ?? r.userId.toString(),
      username:              r.username ?? null,
      gameName:              r.gameName ?? null,
      score:                 r.score ?? null,
      completed:             r.completed,
      won:                   r.won ?? null,
      levelReached:          r.levelReached ?? null,
      completionTimeSeconds: r.completionTimeSeconds ?? null,
      completionTime:        r.completionTime ?? null,
      shortestTime:          r.shortestTime ?? null,
      deliveriesCompleted:   r.deliveriesCompleted ?? null,
      guardianId:            r.guardianId ?? null,
      growthStageReached:    r.growthStageReached ?? null,
      totalCardPoints:       r.totalCardPoints ?? null,
      moonScore:             r.moonScore ?? null,
      winner:                r.winner ?? null,
      finalPlayerScore:      r.finalPlayerScore ?? null,
      harmonyBonus:          r.harmonyBonus ?? null,
      date:                  r.date ?? r.createdAt,
      createdAt:             r.createdAt,
    }))
  },

  // Aggregated stats for the progress summary — one call covers all games
  getProgressSummary: async (userId: string) => {
    const gameSlugs = ['spirit-drift', 'delivery-on-the-wind', 'spirit-sapling', 'half-moon']
    const userOid = new Types.ObjectId(userId)

    const [sessions, highScores] = await Promise.all([
      GameSession.find({ userId: userOid }).sort({ createdAt: -1 }).lean(),
      UserHighScore.find({ userId: userOid }).lean(),
    ])

    // Map gameId → slug for UserHighScore join
    const gameIds = highScores.map((h) => h.gameId)
    const games = await Game.find({ _id: { $in: gameIds } }).select('_id slug').lean()
    const gameIdToSlug = new Map(games.map((g) => [(g as any)._id.toString(), g.slug]))

    const highScoreBySlug = new Map<string, number>()
    for (const hs of highScores) {
      const slug = gameIdToSlug.get(hs.gameId.toString())
      if (slug) highScoreBySlug.set(slug, hs.score)
    }

    return gameSlugs.map((slug) => {
      const gameSessions = sessions.filter((s) => s.gameSlug === slug)
      const completed    = gameSessions.filter((s) => s.completed)
      const lastSession  = gameSessions[0] ?? null

      const base = {
        gameSlug:          slug,
        totalSessions:     gameSessions.length,
        completedSessions: completed.length,
        lastPlayedAt:      lastSession?.createdAt ?? null,
        highScore:         highScoreBySlug.get(slug) ?? null,
        recentSessions:    gameSessions.slice(0, 5),
      }

      if (slug === 'delivery-on-the-wind') {
        const bestTime = completed
          .map((s) => s.completionTimeSeconds)
          .filter((t): t is number => t !== null)
          .sort((a, b) => a - b)[0] ?? null
        return { ...base, bestCompletionTimeSeconds: bestTime }
      }

      if (slug === 'spirit-sapling') {
        const guardianCounts: Record<string, number> = {}
        for (const s of completed) {
          if (s.guardianId) guardianCounts[s.guardianId] = (guardianCounts[s.guardianId] ?? 0) + 1
        }
        const favoriteGuardianId = Object.entries(guardianCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

        return { ...base, favoriteGuardianId }
      }

      return base
    })
  },

  // Public fastest-completion leaderboard for Delivery on the Wind
  getDeliveryLeaderboard: async (limit = 25) => {
    const rows = await GameSession.aggregate([
      {
        $match: {
          gameSlug: 'delivery-on-the-wind',
          completed: true,
          completionTimeSeconds: { $ne: null, $gt: 0 },
        },
      },
      { $sort: { completionTimeSeconds: 1 } },
      {
        $group: {
          _id: '$userId',
          bestTime:    { $first: '$completionTimeSeconds' },
          achievedAt:  { $first: '$createdAt' },
        },
      },
      { $sort: { bestTime: 1 } },
      { $limit: limit },
    ])

    const userIds = rows.map((r) => r._id)
    const users   = await User.find({ _id: { $in: userIds } }).select('_id username avatarUrl avatarConfig').lean()
    const userMap = new Map(users.map((u) => [u._id.toString(), u]))

    return rows.map((r, i) => {
      const u = userMap.get(r._id.toString()) as any
      return {
        rank:            i + 1,
        userId:          r._id.toString(),
        username:        u?.username ?? 'Unknown',
        avatarUrl:       u?.avatarUrl ?? null,
        avatarConfig:    u?.avatarConfig ?? null,
        bestTimeSeconds: r.bestTime as number,
        achievedAt:      r.achievedAt as Date,
      }
    })
  },
}

export default sessionsService
