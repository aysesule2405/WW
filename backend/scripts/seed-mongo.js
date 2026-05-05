#!/usr/bin/env node
'use strict'

const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
const mongoose = require('mongoose')

const GameSchema = new mongoose.Schema(
  {
    slug:     { type: String, required: true, unique: true },
    title:    { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)
const Game = mongoose.models.Game || mongoose.model('Game', GameSchema)

const GAMES = [
  { slug: 'spirit-drift',    title: 'Spirit Drift' },
  { slug: 'ember-run',       title: 'Ember Run' },
  { slug: 'moonveil-puzzle', title: 'Moonveil Puzzle' },
]

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI not set in .env')
    process.exit(1)
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  console.log('Connected to MongoDB')

  for (const game of GAMES) {
    const result = await Game.updateOne(
      { slug: game.slug },
      { $setOnInsert: game },
      { upsert: true }
    )
    const status = result.upsertedCount > 0 ? 'inserted' : 'already exists'
    console.log(`  ${game.slug}: ${status}`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
