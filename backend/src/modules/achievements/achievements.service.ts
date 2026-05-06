import { Types } from 'mongoose'
import { Badge } from '../../models/Badge'
import { UserBadge } from '../../models/UserBadge'
import { GameSession } from '../../models/GameSession'
import { UserHighScore } from '../../models/UserHighScore'
import { Game } from '../../models/Game'
import { ACHIEVEMENTS, type AchievementDefinition } from './achievements.definitions'

export type AchievementDTO = AchievementDefinition & {
  earned: boolean
  awardedAt: Date | null
}

const byCode = new Map(ACHIEVEMENTS.map((achievement) => [achievement.code, achievement]))

async function ensureBadge(definition: AchievementDefinition) {
  return Badge.findOneAndUpdate(
    { code: definition.code },
    {
      $set: {
        title: definition.title,
        description: definition.description,
        iconUrl: definition.iconUrl,
        criteria: definition.criteria,
        isActive: true,
      },
    },
    { upsert: true, new: true }
  )
}

async function award(userId: string, code: string) {
  const definition = byCode.get(code)
  if (!definition) return null

  const badge = await ensureBadge(definition)
  const result = await UserBadge.updateOne(
    { userId: new Types.ObjectId(userId), badgeId: badge._id },
    { $setOnInsert: { awardedAt: new Date() } },
    { upsert: true }
  )

  if (result.upsertedCount === 0) return null
  return {
    code: definition.code,
    title: definition.title,
    description: definition.description,
    iconUrl: definition.iconUrl ?? null,
    awardedAt: new Date(),
  }
}

async function awardMany(userId: string, codes: string[]) {
  const unlocked = []
  for (const code of codes) {
    const achievement = await award(userId, code)
    if (achievement) unlocked.push(achievement)
  }
  return unlocked
}

async function getUnlockedSacredTreeCount(userId: string) {
  const treeCodes = ['sapling_tree_deer', 'sapling_tree_fox', 'sapling_tree_kodama', 'sapling_tree_mononoke']
  const badges = await Badge.find({ code: { $in: treeCodes } }).select('_id code').lean()
  if (badges.length === 0) return 0

  const earned = await UserBadge.find({
    userId: new Types.ObjectId(userId),
    badgeId: { $in: badges.map((badge) => badge._id) },
  }).lean()

  return earned.length
}

