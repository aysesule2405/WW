import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IMultiplayerSession extends Document {
  _id: Types.ObjectId
  gameId: Types.ObjectId
  hostUserId: Types.ObjectId
  participantIds: Types.ObjectId[]
  status: 'waiting' | 'active' | 'finished' | 'cancelled'
  roomCode: string
  maxPlayers: number
  sessionData: Record<string, unknown>
  startedAt?: Date
  endedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const MultiplayerSessionSchema = new Schema<IMultiplayerSession>(
  {
    gameId:         { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    hostUserId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participantIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status:         { type: String, enum: ['waiting', 'active', 'finished', 'cancelled'], default: 'waiting' },
    roomCode:       { type: String, required: true, unique: true, trim: true, maxlength: 20 },
    maxPlayers:     { type: Number, default: 4 },
    sessionData:    { type: Schema.Types.Mixed, default: {} },
    startedAt:      { type: Date },
    endedAt:        { type: Date },
  },
  { timestamps: true }
)

MultiplayerSessionSchema.index({ status: 1, createdAt: -1 })
MultiplayerSessionSchema.index({ hostUserId: 1 })

export const MultiplayerSession = mongoose.model<IMultiplayerSession>(
  'MultiplayerSession',
  MultiplayerSessionSchema
)
