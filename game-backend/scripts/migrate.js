#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

// Load .env from game-backend folder
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const mysql = require('mysql2/promise')

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_DATABASE = process.env.DB_DATABASE || process.env.DB_NAME || 'ww_db'
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306

// First connect without selecting a database so we can create it if needed
const adminPool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 2,
})

async function ensureDatabaseExists() {
  await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${DB_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
}

async function main() {
  await ensureDatabaseExists()

  const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
})
  async function runMigrations() {
    try {
      const migrationsDir = path.resolve(__dirname, '../db/migrations')
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
      for (const file of files) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
        console.log('Applying', file)
        await pool.query(sql)
      }
      console.log('Migrations applied')
      await pool.end()
      try { await adminPool.end() } catch (e) {}
      process.exit(0)
    } catch (err) {
      console.error('Migration error', err)
      try { await pool.end() } catch (e) {}
      try { await adminPool.end() } catch (e) {}
      process.exit(1)
    }
  }

  await runMigrations()
}

main()
