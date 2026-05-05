import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IUserHighScore extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  gameId: Types.ObjectId
  score: number
  achievedAt: Date
}

const UserHighScoreSchema = new Schema<IUserHighScore>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameId:     { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    score:      { type: Number, required: true },
    achievedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

UserHighScoreSchema.index({ userId: 1, gameId: 1 }, { unique: true })
UserHighScoreSchema.index({ gameId: 1, score: -1 })

export const UserHighScore = mongoose.model<IUserHighScore>('UserHighScore', UserHighScoreSchema)
