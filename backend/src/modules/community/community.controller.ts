import { Response } from 'express'
import { Types } from 'mongoose'
import { AuthRequest } from '../../core/middleware/auth.middleware'
import { CommunityPost, CommunityTopic } from '../../models/CommunityPost'
import { serializeUserAvatar, USER_AVATAR_SELECT, USER_COMMUNITY_PROFILE_SELECT } from '../users/userProfile'

const TOPICS = new Set<CommunityTopic>(['general', 'delivery', 'sapling', 'half-moon', 'spirit-drift'])

function isCommunityTopic(topic: unknown): topic is CommunityTopic {
  return typeof topic === 'string' && TOPICS.has(topic as CommunityTopic)
}

function normalizePost(post: any, currentUserId?: string) {
  const author = post.author ?? {}
  return {
    id: post._id.toString(),
    topic: post.topic,
    title: post.title,
    body: post.body,
    votes: post.votes ?? 0,
    voted: currentUserId
      ? (post.voters ?? []).some((v: any) => v.toString() === currentUserId)
      : false,
    author: {
      id:               author._id?.toString?.() ?? String(post.author),
      ...serializeUserAvatar(author),
      status:           author.status ?? null,
    },
    replies: (post.replies ?? []).map((reply: any) => {
      const replyAuthor = reply.author ?? {}
      return {
        id: reply._id.toString(),
        body: reply.body,
        createdAt: reply.createdAt,
        author: {
          id:               replyAuthor._id?.toString?.() ?? String(reply.author),
          ...serializeUserAvatar(replyAuthor),
        },
      }
    }),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

export const listPosts = async (req: AuthRequest, res: Response) => {
  try {
    const topic = String(req.query.topic ?? 'all')
    const filter: { topic?: CommunityTopic } = isCommunityTopic(topic) ? { topic } : {}
    const posts = await CommunityPost.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', USER_COMMUNITY_PROFILE_SELECT)
      .populate('replies.author', USER_AVATAR_SELECT)
      .lean()

    return res.status(200).json({ posts: posts.map((p) => normalizePost(p, req.userId)) })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { topic, title, body } = req.body ?? {}
    if (!isCommunityTopic(topic)) return res.status(400).json({ error: 'Choose a valid topic' })
    if (!String(title ?? '').trim()) return res.status(400).json({ error: 'Title is required' })
    if (!String(body ?? '').trim()) return res.status(400).json({ error: 'Message is required' })

    const post = await CommunityPost.create({
      author: new Types.ObjectId(userId),
      topic,
      title: String(title).trim(),
      body: String(body).trim(),
    })
    const populated = await CommunityPost.findById(post._id)
      .populate('author', USER_COMMUNITY_PROFILE_SELECT)
      .populate('replies.author', USER_AVATAR_SELECT)
      .lean()
    return res.status(201).json({ post: normalizePost(populated, req.userId) })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export const createReply = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { body } = req.body ?? {}
    if (!String(body ?? '').trim()) return res.status(400).json({ error: 'Reply is required' })

    const post = await CommunityPost.findById(req.params.postId)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    post.replies.push({
      _id: new Types.ObjectId(),
      author: new Types.ObjectId(userId),
      body: String(body).trim(),
      createdAt: new Date(),
    })
    await post.save()

    const populated = await CommunityPost.findById(post._id)
      .populate('author', USER_COMMUNITY_PROFILE_SELECT)
      .populate('replies.author', USER_AVATAR_SELECT)
      .lean()
    return res.status(201).json({ post: normalizePost(populated) })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export const votePost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const post = await CommunityPost.findById(req.params.postId)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const userObjectId = new Types.ObjectId(userId)
    const alreadyVoted = post.voters.some((v) => v.equals(userObjectId))

    if (alreadyVoted) {
      post.voters = post.voters.filter((v) => !v.equals(userObjectId))
      post.votes = Math.max(0, (post.votes ?? 0) - 1)
    } else {
      post.voters.push(userObjectId)
      post.votes = (post.votes ?? 0) + 1
    }

    await post.save()
    return res.status(200).json({ votes: post.votes, voted: !alreadyVoted })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export default { listPosts, createPost, createReply, votePost }
