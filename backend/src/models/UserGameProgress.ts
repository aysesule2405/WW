import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IUserGameProgress extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  gameId: Types.ObjectId
  levelReached: number
  xp: number
  completionPercent: number
  createdAt: Date
  updatedAt: Date
}

const UserGameProgressSchema = new Schema<IUserGameProgress>(
  {
    userId:            { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameId:            { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    levelReached:      { type: Number, default: 0, min: 0 },
    xp:                { type: Number, default: 0, min: 0 },
    completionPercent: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
)

UserGameProgressSchema.index({ userId: 1, gameId: 1 }, { unique: true })

export const UserGameProgress = mongoose.model<IUserGameProgress>('UserGameProgress', UserGameProgressSchema)
