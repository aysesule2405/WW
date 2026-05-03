import pool from '../../config/database'

export class UserRepository {
  async findByEmail(email: string) {
    const [rows]: any = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
    return rows[0]
  }

  async findByUsername(username: string) {
    const [rows]: any = await pool.execute('SELECT * FROM users WHERE username = ? LIMIT 1', [username])
    return rows[0]
  }

  async create(userData: { email: string; username: string; passwordHash: string }) {
    const [result]: any = await pool.execute(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
      [userData.email, userData.username, userData.passwordHash]
    )
    return result.insertId
  }

  async findById(id: number) {
    const [rows]: any = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
    return rows[0]
  }

  async updateProfile(id: number, data: { username?: string; avatarUrl?: string }) {
    const updates = [] as string[]
    const params: any[] = []
    if (data.username) {
      updates.push('username = ?')
      params.push(data.username)
    }
    if (data.avatarUrl) {
      updates.push('avatar_url = ?')
      params.push(data.avatarUrl)
    }
    if (updates.length === 0) return { updated: false }
    params.push(id)
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    await pool.execute(sql, params)
    return { updated: true }
  }
}

export default new UserRepository()