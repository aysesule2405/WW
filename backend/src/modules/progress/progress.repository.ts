import pool from '../../config/database'

export class ProgressRepository {
  async upsertProgress(userId: number, gameId: number, levelReached = 0, xp = 0, completion = 0) {
    const [existing]: any = await pool.execute('SELECT id FROM user_game_progress WHERE user_id = ? AND game_id = ? LIMIT 1', [userId, gameId])
    if (existing && existing.length > 0) {
      await pool.execute(
        'UPDATE user_game_progress SET level_reached = ?, xp = ?, completion_percent = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND game_id = ?',
        [levelReached, xp, completion, userId, gameId]
      )
      return { updated: true }
    }

    const [result]: any = await pool.execute(
      'INSERT INTO user_game_progress (user_id, game_id, level_reached, xp, completion_percent) VALUES (?, ?, ?, ?, ?)',
      [userId, gameId, levelReached, xp, completion]
    )
    return { createdId: result.insertId }
  }

  async getProgressForUser(userId: number) {
    const [rows]: any = await pool.execute(
      `SELECT p.id, p.user_id, p.game_id, p.level_reached, p.xp, p.completion_percent, p.updated_at, g.slug as game_slug, g.title as game_title
       FROM user_game_progress p
       JOIN games g ON g.id = p.game_id
       WHERE p.user_id = ?`,
      [userId]
    )
    return rows
  }
}

export default new ProgressRepository()
