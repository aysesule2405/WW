import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IGameSession extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  playerId?: string | null
  username?: string | null
  gameSlug: string
  gameName?: string | null
  score?: number | null
  completed: boolean
  won?: boolean | null
  levelReached?: number | null
  completionTimeSeconds?: number | null
  completionTime?: number | null
  shortestTime?: number | null
  deliveriesCompleted?: number | null
  mapId?: string | null
  guardianId?: string | null
  growthStageReached?: string | null
  waterActions?: number | null
  sunActions?: number | null
  talkActions?: number | null
  harmonyBonus?: boolean | null
  totalCardPoints?: number | null
  moonScore?: number | null
  winner?: string | null
  finalPlayerScore?: number | null
  // Spirit Sapling
  saplingsGrown?: number | null
  fruitsCollected?: number | null
  shortestGrowthTimeSeconds?: number | null
  hastyAttempts?: number | null
  patienceBonus?: number | null
  needMatchCount?: number | null
  synergyBoostCount?: number | null
  eventsSurvived?: number | null
  corruptionScore?: number | null
  // Spirit Drift
  realmId?: string | null
  raresCaught?: number | null
  fleetingCaught?: number | null
  cursedCaught?: number | null
  maxComboStreak?: number | null
  timingBonuses?: number | null
  // Half Moon
  difficulty?: string | null
  aiMode?: string | null
  date?: Date
  createdAt: Date
}

const GameSessionSchema = new Schema<IGameSession>(
  {
    userId:                { type: Schema.Types.ObjectId, ref: 'User', required: true },
    playerId:              { type: String, default: null },
    username:              { type: String, default: null },
    gameSlug:              { type: String, required: true },
    gameName:              { type: String, default: null },
    score:                 { type: Number, default: null },
    completed:             { type: Boolean, required: true, default: false },
    won:                   { type: Boolean, default: null },
    levelReached:          { type: Number, default: null },
    completionTimeSeconds: { type: Number, default: null },
    completionTime:        { type: Number, default: null },
    shortestTime:          { type: Number, default: null },
    deliveriesCompleted:   { type: Number, default: null },
    mapId:                 { type: String, default: null },
    guardianId:            { type: String, default: null },
    growthStageReached:    { type: String, default: null },
    waterActions:          { type: Number, default: null },
    sunActions:            { type: Number, default: null },
    talkActions:           { type: Number, default: null },
    harmonyBonus:          { type: Boolean, default: null },
    totalCardPoints:       { type: Number, default: null },
    moonScore:             { type: Number, default: null },
    winner:                { type: String, default: null },
    finalPlayerScore:      { type: Number, default: null },
    saplingsGrown:         { type: Number, default: null },
    fruitsCollected:       { type: Number, default: null },
    shortestGrowthTimeSeconds: { type: Number, default: null },
    hastyAttempts:         { type: Number, default: null },
    patienceBonus:         { type: Number, default: null },
    needMatchCount:        { type: Number, default: null },
    synergyBoostCount:     { type: Number, default: null },
    eventsSurvived:        { type: Number, default: null },
    corruptionScore:       { type: Number, default: null },
    realmId:               { type: String, default: null },
    raresCaught:           { type: Number, default: null },
    fleetingCaught:        { type: Number, default: null },
    cursedCaught:          { type: Number, default: null },
    maxComboStreak:        { type: Number, default: null },
    timingBonuses:         { type: Number, default: null },
    difficulty:            { type: String, default: null },
    aiMode:                { type: String, default: null },
    date:                  { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

GameSessionSchema.index({ userId: 1, gameSlug: 1 })
GameSessionSchema.index({ gameSlug: 1, createdAt: -1 })
// Compound for delivery fastest-times leaderboard
GameSessionSchema.index({ gameSlug: 1, completed: 1, completionTimeSeconds: 1 })

export const GameSession = mongoose.model<IGameSession>('GameSession', GameSessionSchema)
