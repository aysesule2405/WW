import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IUser extends Document {
  _id: Types.ObjectId
  email: string
  username: string
  passwordHash: string
  lastLoginAt?: Date
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 320 },
    username:     { type: String, required: true, unique: true, trim: true, minlength: 2, maxlength: 100 },
    passwordHash: { type: String, required: true },
    lastLoginAt:  { type: Date },
    avatarUrl:    { type: String, maxlength: 512 },
  },
  { timestamps: true }
)

export const User = mongoose.model<IUser>('User', UserSchema)
