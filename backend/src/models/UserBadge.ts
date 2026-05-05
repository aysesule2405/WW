import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IUserBadge extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  badgeId: Types.ObjectId
  awardedAt: Date
}

const UserBadgeSchema = new Schema<IUserBadge>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    badgeId:   { type: Schema.Types.ObjectId, ref: 'Badge', required: true },
    awardedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true })

export const UserBadge = mongoose.model<IUserBadge>('UserBadge', UserBadgeSchema)
