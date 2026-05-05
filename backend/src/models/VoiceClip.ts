import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IVoiceClip extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  gameId?: Types.ObjectId
  text: string
  audioUrl: string
  durationMs?: number
  language: string
  createdAt: Date
}

const VoiceClipSchema = new Schema<IVoiceClip>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameId:     { type: Schema.Types.ObjectId, ref: 'Game' },
    text:       { type: String, required: true },
    audioUrl:   { type: String, required: true },
    durationMs: { type: Number },
    language:   { type: String, default: 'en', maxlength: 10 },
  },
  { timestamps: false }
)

VoiceClipSchema.index({ userId: 1, createdAt: -1 })

export const VoiceClip = mongoose.model<IVoiceClip>('VoiceClip', VoiceClipSchema)
