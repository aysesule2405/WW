import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IScoreSubmission extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  gameId: Types.ObjectId
  score: number
  durationMs?: number
  metadata?: Record<string, unknown>
  createdAt: Date
}

const ScoreSubmissionSchema = new Schema<IScoreSubmission>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameId:     { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    score:      { type: Number, required: true },
    durationMs: { type: Number },
    metadata:   { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

ScoreSubmissionSchema.index({ gameId: 1, score: -1 })
ScoreSubmissionSchema.index({ userId: 1, gameId: 1 })

export const ScoreSubmission = mongoose.model<IScoreSubmission>('ScoreSubmission', ScoreSubmissionSchema)
