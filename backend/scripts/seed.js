#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_USER = process.env.DB_USER || 'root'
const DB_PASSWORD = process.env.DB_PASSWORD || ''
const DB_DATABASE = process.env.DB_DATABASE || process.env.DB_NAME || 'ww_db'
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306

async function runSeeds() {
  const pool = mysql.createPool({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_DATABASE, port: DB_PORT })
  try {
    const seedsDir = path.resolve(__dirname, '../db/seeds')
    const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.sql')).sort()
    for (const file of files) {
      const sql = fs.readFileSync(path.join(seedsDir, file), 'utf8')
      console.log('Applying seed', file)
      await pool.query(sql)
    }

    // ensure admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'changeme'
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(adminPassword, salt)

    const [rows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [adminEmail])
    if (rows.length === 0) {
      console.log('Creating admin user', adminEmail)
      await pool.query('INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)', [adminEmail, 'admin', passwordHash])
    } else {
      console.log('Admin user already exists')
    }

    console.log('Seeding completed')
    await pool.end()
    process.exit(0)
  } catch (err) {
    console.error('Seed error', err)
    try { await pool.end() } catch (e) {}
    process.exit(1)
  }
}

runSeeds()
