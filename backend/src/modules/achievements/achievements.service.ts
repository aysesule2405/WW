import { Types } from 'mongoose'
import { Badge } from '../../models/Badge'
import { UserBadge } from '../../models/UserBadge'
import { GameSession } from '../../models/GameSession'
import { UserHighScore } from '../../models/UserHighScore'
import { Game } from '../../models/Game'
import { ACHIEVEMENTS, type AchievementDefinition } from './achievements.definitions'

const ALL_GAME_SLUGS_SET = new Set(['spirit-drift', 'delivery-on-the-wind', 'spirit-sapling', 'half-moon'])

export type AchievementDTO = AchievementDefinition & {
  earned: boolean
  awardedAt: Date | null
}

const byCode = new Map(ACHIEVEMENTS.map((a) => [a.code, a]))

const ALL_GAME_SLUGS = ['spirit-drift', 'delivery-on-the-wind', 'spirit-sapling', 'half-moon']
const DELIVERY_MAP_IDS = ['meadow', 'forest', 'coastal', 'mountain']

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
    code:        definition.code,
    title:       definition.title,
    description: definition.description,
    icon:        definition.icon ?? '🏅',
    rarity:      definition.rarity ?? 'common',
    iconUrl:     definition.iconUrl ?? null,
    awardedAt:   new Date(),
  }
}

async function awardMany(userId: string, codes: string[]) {
  const unlocked = []
  for (const code of codes) {
    const a = await award(userId, code)
    if (a) unlocked.push(a)
  }
  return unlocked
}

async function getUnlockedRealmCount(userId: string) {
  const realmCodes = ['drift_realm_wind', 'drift_realm_forest', 'drift_realm_lake', 'drift_realm_mountain']
  const badges = await Badge.find({ code: { $in: realmCodes } }).select('_id').lean()
  if (badges.length === 0) return 0
  const earned = await UserBadge.countDocuments({
    userId: new Types.ObjectId(userId),
    badgeId: { $in: badges.map((b) => b._id) },
  })
  return earned
}

async function getUnlockedSacredTreeCount(userId: string) {
  const treeCodes = ['sapling_tree_deer', 'sapling_tree_fox', 'sapling_tree_kodama', 'sapling_tree_mononoke']
  const badges = await Badge.find({ code: { $in: treeCodes } }).select('_id code').lean()
  if (badges.length === 0) return 0
  const earned = await UserBadge.find({
    userId: new Types.ObjectId(userId),
    badgeId: { $in: badges.map((b) => b._id) },
  }).lean()
  return earned.length
}

