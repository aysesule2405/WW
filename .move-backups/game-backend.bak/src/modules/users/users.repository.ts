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
}