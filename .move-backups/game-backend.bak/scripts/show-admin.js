#!/usr/bin/env node
const dotenv = require('dotenv')
const path = require('path')
const mysql = require('mysql2/promise')

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_DATABASE = process.env.DB_DATABASE || process.env.DB_NAME || 'ww_db'
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306

async function showAdmin() {
  const pool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_DATABASE, port: DB_PORT })
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const [rows] = await pool.query('SELECT id, email, username, created_at FROM users WHERE email = ? LIMIT 1', [adminEmail])
    if (rows.length === 0) {
      console.log('No admin user found for', adminEmail)
      process.exit(0)
    }
    const user = rows[0]
    console.log('Admin user:')
    console.log(JSON.stringify(user, null, 2))
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('Error querying admin user', err)
    try { await pool.end() } catch (e) {}
    process.exit(1)
  }
}

showAdmin()
