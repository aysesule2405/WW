import pool from '../../config/database'

export default {
  submitScore: async ({ userId, gameId, score, durationMs, metadata }: any) => {
    // insert submission
    const [insertResult]: any = await pool.execute(
      `INSERT INTO score_submissions (user_id, game_id, score, metadata_json) VALUES (?, ?, ?, ?)`,
      [userId, gameId, score, JSON.stringify(metadata || {})],
    )

    const submissionId = insertResult.insertId || null

    // upsert into user_high_scores (MySQL style) -- DB migrations_pg are Postgres; keep compatibility with existing pool config
    await pool.execute(
      `INSERT INTO user_high_scores (user_id, game_id, high_score) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE high_score = GREATEST(high_score, VALUES(high_score)), achieved_at = IF(high_score < VALUES(high_score), NOW(), achieved_at)`,
      [userId, gameId, score],
    )

    // compute whether new personal best
    const [bestRows]: any = await pool.execute(
      `SELECT high_score FROM user_high_scores WHERE user_id = ? AND game_id = ? LIMIT 1`,
      [userId, gameId],
    )
    const highScore = bestRows && bestRows[0] ? Number(bestRows[0].high_score) : null

    const newPersonalBest = highScore === Number(score)

    return { success: true, id: submissionId, newPersonalBest }
  },

  getLeaderboard: async (gameId: number, limit = 100) => {
    const [rows]: any = await pool.execute(
      `SELECT u.id as userId, u.username, u.avatar_url as avatarUrl, hs.high_score as score, hs.achieved_at as achievedAt
       FROM user_high_scores hs
       JOIN users u ON u.id = hs.user_id
       WHERE hs.game_id = ?
       ORDER BY hs.high_score DESC, hs.achieved_at ASC
       LIMIT ?`,
      [gameId, limit],
    )
    return rows
  },

  getMyBest: async (userId: number, gameId: number) => {
    const [rows]: any = await pool.execute(
      `SELECT high_score as score, achieved_at as achievedAt FROM user_high_scores WHERE user_id = ? AND game_id = ? LIMIT 1`,
      [userId, gameId],
    )
    return rows && rows[0] ? rows[0] : null
  },
}
