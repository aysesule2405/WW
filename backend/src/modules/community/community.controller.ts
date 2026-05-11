import { Response } from 'express'
import { Types } from 'mongoose'
import { AuthRequest } from '../../core/middleware/auth.middleware'
import { CommunityPost, CommunityTopic } from '../../models/CommunityPost'

const TOPICS = new Set<CommunityTopic>(['general', 'delivery', 'sapling', 'half-moon', 'spirit-drift'])

function isCommunityTopic(topic: unknown): topic is CommunityTopic {
  return typeof topic === 'string' && TOPICS.has(topic as CommunityTopic)
}

function normalizePost(post: any) {
  const author = post.author ?? {}
  return {
    id: post._id.toString(),
    topic: post.topic,
    title: post.title,
    body: post.body,
    author: {
      id: author._id?.toString?.() ?? String(post.author),
      username: author.username ?? 'Unknown player',
    },
    replies: (post.replies ?? []).map((reply: any) => {
      const replyAuthor = reply.author ?? {}
      return {
        id: reply._id.toString(),
        body: reply.body,
        createdAt: reply.createdAt,
        author: {
          id: replyAuthor._id?.toString?.() ?? String(reply.author),
          username: replyAuthor.username ?? 'Unknown player',
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
      .populate('author', 'username')
      .populate('replies.author', 'username')
      .lean()

    return res.status(200).json({ posts: posts.map(normalizePost) })
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
      .populate('author', 'username')
      .populate('replies.author', 'username')
      .lean()
    return res.status(201).json({ post: normalizePost(populated) })
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
      .populate('author', 'username')
      .populate('replies.author', 'username')
      .lean()
    return res.status(201).json({ post: normalizePost(populated) })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}

export default { listPosts, createPost, createReply }
