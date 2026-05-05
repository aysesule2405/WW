import { Types } from 'mongoose'
import { UserGameProgress } from '../../models/UserGameProgress'
import { Game } from '../../models/Game'

export class ProgressRepository {
  async upsertProgress(userId: string, gameId: string, levelReached = 0, xp = 0, completionPercent = 0) {
    const userOid = new Types.ObjectId(userId)
    const gameOid = new Types.ObjectId(gameId)

    const result = await UserGameProgress.findOneAndUpdate(
      { userId: userOid, gameId: gameOid },
      { $set: { levelReached, xp, completionPercent } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )

    return { updated: true, id: result._id.toString() }
  }

  async getProgressForUser(userId: string) {
    const userOid = new Types.ObjectId(userId)
    const rows = await UserGameProgress.find({ userId: userOid }).lean()

    const gameIds = rows.map((r) => r.gameId)
    const games = await Game.find({ _id: { $in: gameIds } }).select('_id slug title').lean()
    const gameMap = new Map(games.map((g) => [g._id.toString(), g]))

    return rows.map((r) => {
      const g = gameMap.get(r.gameId.toString())
      return {
        id: r._id.toString(),
        userId: r.userId.toString(),
        gameId: r.gameId.toString(),
        gameSlug: g?.slug ?? null,
        gameTitle: g?.title ?? null,
        levelReached: r.levelReached,
        xp: r.xp,
        completionPercent: r.completionPercent,
        updatedAt: r.updatedAt,
      }
    })
  }
}

export default new ProgressRepository()
