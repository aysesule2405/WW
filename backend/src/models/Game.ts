import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IGame extends Document {
  _id: Types.ObjectId
  slug: string
  title: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const GameSchema = new Schema<IGame>(
  {
    slug:     { type: String, required: true, unique: true, trim: true, maxlength: 150 },
    title:    { type: String, required: true, trim: true, maxlength: 255 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Game = mongoose.model<IGame>('Game', GameSchema)
