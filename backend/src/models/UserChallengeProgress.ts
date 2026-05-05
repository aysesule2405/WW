import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IUserChallengeProgress extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  challengeId: Types.ObjectId
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  progress: Record<string, unknown>
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserChallengeProgressSchema = new Schema<IUserChallengeProgress>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true },
    status:      { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
    progress:    { type: Schema.Types.Mixed, default: {} },
    completedAt: { type: Date },
  },
  { timestamps: true }
)

UserChallengeProgressSchema.index({ userId: 1, challengeId: 1 }, { unique: true })

export const UserChallengeProgress = mongoose.model<IUserChallengeProgress>(
  'UserChallengeProgress',
  UserChallengeProgressSchema
)
