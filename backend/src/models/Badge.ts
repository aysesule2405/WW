import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IBadge extends Document {
  _id: Types.ObjectId
  code: string
  title: string
  description?: string
  iconUrl?: string
  criteria?: Record<string, unknown>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const BadgeSchema = new Schema<IBadge>(
  {
    code:        { type: String, required: true, unique: true, trim: true, maxlength: 150 },
    title:       { type: String, required: true, trim: true, maxlength: 255 },
    description: { type: String },
    iconUrl:     { type: String },
    criteria:    { type: Schema.Types.Mixed },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Badge = mongoose.model<IBadge>('Badge', BadgeSchema)
