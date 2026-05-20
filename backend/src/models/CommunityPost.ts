import mongoose, { Document, Schema, Types } from 'mongoose'

export type CommunityTopic = 'general' | 'delivery' | 'sapling' | 'half-moon' | 'spirit-drift'

export interface ICommunityReply {
  _id: Types.ObjectId
  author: Types.ObjectId
  body: string
  createdAt: Date
}

export interface ICommunityPost extends Document {
  _id: Types.ObjectId
  author: Types.ObjectId
  topic: CommunityTopic
  title: string
  body: string
  replies: ICommunityReply[]
  votes: number
  voters: Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const CommunityReplySchema = new Schema<ICommunityReply>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    body:   { type: String, required: true, trim: true, minlength: 1, maxlength: 800 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

const CommunityPostSchema = new Schema<ICommunityPost>(
  {
    author:  { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic:   { type: String, required: true, enum: ['general', 'delivery', 'sapling', 'half-moon', 'spirit-drift'], index: true },
    title:   { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
    body:    { type: String, required: true, trim: true, minlength: 1, maxlength: 1200 },
    replies: { type: [CommunityReplySchema], default: [] },
    votes:   { type: Number, default: 0 },
    voters:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
)

CommunityPostSchema.index({ createdAt: -1 })

export const CommunityPost = mongoose.model<ICommunityPost>('CommunityPost', CommunityPostSchema)