export default {
  listCatalog: async (): Promise<AchievementDTO[]> => {
    const badges = await Promise.all(ACHIEVEMENTS.map(ensureBadge))
    return badges.map((badge) => {
      const definition = byCode.get(badge.code)!
      return { ...definition, earned: false, awardedAt: null }
    })
  },

  listForUser: async (userId: string): Promise<AchievementDTO[]> => {
    const badges = await Promise.all(ACHIEVEMENTS.map(ensureBadge))
    let earned = await UserBadge.find({
      userId: new Types.ObjectId(userId),
      badgeId: { $in: badges.map((b) => b._id) },
    }).lean()

    const userOid = new Types.ObjectId(userId)
    const earnedByBadgeId = new Map(earned.map((row) => [row.badgeId.toString(), row]))
    const earnedCodes = new Set(
      badges
        .filter((b) => earnedByBadgeId.has(b._id.toString()))
        .map((b) => b.code)
    )

    const [sessions, highScores] = await Promise.all([
      GameSession.find({ userId: userOid }).lean(),
      UserHighScore.find({ userId: userOid }).lean(),
    ])
    const games = await Game.find({ _id: { $in: highScores.map((r) => r.gameId) } }).select('_id slug').lean()
    const gameIdToSlug = new Map(games.map((g) => [g._id.toString(), g.slug]))
    const highScoreBySlug = new Map<string, number>()
    for (const row of highScores) {
      const slug = gameIdToSlug.get(row.gameId.toString())
      if (slug) highScoreBySlug.set(slug, row.score)
    }

    // ── Per-game session sets ─────────────────────────────────────────────────
    const driftSessions     = sessions.filter((s) => s.gameSlug === 'spirit-drift')
    const saplingSessions   = sessions.filter((s) => s.gameSlug === 'spirit-sapling')
    const deliverySessions  = sessions.filter((s) => s.gameSlug === 'delivery-on-the-wind' && s.completed)
    const halfMoonSessions  = sessions.filter((s) => s.gameSlug === 'half-moon')

    const saplingTreeGuardians = new Set(
      saplingSessions
        .filter((s) => s.completed && s.guardianId)
        .map((s) => s.guardianId as string)
    )

    const harmonyBonusSessions = saplingSessions.filter((s) => s.harmonyBonus === true)
    const completedDeliveryMapIds = new Set(
      deliverySessions.map((s) => s.mapId).filter((id): id is string => typeof id === 'string')
    )
    const driftRealmIds = new Set(
      driftSessions.map((s) => s.realmId).filter((id): id is string => typeof id === 'string')
    )

    const guardianCounts: Record<string, number> = {}
    for (const s of saplingSessions.filter((s) => s.completed && s.guardianId)) {
      const g = s.guardianId as string
      guardianCounts[g] = (guardianCounts[g] ?? 0) + 1
    }
    const maxSameGuardian = Math.max(0, ...Object.values(guardianCounts))

    const halfMoonWins = halfMoonSessions.filter((s) => s.won === true).length

    // ── Grove-wide stats ──────────────────────────────────────────────────────
    const totalSessions = sessions.length
    const distinctGameSlugs = new Set(sessions.map((s) => s.gameSlug))

    // Different games per calendar day
    const gamesByDay = new Map<string, Set<string>>()
    const sessionCountByDay = new Map<string, number>()
    for (const s of sessions) {
      const day = new Date(s.createdAt).toISOString().split('T')[0]
      if (!gamesByDay.has(day)) gamesByDay.set(day, new Set())
      gamesByDay.get(day)!.add(s.gameSlug)
      sessionCountByDay.set(day, (sessionCountByDay.get(day) ?? 0) + 1)
    }
    const maxDiffGamesInDay = Math.max(0, ...[...gamesByDay.values()].map((s) => s.size))
    const maxSessionsInDay  = Math.max(0, ...[...sessionCountByDay.values()])

    // Time-of-day helpers
    const hasSessionInHours = (h1: number, h2: number) =>
      sessions.some((s) => { const h = new Date(s.createdAt).getHours(); return h >= h1 && h < h2 })

    // ── Evaluate which unearned achievements should now be awarded ─────────────
    const recoveredCodes = ACHIEVEMENTS
      .filter((def) => !earnedCodes.has(def.code) && !def.future)
      .filter((def) => {
        switch (def.code) {
          // Sapling trees
          case 'sapling_tree_deer':
          case 'sapling_tree_fox':
          case 'sapling_tree_kodama':
          case 'sapling_tree_mononoke':
            return saplingTreeGuardians.has(String(def.criteria.guardianId ?? ''))
          case 'sapling_all_trees':
            return saplingTreeGuardians.size >= 4
          case 'sapling_10_sessions':
            return saplingSessions.length >= 10
          case 'sapling_harmony':
            return harmonyBonusSessions.length >= 1
          case 'sapling_harmony_5':
            return harmonyBonusSessions.length >= 5
          case 'sapling_guardian_devoted':
            return maxSameGuardian >= 10
          case 'sapling_first_harvest':
            return saplingSessions.some((s) => (s.fruitsCollected ?? 0) >= 6)
          case 'sapling_patient_harvest':
            return saplingSessions.some((s) => (s.fruitsCollected ?? 0) >= 6 && s.hastyAttempts === 0)
          case 'sapling_need_listener':
            return saplingSessions.some((s) => (s.needMatchCount ?? 0) >= 4)
          case 'sapling_event_keeper':
            return saplingSessions.some((s) => (s.eventsSurvived ?? 0) >= 2)
          case 'sapling_uncorrupted':
            return saplingSessions.some((s) => s.completed && s.corruptionScore === 0)

          // Delivery
          case 'delivery_under_60':
            return deliverySessions.some((s) => typeof s.completionTimeSeconds === 'number' && s.completionTimeSeconds < 60)
          case 'delivery_under_45':
            return deliverySessions.some((s) => typeof s.completionTimeSeconds === 'number' && s.completionTimeSeconds < 45)
          case 'delivery_under_30':
            return deliverySessions.some((s) => typeof s.completionTimeSeconds === 'number' && s.completionTimeSeconds < 30)
          case 'delivery_10_sessions':
            return deliverySessions.length >= 10
          case 'delivery_50_sessions':
            return deliverySessions.length >= 50
          case 'delivery_map_meadow':
          case 'delivery_map_forest':
          case 'delivery_map_coastal':
          case 'delivery_map_mountain':
            return completedDeliveryMapIds.has(String(def.criteria.mapId ?? ''))
          case 'delivery_all_maps':
            return DELIVERY_MAP_IDS.every((id) => completedDeliveryMapIds.has(id))

          // Drift
          case 'drift_score_200':
            return (highScoreBySlug.get('spirit-drift') ?? 0) > 200 ||
              driftSessions.some((s) => (s.score ?? 0) > 200)
          case 'drift_score_500':
            return (highScoreBySlug.get('spirit-drift') ?? 0) > 500 ||
              driftSessions.some((s) => (s.score ?? 0) > 500)
          case 'drift_score_1000':
            return (highScoreBySlug.get('spirit-drift') ?? 0) > 1000 ||
              driftSessions.some((s) => (s.score ?? 0) > 1000)
          case 'drift_10_sessions':
            return driftSessions.length >= 10
          case 'drift_50_sessions':
            return driftSessions.length >= 50
          case 'drift_realm_wind':
          case 'drift_realm_forest':
          case 'drift_realm_lake':
          case 'drift_realm_mountain':
            return driftRealmIds.has(String(def.criteria.realmId ?? ''))
          case 'drift_all_realms':
            return ['wind', 'forest', 'lake', 'mountain'].every((id) => driftRealmIds.has(id))
          case 'drift_score_1500':
            return (highScoreBySlug.get('spirit-drift') ?? 0) >= 1500 ||
              driftSessions.some((s) => (s.score ?? 0) >= 1500)
          case 'drift_rare_5':
            return driftSessions.some((s) => (s.raresCaught ?? 0) >= 5)
          case 'drift_pure_run':
            return driftSessions.some((s) => s.completed && s.cursedCaught === 0)
          case 'drift_max_multiplier':
            return driftSessions.some((s) => (s.maxComboStreak ?? 0) >= 16)
          case 'drift_fleeting_5':
            return driftSessions.some((s) => (s.fleetingCaught ?? 0) >= 5)
          case 'drift_timing_10':
            return driftSessions.some((s) => (s.timingBonuses ?? 0) >= 10)

          // Half Moon
          case 'half_moon_score_50':
            return (highScoreBySlug.get('half-moon') ?? 0) >= 50 ||
              halfMoonSessions.some((s) => (s.score ?? 0) >= 50)
          case 'half_moon_score_100':
            return (highScoreBySlug.get('half-moon') ?? 0) >= 100 ||
              halfMoonSessions.some((s) => (s.score ?? 0) >= 100)
          case 'half_moon_score_200':
            return (highScoreBySlug.get('half-moon') ?? 0) >= 200 ||
              halfMoonSessions.some((s) => (s.score ?? 0) >= 200)
          case 'half_moon_10_sessions':
            return halfMoonSessions.length >= 10
          case 'half_moon_wins_5':
            return halfMoonWins >= 5
          case 'half_moon_ritual_complete':
            return halfMoonSessions.some((s) => s.completed && s.won === true)
          case 'half_moon_hard_victory':
            return halfMoonSessions.some((s) => s.completed && s.won === true && s.difficulty === 'hard')

          // Grove-wide
          case 'grove_first_session':
            return totalSessions >= 1
          case 'grove_10_sessions':
            return totalSessions >= 10
          case 'grove_50_sessions':
            return totalSessions >= 50
          case 'grove_100_sessions':
            return totalSessions >= 100
          case 'grove_all_games':
            return ALL_GAME_SLUGS.every((slug) => distinctGameSlugs.has(slug))
          case 'grove_3_in_day':
            return maxDiffGamesInDay >= 3

          // Easter eggs
          case 'easter_midnight':
            return hasSessionInHours(0, 4)
          case 'easter_early_bird':
            return hasSessionInHours(4, 6)
          case 'easter_5_in_day':
            return maxSessionsInDay >= 5

          default:
            return false
        }
      })
      .map((def) => def.code)

    if (recoveredCodes.length > 0) {
      await awardMany(userId, recoveredCodes)
      earned = await UserBadge.find({
        userId: userOid,
        badgeId: { $in: badges.map((b) => b._id) },
      }).lean()
      earnedByBadgeId.clear()
      for (const row of earned) earnedByBadgeId.set(row.badgeId.toString(), row)
    }

    return badges.map((badge) => {
      const row = earnedByBadgeId.get(badge._id.toString())
      const definition = byCode.get(badge.code)!
      return { ...definition, earned: Boolean(row), awardedAt: row?.awardedAt ?? null }
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
    harmonyBonus?: boolean | null
    mapId?: string | null
    fruitsCollected?: number | null
    hastyAttempts?: number | null
    patienceBonus?: number | null
    needMatchCount?: number | null
    synergyBoostCount?: number | null
    eventsSurvived?: number | null
    corruptionScore?: number | null
    // Spirit Drift run stats
    realmId?: string | null
    raresCaught?: number | null
    fleetingCaught?: number | null
    cursedCaught?: number | null
    maxComboStreak?: number | null
    timingBonuses?: number | null
    difficulty?: string | null
    aiMode?: string | null
  }) => {
    const codes: string[] = []

    // Spirit Sapling guardian trees
    if (input.gameSlug === 'spirit-sapling' && input.completed && input.guardianId) {
      const treeCode = `sapling_tree_${input.guardianId}`
      if (byCode.has(treeCode)) codes.push(treeCode)
    }

    // Spirit Sapling harmony
    if (input.gameSlug === 'spirit-sapling' && input.harmonyBonus) {
      codes.push('sapling_harmony')
    }

    if (input.gameSlug === 'spirit-sapling' && input.completed) {
      if ((input.fruitsCollected ?? 0) >= 6) codes.push('sapling_first_harvest')
      if ((input.fruitsCollected ?? 0) >= 6 && input.hastyAttempts === 0) codes.push('sapling_patient_harvest')
      if ((input.needMatchCount ?? 0) >= 4) codes.push('sapling_need_listener')
      if ((input.eventsSurvived ?? 0) >= 2) codes.push('sapling_event_keeper')
      if (input.corruptionScore === 0) codes.push('sapling_uncorrupted')
    }

    // Delivery time tiers
    if (
      input.gameSlug === 'delivery-on-the-wind' &&
      input.completed &&
      typeof input.completionTimeSeconds === 'number'
    ) {
      if (input.completionTimeSeconds < 60) codes.push('delivery_under_60')
      if (input.completionTimeSeconds < 45) codes.push('delivery_under_45')
      if (input.completionTimeSeconds < 30) codes.push('delivery_under_30')
    }

    if (input.gameSlug === 'delivery-on-the-wind' && input.completed && input.mapId) {
      const mapCode = `delivery_map_${input.mapId}`
      if (byCode.has(mapCode)) codes.push(mapCode)
    }

    // Half Moon score thresholds
    if (input.gameSlug === 'half-moon' && typeof input.score === 'number') {
      if (input.score >= 50)  codes.push('half_moon_score_50')
      if (input.score >= 100) codes.push('half_moon_score_100')
      if (input.score >= 200) codes.push('half_moon_score_200')
    }
    if (input.gameSlug === 'half-moon' && input.completed && input.won) {
      codes.push('half_moon_ritual_complete')
      if (input.difficulty === 'hard') codes.push('half_moon_hard_victory')
    }

    // Spirit Drift — realm exploration
    if (input.gameSlug === 'spirit-drift' && input.realmId) {
      const realmCode = `drift_realm_${input.realmId}`
      if (byCode.has(realmCode)) codes.push(realmCode)
    }

    // Spirit Drift — single-run challenges
    if (input.gameSlug === 'spirit-drift') {
      if ((input.score ?? 0) > 200) codes.push('drift_score_200')
      if ((input.score ?? 0) > 500) codes.push('drift_score_500')
      if ((input.score ?? 0) > 1000) codes.push('drift_score_1000')
      if ((input.score ?? 0) >= 1500) codes.push('drift_score_1500')
      if ((input.raresCaught   ?? 0) >= 5)  codes.push('drift_rare_5')
      if ((input.fleetingCaught ?? 0) >= 5) codes.push('drift_fleeting_5')
      if ((input.maxComboStreak ?? 0) >= 16) codes.push('drift_max_multiplier')
      if ((input.timingBonuses  ?? 0) >= 10) codes.push('drift_timing_10')
      if (input.cursedCaught === 0 && input.completed) codes.push('drift_pure_run')
    }

    const unlocked = await awardMany(input.userId, codes)

    // Delivery — all four active routes
    if (input.gameSlug === 'delivery-on-the-wind' && input.completed && input.mapId) {
      const completedMaps = await GameSession.distinct('mapId', {
        userId: new Types.ObjectId(input.userId),
        gameSlug: 'delivery-on-the-wind',
        completed: true,
      })
      if (DELIVERY_MAP_IDS.every((id) => (completedMaps as string[]).includes(id))) {
        const allMaps = await award(input.userId, 'delivery_all_maps')
        if (allMaps) unlocked.push(allMaps)
      }
    }

    // Spirit Drift — all realms (needs live badge count after realm award above)
    if (input.gameSlug === 'spirit-drift' && input.realmId) {
      const realmCount = await getUnlockedRealmCount(input.userId)
      if (realmCount >= 4) {
        const a = await award(input.userId, 'drift_all_realms')
        if (a) unlocked.push(a)
      }
    }

    // Half Moon wins milestone (needs live count)
    if (input.gameSlug === 'half-moon' && input.won) {
      const wins = await GameSession.countDocuments({ userId: new Types.ObjectId(input.userId), gameSlug: 'half-moon', won: true })
      if (wins === 5) {
        const a = await award(input.userId, 'half_moon_wins_5')
        if (a) unlocked.push(a)
      }
    }

    // Sapling harmony milestone
    if (input.gameSlug === 'spirit-sapling' && input.harmonyBonus) {
      const harmonyCount = await GameSession.countDocuments({ userId: new Types.ObjectId(input.userId), gameSlug: 'spirit-sapling', harmonyBonus: true })
      if (harmonyCount === 5) {
        const a = await award(input.userId, 'sapling_harmony_5')
        if (a) unlocked.push(a)
      }
    }

    // Sapling guardian devotion milestone
    if (input.gameSlug === 'spirit-sapling' && input.completed && input.guardianId) {
      const guardianCount = await GameSession.countDocuments({ userId: new Types.ObjectId(input.userId), gameSlug: 'spirit-sapling', guardianId: input.guardianId, completed: true })
      if (guardianCount === 10) {
        const a = await award(input.userId, 'sapling_guardian_devoted')
        if (a) unlocked.push(a)
      }
    }

    // Sapling all-trees check (needs DB)
    if (input.gameSlug === 'spirit-sapling') {
      const unlockedTreeCount = await getUnlockedSacredTreeCount(input.userId)
      if (unlockedTreeCount >= 4) {
        const allTrees = await award(input.userId, 'sapling_all_trees')
        if (allTrees) unlocked.push(allTrees)
      }
    }

    // ── Session-count and grove-wide achievements ─────────────────────────────
    const userOid = new Types.ObjectId(input.userId)

    const gameMilestoneFilter = input.gameSlug === 'delivery-on-the-wind'
      ? { userId: userOid, gameSlug: input.gameSlug, completed: true }
      : { userId: userOid, gameSlug: input.gameSlug }
    const [totalSessions, gameSessionCount, allDistinctSlugs] = await Promise.all([
      GameSession.countDocuments({ userId: userOid }),
      GameSession.countDocuments(gameMilestoneFilter),
      GameSession.distinct('gameSlug', { userId: userOid }),
    ])

    const countCodes: string[] = []

    // Grove-wide session milestones
    if (totalSessions === 1)   countCodes.push('grove_first_session')
    if (totalSessions === 10)  countCodes.push('grove_10_sessions')
    if (totalSessions === 50)  countCodes.push('grove_50_sessions')
    if (totalSessions === 100) countCodes.push('grove_100_sessions')

    // Played all 4 games
    if (ALL_GAME_SLUGS_SET.size > 0 &&
        [...ALL_GAME_SLUGS_SET].every((s) => (allDistinctSlugs as string[]).includes(s))) {
      countCodes.push('grove_all_games')
    }

    // Per-game session milestones
    if (gameSessionCount === 10) {
      const perGameCode: Record<string, string> = {
        'spirit-drift': 'drift_10_sessions',
        'delivery-on-the-wind': 'delivery_10_sessions',
        'spirit-sapling': 'sapling_10_sessions',
        'half-moon': 'half_moon_10_sessions',
      }
      if (perGameCode[input.gameSlug]) countCodes.push(perGameCode[input.gameSlug])
    }
    if (gameSessionCount === 50) {
      const perGameCode: Record<string, string> = {
        'spirit-drift': 'drift_50_sessions',
        'delivery-on-the-wind': 'delivery_50_sessions',
      }
      if (perGameCode[input.gameSlug]) countCodes.push(perGameCode[input.gameSlug])
    }

    // Easter egg: time-of-day
    const hour = new Date().getHours()
    if (hour >= 0 && hour < 4) countCodes.push('easter_midnight')
    if (hour >= 4 && hour < 6) countCodes.push('easter_early_bird')

    // Easter egg: 5 sessions in a day
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
    const sessionsToday = await GameSession.countDocuments({ userId: userOid, createdAt: { $gte: startOfDay } })
    if (sessionsToday >= 5) countCodes.push('easter_5_in_day')

    // 3 different games in a day
    const slugsToday = await GameSession.distinct('gameSlug', { userId: userOid, createdAt: { $gte: startOfDay } })
    if ((slugsToday as string[]).length >= 3) countCodes.push('grove_3_in_day')

    const countUnlocked = await awardMany(input.userId, countCodes)
    unlocked.push(...countUnlocked)

    return unlocked
  },

  awardForScore: async (input: {
    userId: string
    gameSlug: string
    score: number
  }) => {
    const codes: string[] = []
    if (input.gameSlug === 'spirit-drift') {
      if (input.score > 200)  codes.push('drift_score_200')
      if (input.score > 500)  codes.push('drift_score_500')
      if (input.score > 1000) codes.push('drift_score_1000')
      if (input.score >= 1500) codes.push('drift_score_1500')
    }
    if (input.gameSlug === 'half-moon') {
      if (input.score >= 50)  codes.push('half_moon_score_50')
      if (input.score >= 100) codes.push('half_moon_score_100')
      if (input.score >= 200) codes.push('half_moon_score_200')
    }
    return awardMany(input.userId, codes)
  },
}
