import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IAnalyticsEvent extends Document {
  _id: Types.ObjectId
  userId?: Types.ObjectId
  sessionId?: string
  eventType: string
  gameId?: Types.ObjectId
  payload: Record<string, unknown>
  occurredAt: Date
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: 'User' },
    sessionId: { type: String },
    eventType: { type: String, required: true, trim: true, maxlength: 100 },
    gameId:    { type: Schema.Types.ObjectId, ref: 'Game' },
    payload:   { type: Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

AnalyticsEventSchema.index({ eventType: 1, occurredAt: -1 })
AnalyticsEventSchema.index({ userId: 1, occurredAt: -1 })

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema)
