import { Request, Response } from 'express'
import { AuthRequest } from '../../core/middleware/auth.middleware'
import sessionsService from './sessions.service'

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const gameSlug = String(req.params.gameSlug)
    const { completed, score, gameName, completionTimeSeconds, completionTime,
            shortestTime, levelReached, finalPlayerScore, deliveriesCompleted,
            mapId,
            guardianId, growthStageReached, waterActions, sunActions,
            talkActions, harmonyBonus,
            totalCardPoints, moonScore, winner, won,
            saplingsGrown, fruitsCollected, shortestGrowthTimeSeconds,
            hastyAttempts, patienceBonus, needMatchCount, synergyBoostCount,
            eventsSurvived, corruptionScore,
            realmId, raresCaught, fleetingCaught, cursedCaught,
            maxComboStreak, timingBonuses,
            difficulty, aiMode } = req.body ?? {}

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: '"completed" boolean is required' })
    }

    const result = await sessionsService.createSession({
      userId,
      gameSlug,
      gameName:              gameName ?? null,
      completed,
      score:                 score ?? null,
      completionTimeSeconds: completionTimeSeconds ?? null,
      completionTime:        completionTime ?? null,
      shortestTime:          shortestTime ?? null,
      levelReached:          levelReached ?? null,
      deliveriesCompleted:   deliveriesCompleted ?? null,
      mapId:                 mapId ?? null,
      guardianId:            guardianId ?? null,
      growthStageReached:    growthStageReached ?? null,
      waterActions:          waterActions ?? null,
      sunActions:            sunActions ?? null,
      talkActions:           talkActions ?? null,
      harmonyBonus:          harmonyBonus ?? null,
      totalCardPoints:       totalCardPoints ?? null,
      moonScore:             moonScore ?? null,
      winner:                winner ?? null,
      won:                   won ?? null,
      finalPlayerScore:      finalPlayerScore ?? null,
      saplingsGrown:         saplingsGrown ?? null,
      fruitsCollected:       fruitsCollected ?? null,
      shortestGrowthTimeSeconds: shortestGrowthTimeSeconds ?? null,
      hastyAttempts:         hastyAttempts ?? null,
      patienceBonus:         patienceBonus ?? null,
      needMatchCount:        needMatchCount ?? null,
      synergyBoostCount:     synergyBoostCount ?? null,
      eventsSurvived:        eventsSurvived ?? null,
      corruptionScore:       corruptionScore ?? null,
      realmId:               realmId ?? null,
      raresCaught:           raresCaught ?? null,
      fleetingCaught:        fleetingCaught ?? null,
      cursedCaught:          cursedCaught ?? null,
      maxComboStreak:        maxComboStreak ?? null,
      timingBonuses:         timingBonuses ?? null,
      difficulty:            difficulty ?? null,
      aiMode:                aiMode ?? null,
    })
    return res.status(201).json(result)
  } catch (err: any) {
    console.error('createSession error', err)
    return res.status(500).json({ error: err.message })
  }
}

export const getMySessionsForGame = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const gameSlug = String(req.params.gameSlug)
    const limit    = Math.min(Number(req.query.limit) || 20, 50)
    const sessions = await sessionsService.getMySessionsForGame(userId, gameSlug, limit)
    return res.status(200).json({ sessions })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export const getProgressSummary = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })
    const summary = await sessionsService.getProgressSummary(userId)
    return res.status(200).json({ games: summary })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export const getDeliveryLeaderboard = async (_req: Request, res: Response) => {
  try {
    const rows = await sessionsService.getDeliveryLeaderboard(25)
    return res.status(200).json({ leaderboard: rows })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export default { createSession, getMySessionsForGame, getProgressSummary, getDeliveryLeaderboard }
