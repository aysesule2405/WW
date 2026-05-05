import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IRefreshToken extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  tokenHash: string
  expiresAt: Date
  revokedAt?: Date
  createdAt: Date
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

RefreshTokenSchema.index({ userId: 1, expiresAt: 1 })

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)