export default {
  listCatalog: async (): Promise<AchievementDTO[]> => {
    const badges = await Promise.all(ACHIEVEMENTS.map(ensureBadge))
    return badges.map((badge) => {
      const definition = byCode.get(badge.code)!
      return {
        ...definition,
        earned: false,
        awardedAt: null,
      }
    })
  },

  listForUser: async (userId: string): Promise<AchievementDTO[]> => {
    const badges = await Promise.all(ACHIEVEMENTS.map(ensureBadge))
    let earned = await UserBadge.find({
      userId: new Types.ObjectId(userId),
      badgeId: { $in: badges.map((badge) => badge._id) },
    }).lean()

    const userOid = new Types.ObjectId(userId)
    const earnedByBadgeId = new Map(earned.map((row) => [row.badgeId.toString(), row]))
    const earnedCodes = new Set(
      badges
        .filter((badge) => earnedByBadgeId.has(badge._id.toString()))
        .map((badge) => badge.code)
    )

    const [sessions, highScores] = await Promise.all([
      GameSession.find({ userId: userOid }).lean(),
      UserHighScore.find({ userId: userOid }).lean(),
    ])
    const games = await Game.find({ _id: { $in: highScores.map((row) => row.gameId) } }).select('_id slug').lean()
    const gameIdToSlug = new Map(games.map((game) => [game._id.toString(), game.slug]))
    const highScoreBySlug = new Map<string, number>()
    for (const row of highScores) {
      const slug = gameIdToSlug.get(row.gameId.toString())
      if (slug) highScoreBySlug.set(slug, row.score)
    }

    const saplingTreeGuardians = new Set(
      sessions
        .filter((session) => session.gameSlug === 'spirit-sapling' && session.completed && session.guardianId)
        .map((session) => session.guardianId)
    )

    const recoveredCodes = ACHIEVEMENTS
      .filter((definition) => !earnedCodes.has(definition.code))
      .filter((definition) => {
        if (definition.code === 'sapling_all_trees') return saplingTreeGuardians.size >= 4
        if (definition.code.startsWith('sapling_tree_')) {
          const guardianId = String(definition.criteria.guardianId ?? '')
          return saplingTreeGuardians.has(guardianId)
        }
        if (definition.code === 'delivery_under_60') {
          return sessions.some((session) =>
            session.gameSlug === 'delivery-on-the-wind' &&
            session.completed &&
            typeof session.completionTimeSeconds === 'number' &&
            session.completionTimeSeconds < 60
          )
        }
        if (definition.code === 'drift_score_200') {
          return (highScoreBySlug.get('spirit-drift') ?? 0) > 200 ||
            sessions.some((session) => session.gameSlug === 'spirit-drift' && (session.score ?? 0) > 200)
        }
        if (definition.code === 'half_moon_score_50') {
          return (highScoreBySlug.get('half-moon') ?? 0) >= 50 ||
            sessions.some((session) => session.gameSlug === 'half-moon' && (session.score ?? 0) >= 50)
        }
        return false
      })
      .map((definition) => definition.code)

    if (recoveredCodes.length > 0) {
      await awardMany(userId, recoveredCodes)
      earned = await UserBadge.find({
        userId: userOid,
        badgeId: { $in: badges.map((badge) => badge._id) },
      }).lean()
      earnedByBadgeId.clear()
      for (const row of earned) earnedByBadgeId.set(row.badgeId.toString(), row)
    }

    return badges.map((badge) => {
      const row = earnedByBadgeId.get(badge._id.toString())
      const definition = byCode.get(badge.code)!
      return {
        ...definition,
        earned: Boolean(row),
        awardedAt: row?.awardedAt ?? null,
      }
    })
  },

  awardForSession: async (input: {
    userId: string
    gameSlug: string
    score?: number | null
    completed: boolean
    completionTimeSeconds?: number | null
    guardianId?: string | null
    won?: boolean | null
  }) => {
    const codes: string[] = []

    if (input.gameSlug === 'spirit-sapling' && input.completed && input.guardianId) {
      const treeCode = `sapling_tree_${input.guardianId}`
      if (byCode.has(treeCode)) codes.push(treeCode)
    }

    if (
      input.gameSlug === 'delivery-on-the-wind' &&
      input.completed &&
      typeof input.completionTimeSeconds === 'number' &&
      input.completionTimeSeconds < 60
    ) {
      codes.push('delivery_under_60')
    }

    if (
      input.gameSlug === 'half-moon' &&
      typeof input.score === 'number' &&
      input.score >= 50
    ) {
      codes.push('half_moon_score_50')
    }

    const unlocked = await awardMany(input.userId, codes)

    if (input.gameSlug === 'spirit-sapling') {
      const unlockedTreeCount = await getUnlockedSacredTreeCount(input.userId)
      if (unlockedTreeCount >= 4) {
        const allTrees = await award(input.userId, 'sapling_all_trees')
        if (allTrees) unlocked.push(allTrees)
      }
    }

    return unlocked
  },

  awardForScore: async (input: {
    userId: string
    gameSlug: string
    score: number
  }) => {
    const codes: string[] = []
    if (input.gameSlug === 'spirit-drift' && input.score > 200) {
      codes.push('drift_score_200')
    }
    if (input.gameSlug === 'half-moon' && input.score >= 50) {
      codes.push('half_moon_score_50')
    }
    return awardMany(input.userId, codes)
  },
}
