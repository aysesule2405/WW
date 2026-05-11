import React, { useEffect, useMemo, useState } from 'react'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'
import {
  createCommunityPost,
  createCommunityReply,
  getCommunityPosts,
  type CommunityPost,
  type CommunityTopic,
} from '../lib/api'

const TOPICS: Array<{ id: CommunityTopic | 'all'; label: string; icon: string }> = [
  { id: 'all',          label: 'All',             icon: '🌐' },
  { id: 'general',      label: 'General',         icon: '💬' },
  { id: 'delivery',     label: 'Delivery',        icon: '📦' },
  { id: 'sapling',      label: 'Spirit Sapling',  icon: '🌱' },
  { id: 'half-moon',    label: 'Half Moon',       icon: '🌙' },
  { id: 'spirit-drift', label: 'Spirit Drift',    icon: '🌊' },
]

const POST_TOPICS = TOPICS.filter((topic): topic is { id: CommunityTopic; label: string; icon: string } => topic.id !== 'all')

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function topicMeta(topic: CommunityTopic) {
  return POST_TOPICS.find((item) => item.id === topic) ?? POST_TOPICS[0]
}

export default function CommunityPage() {
  const [activeTopic, setActiveTopic] = useState<CommunityTopic | 'all'>('all')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [topic, setTopic] = useState<CommunityTopic>('general')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  const loadPosts = () => {
    setLoading(true)
    setError('')
    getCommunityPosts(activeTopic)
      .then((res) => setPosts(res.posts ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load community posts'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPosts()
  }, [activeTopic])

  const stats = useMemo(() => {
    const replyCount = posts.reduce((total, post) => total + post.replies.length, 0)
    const playerNames = new Set<string>()
    posts.forEach((post) => {
      playerNames.add(post.author.username)
      post.replies.forEach((reply) => playerNames.add(reply.author.username))
    })
    return { posts: posts.length, replies: replyCount, players: playerNames.size }
  }, [posts])

  const submitPost = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await createCommunityPost({ topic, title, body })
      setPosts((current) => [res.post, ...current])
      setTitle('')
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create post')
    } finally {
      setSaving(false)
    }
  }

  const submitReply = async (postId: string) => {
    const reply = replyDrafts[postId]?.trim()
    if (!reply) return
    setError('')
    try {
      const res = await createCommunityReply(postId, reply)
      setPosts((current) => current.map((post) => (post.id === postId ? res.post : post)))
      setReplyDrafts((current) => ({ ...current, [postId]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add reply')
    }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.pageTitle}>Community Grove</h2>
          <p style={s.pageSub}>Share routes, ask for help, and cheer on other players.</p>
        </div>
        <div style={s.stats}>
          <div style={s.stat}><strong>{stats.posts}</strong><span>Posts</span></div>
          <div style={s.stat}><strong>{stats.replies}</strong><span>Replies</span></div>
          <div style={s.stat}><strong>{stats.players}</strong><span>Players</span></div>
        </div>
      </div>

      <div style={s.topicBar}>
        {TOPICS.map((item) => (
          <button
            key={item.id}
            style={{
              ...s.topicBtn,
              ...(activeTopic === item.id ? s.topicBtnActive : {}),
            }}
            onClick={() => setActiveTopic(item.id)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <form style={s.composer} onSubmit={submitPost}>
        <div style={s.composerTop}>
          <select value={topic} onChange={(event) => setTopic(event.target.value as CommunityTopic)} style={s.select}>
            {POST_TOPICS.map((item) => (
              <option key={item.id} value={item.id}>{item.icon} {item.label}</option>
            ))}
          </select>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Start a discussion"
            style={s.titleInput}
            maxLength={120}
            required
          />
        </div>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Ask for route advice, share a game moment, or leave a tip for other grove players."
          style={s.textarea}
          maxLength={1200}
          required
        />
        <div style={s.composerActions}>
          {error && <p style={s.error}>{error}</p>}
          <button type="submit" style={s.postBtn} disabled={saving}>
            {saving ? 'Posting...' : 'Post to Community'}
          </button>
        </div>
      </form>

      {loading ? (
        <p style={s.empty}>Loading community posts...</p>
      ) : posts.length === 0 ? (
        <p style={s.empty}>No posts here yet. Start the first conversation.</p>
      ) : (
        <div style={s.feed}>
          {posts.map((post) => {
            const meta = topicMeta(post.topic)
            return (
              <article key={post.id} style={s.postCard}>
                <div style={s.postHead}>
                  <span style={s.topicPill}>{meta.icon} {meta.label}</span>
                  <span style={s.postTime}>{formatDate(post.createdAt)}</span>
                </div>
                <h3 style={s.postTitle}>{post.title}</h3>
                <p style={s.postBody}>{post.body}</p>
                <p style={s.author}>Posted by {post.author.username}</p>

                <div style={s.replies}>
                  {post.replies.map((reply) => (
                    <div key={reply.id} style={s.reply}>
                      <p style={s.replyBody}>{reply.body}</p>
                      <p style={s.replyMeta}>{reply.author.username} · {formatDate(reply.createdAt)}</p>
                    </div>
                  ))}
                </div>

                <div style={s.replyForm}>
                  <input
                    value={replyDrafts[post.id] ?? ''}
                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                    placeholder="Reply to this post"
                    style={s.replyInput}
                    maxLength={800}
                  />
                  <button type="button" style={s.replyBtn} onClick={() => submitReply(post.id)}>
                    Reply
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: '28px 32px',
    maxWidth: 980,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    fontFamily: bodyFontFamily,
  },
  header: { display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 34, color: 'var(--text-h)' },
  pageSub: { margin: '2px 0 0', fontSize: 14, color: 'var(--text-muted)' },
  stats: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  stat: {
    minWidth: 82,
    borderRadius: 14,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    padding: '10px 12px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  topicBar: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  topicBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 13px',
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
    fontFamily: bodyFontFamily,
    cursor: 'pointer',
  },
  topicBtnActive: {
    background: 'var(--bg-accent-soft)',
    color: 'var(--accent-dark)',
    borderColor: 'var(--accent)',
    fontWeight: 800,
  },
  composer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 16,
    borderRadius: 18,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-md)',
  },
  composerTop: { display: 'grid', gridTemplateColumns: '180px 1fr', gap: 10 },
  select: { padding: '11px 12px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-input)', color: 'var(--text-body)' },
  titleInput: { padding: '11px 12px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-input)', color: 'var(--text-body)', fontFamily: bodyFontFamily },
  textarea: { minHeight: 92, resize: 'vertical', padding: 12, borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-input)', color: 'var(--text-body)', fontFamily: bodyFontFamily, lineHeight: 1.45 },
  composerActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  postBtn: { padding: '11px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-on-dark)', fontFamily: bodyFontFamily, fontWeight: 800, cursor: 'pointer' },
  error: { margin: 0, color: '#C04040', fontSize: 13 },
  empty: { margin: 0, color: 'var(--text-muted)', padding: 16, borderRadius: 14, background: 'var(--bg-surface)', border: '1px solid var(--border)' },
  feed: { display: 'flex', flexDirection: 'column', gap: 12 },
  postCard: { padding: 16, borderRadius: 18, border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' },
  postHead: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  topicPill: { padding: '5px 9px', borderRadius: 999, background: 'var(--bg-accent-soft)', color: 'var(--accent-dark)', fontSize: 12, fontWeight: 800 },
  postTime: { color: 'var(--text-muted)', fontSize: 12 },
  postTitle: { margin: '12px 0 5px', fontFamily: headingFontFamily, color: 'var(--text-h)', fontSize: 24 },
  postBody: { margin: 0, color: 'var(--text-body)', lineHeight: 1.5, whiteSpace: 'pre-wrap' },
  author: { margin: '10px 0 0', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 },
  replies: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 },
  reply: { padding: '10px 12px', borderRadius: 12, background: 'var(--bg-input)', border: '1px solid var(--border)' },
  replyBody: { margin: 0, color: 'var(--text-body)', fontSize: 14, lineHeight: 1.4 },
  replyMeta: { margin: '5px 0 0', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 },
  replyForm: { display: 'flex', gap: 8, marginTop: 12 },
  replyInput: { flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-input)', color: 'var(--text-body)', fontFamily: bodyFontFamily },
  replyBtn: { padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-strong)', background: 'var(--bg-accent-soft)', color: 'var(--accent-dark)', fontFamily: bodyFontFamily, fontWeight: 800, cursor: 'pointer' },
}
