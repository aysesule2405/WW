import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IChallenge extends Document {
  _id: Types.ObjectId
  gameId?: Types.ObjectId
  code: string
  title: string
  rules?: Record<string, unknown>
  isActive: boolean
  startsAt?: Date
  endsAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ChallengeSchema = new Schema<IChallenge>(
  {
    gameId:   { type: Schema.Types.ObjectId, ref: 'Game' },
    code:     { type: String, required: true, unique: true, trim: true, maxlength: 150 },
    title:    { type: String, required: true, trim: true, maxlength: 255 },
    rules:    { type: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt:   { type: Date },
  },
  { timestamps: true }
)

export const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema)
