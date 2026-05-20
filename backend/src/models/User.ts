import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  username: string
  passwordHash: string
  lastLoginAt?: Date
  avatarUrl?: string
  status?: string
  favoriteSong?: string
  favoriteSteamGames?: string
  avatarConfig?: {
    face?: string
    color?: string
    accessory?: string
  }
  richAvatarConfig?: string | null
  avatarPreference?: 'photo' | 'rich'
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 320 },
    username:     { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 100 },
    passwordHash: { type: String, required: true },
    lastLoginAt:  { type: Date },
    avatarUrl:    { type: String },
    status:       { type: String, trim: true, maxlength: 180 },
    favoriteSong: { type: String, trim: true, maxlength: 140 },
    favoriteSteamGames: { type: String, trim: true, maxlength: 300 },
    avatarConfig: {
      face:      { type: String, trim: true, maxlength: 8 },
      color:     { type: String, trim: true, maxlength: 32 },
      accessory: { type: String, trim: true, maxlength: 40 },
    },
    richAvatarConfig:  { type: String, maxlength: 4000, default: null },
    avatarPreference:  { type: String, enum: ['photo', 'rich'], default: null },
  },
  { timestamps: true }
)

export const User = mongoose.model<IUser>('User', UserSchema)
