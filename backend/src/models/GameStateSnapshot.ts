import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IGameStateSnapshot extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  gameId: Types.ObjectId
  state: Record<string, unknown>
  version: number
  savedAt: Date
}

const GameStateSnapshotSchema = new Schema<IGameStateSnapshot>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameId:  { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    state:   { type: Schema.Types.Mixed, required: true },
    version: { type: Number, default: 1 },
    savedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

GameStateSnapshotSchema.index({ userId: 1, gameId: 1 }, { unique: true })

export const GameStateSnapshot = mongoose.model<IGameStateSnapshot>('GameStateSnapshot', GameStateSnapshotSchema)
