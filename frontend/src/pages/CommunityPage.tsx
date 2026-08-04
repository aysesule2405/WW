import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'
import { AvatarSvg, DEFAULT_RICH_AVATAR, type RichAvatarConfig } from '../components/AvatarCreator'
import {
  createCommunityPost,
  createCommunityReply,
  getCommunityPosts,
  voteOnPost,
  mediaUrl,
  type CommunityPost,
  type CommunityTopic,
} from '../lib/api'

// ── Regulations post (always pinned at top) ────────────────────────────────────

const REGULATIONS_SECTIONS = [
  {
    icon: '🌿',
    heading: 'Be Kind & Respectful',
    body: 'Treat every grove wanderer with warmth. Harassment, personal attacks, hate speech, or discriminatory language of any kind will not be tolerated. Disagreements happen — address the idea, not the person.',
  },
  {
    icon: '🍃',
    heading: 'Stay On Topic',
    body: 'Use the correct topic tag for your post. Game-specific tips, route advice, and session stories belong in their game\'s topic. General chat, introductions, and off-topic discussions go in General.',
  },
  {
    icon: '🌰',
    heading: 'Mark Spoilers',
    body: 'If your post reveals hidden seeds, secret routes, special cards, unlockable atmospheres, or any other discovery — include a spoiler warning in the title so others can choose to look.',
  },
  {
    icon: '📦',
    heading: 'No Spam or Self-Promotion',
    body: 'Avoid posting the same content repeatedly. Do not advertise external services, referral links, or other platforms. One post per topic per day is plenty.',
  },
  {
    icon: '🌊',
    heading: 'Share Scores with Grace',
    body: 'High scores, leaderboard positions, and achievement unlocks are welcome — frame them to celebrate the journey, not to diminish other players\' efforts.',
  },
  {
    icon: '🌙',
    heading: 'Moderation',
    body: 'Posts that violate these guidelines will be removed without notice. Repeated or severe violations may result in a suspension of posting privileges. If you see something harmful, use the report feature or reach out to the grove team.',
  },
]

function RegulationsCard() {
  const [open, setOpen] = React.useState(false)

  return (
    <article style={s.pinCard}>
      {/* Pin badge */}
      <div style={s.pinBadge}>📌 Pinned</div>

      <div style={s.pinRow}>
        {/* Staff avatar */}
        <div style={s.staffAvatar}>🏕️</div>

        {/* Content */}
        <div style={s.pinContent}>
          <div style={s.pinMeta}>
            <span style={s.staffBadge}>Grove Staff</span>
            <span style={s.pinMetaDot}>·</span>
            <span style={s.pinTopic}>💬 General</span>
            <span style={s.pinMetaDot}>·</span>
            <span style={s.pinDate}>May 20, 2026</span>
          </div>

          <h3 style={s.pinTitle}>🌿 Whisperwind Grove — Community Guidelines</h3>

          <p style={s.pinIntro}>
            Welcome to the grove. To keep this space peaceful and welcoming for all wandering spirits,
            please read and follow these community guidelines.
          </p>

          {open && (
            <div style={s.rulesSections}>
              {REGULATIONS_SECTIONS.map((sec) => (
                <div key={sec.heading} style={s.rulesSection}>
                  <p style={s.rulesSectionHeading}>
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{sec.icon}</span>
                    {sec.heading}
                  </p>
                  <p style={s.rulesSectionBody}>{sec.body}</p>
                </div>
              ))}

              <p style={s.rulesSignoff}>
                Thank you for being part of Whisperwind Grove. 🍃<br />
                <em>— The Whisperwind Grove Team</em>
              </p>
            </div>
          )}

          <button style={s.pinToggle} onClick={() => setOpen((v) => !v)}>
            {open ? '▲ Collapse guidelines' : '▼ Read full guidelines'}
          </button>
        </div>
      </div>
    </article>
  )
}

const TOPICS: Array<{ id: CommunityTopic | 'all'; label: string; icon: string }> = [
  { id: 'all',          label: 'All',            icon: '🌐' },
  { id: 'general',      label: 'General',        icon: '💬' },
  { id: 'delivery',     label: 'Delivery',       icon: '📦' },
  { id: 'sapling',      label: 'Spirit Sapling', icon: '🌱' },
  { id: 'half-moon',    label: 'Half Moon',      icon: '🌙' },
  { id: 'spirit-drift', label: 'Spirit Drift',   icon: '🌊' },
]

const POST_TOPICS = TOPICS.filter(
  (t): t is { id: CommunityTopic; label: string; icon: string } => t.id !== 'all',
)

function timeAgo(dateStr: string): string {
  const sec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (sec < 60) return 'just now'
  const m = Math.floor(sec / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function initials(name: string) { return name.slice(0, 2).toUpperCase() }

const AVATAR_PALETTE = ['#4a7c59', '#6b5c3e', '#5c6b9e', '#7a3c5c', '#3c6b7a', '#7a6b3c', '#3c5c7a']
function avatarColor(name: string) { return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length] }

function parseRichAvatar(raw: string | null | undefined): RichAvatarConfig | null {
  if (!raw) return null
  try {
    const parsed = { ...DEFAULT_RICH_AVATAR, ...JSON.parse(raw) }
    return JSON.stringify(parsed) !== JSON.stringify(DEFAULT_RICH_AVATAR) ? parsed : null
  } catch { return null }
}

function AvatarCircle({
  username, avatarUrl, avatarConfig, richAvatarConfig, avatarPreference, size = 32,
}: {
  username: string
  avatarUrl?: string | null
  avatarConfig?: { face: string; color: string; accessory: string } | null
  richAvatarConfig?: string | null
  avatarPreference?: 'photo' | 'rich' | null
  size?: number
}) {
  const richAvatar = parseRichAvatar(richAvatarConfig)
  const showRich = avatarPreference === 'rich' ? !!richAvatar : richAvatar && !avatarUrl

  if (showRich && richAvatar) {
    return (
      <div style={{ width: size, height: size, minWidth: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, lineHeight: 0 }}>
        <AvatarSvg config={richAvatar} size={size} />
      </div>
    )
  }
  if (avatarUrl) {
    return (
      <img
        src={mediaUrl(avatarUrl)}
        alt=""
        style={{ width: size, height: size, minWidth: size, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }}
      />
    )
  }
  if (avatarConfig) {
    return (
      <div style={{ width: size, height: size, minWidth: size, borderRadius: '50%', background: `radial-gradient(circle at 35% 25%, #fff5, transparent 34%), ${avatarConfig.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.44, flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
        {avatarConfig.face}
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: '50%', background: avatarColor(username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.375, fontWeight: 800, color: '#fff', flexShrink: 0, letterSpacing: '0.03em' }}>
      {initials(username)}
    </div>
  )
}

function topicMeta(topic: CommunityTopic) {
  return POST_TOPICS.find((t) => t.id === topic) ?? POST_TOPICS[0]
}

export default function CommunityPage() {
  const [activeTopic, setActiveTopic] = useState<CommunityTopic | 'all'>('all')
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showComposer, setShowComposer] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'new' | 'top'>('new')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [postTopic, setPostTopic] = useState<CommunityTopic>('general')
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [submittingReply, setSubmittingReply] = useState<string | null>(null)

  const loadPosts = useCallback(() => {
    setLoading(true)
    setError('')
    getCommunityPosts(activeTopic)
      .then((res) => setPosts(res.posts ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load community posts'))
      .finally(() => setLoading(false))
  }, [activeTopic])

  useEffect(() => { loadPosts() }, [loadPosts])

  const stats = useMemo(() => {
    const replyCount = posts.reduce((total, p) => total + p.replies.length, 0)
    const playerNames = new Set<string>()
    posts.forEach((p) => {
      playerNames.add(p.author.username)
      p.replies.forEach((r) => playerNames.add(r.author.username))
    })
    return { posts: posts.length, replies: replyCount, players: playerNames.size }
  }, [posts])

  const sortedPosts = useMemo(() => {
    if (sortBy === 'top') return [...posts].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    return posts
  }, [posts, sortBy])

  const handleVote = async (postId: string) => {
    setPosts((cur) =>
      cur.map((p) =>
        p.id !== postId
          ? p
          : { ...p, votes: (p.votes ?? 0) + (p.voted ? -1 : 1), voted: !p.voted },
      ),
    )
    try {
      const r = await voteOnPost(postId)
      setPosts((cur) => cur.map((p) => (p.id === postId ? { ...p, votes: r.votes, voted: r.voted } : p)))
    } catch {
      setPosts((cur) =>
        cur.map((p) =>
          p.id !== postId
            ? p
            : { ...p, votes: (p.votes ?? 0) + (p.voted ? -1 : 1), voted: !p.voted },
        ),
      )
    }
  }

  const submitPost = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await createCommunityPost({ topic: postTopic, title, body })
      setPosts((cur) => [res.post, ...cur])
      setTitle('')
      setBody('')
      setShowComposer(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create post')
    } finally {
      setSaving(false)
    }
  }

  const submitReply = async (postId: string) => {
    const reply = replyDrafts[postId]?.trim()
    if (!reply) return
    setSubmittingReply(postId)
    setError('')
    try {
      const res = await createCommunityReply(postId, reply)
      setPosts((cur) => cur.map((p) => (p.id === postId ? res.post : p)))
      setReplyDrafts((cur) => ({ ...cur, [postId]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add reply')
    } finally {
      setSubmittingReply(null)
    }
  }

  return (
    <div className="ww-responsive-page ww-community-page" style={s.page}>
      {/* ── Top bar ── */}
      <div className="ww-responsive-page-header" style={s.topBar}>
        <div>
          <h2 style={s.pageTitle}>Community Grove</h2>
          <p style={s.pageSub}>Share routes, ask for help, and cheer on other players.</p>
        </div>
        <button
          style={s.newPostBtn}
          onClick={() => setShowComposer((v) => !v)}
        >
          {showComposer ? '✕ Cancel' : '✦ New Post'}
        </button>
      </div>

      {/* ── Composer ── */}
      {showComposer && (
        <form style={s.composer} onSubmit={submitPost}>
          <div className="ww-community-composer-top" style={s.composerTop}>
            <select
              value={postTopic}
              onChange={(e) => setPostTopic(e.target.value as CommunityTopic)}
              style={s.select}
            >
              {POST_TOPICS.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
              ))}
            </select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Start a discussion"
              style={s.titleInput}
              maxLength={120}
              required
            />
          </div>
          <div style={{ position: 'relative' }}>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ask for route advice, share a game moment, or leave a tip for other grove players."
              style={s.textarea}
              maxLength={1200}
              required
            />
            <span style={s.charCount}>{body.length}/1200</span>
          </div>
          <div style={s.composerActions}>
            {error && <p style={s.error}>{error}</p>}
            <button type="submit" style={s.postBtn} disabled={saving}>
              {saving ? 'Posting...' : '🍃 Post to Grove'}
            </button>
          </div>
        </form>
      )}

      {/* ── Two-column layout ── */}
      <div className="ww-community-layout" style={s.layout}>
        {/* ── Sidebar ── */}
        <aside className="ww-community-sidebar" style={s.sidebar}>
          <div style={s.sideSection}>
            <p style={s.sideHeading}>Topics</p>
            {TOPICS.map((t) => {
              const active = activeTopic === t.id
              return (
                <button
                  key={t.id}
                  style={{ ...s.topicBtn, ...(active ? s.topicBtnActive : {}) }}
                  onClick={() => setActiveTopic(t.id)}
                >
                  {active && <span style={s.activeDot} />}
                  <span style={s.topicIcon}>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          <div style={s.sideSection}>
            <p style={s.sideHeading}>Grove Stats</p>
            <div style={s.statRow}>
              <span style={s.statLabel}>Posts</span>
              <strong style={s.statValue}>{stats.posts}</strong>
            </div>
            <div style={s.statRow}>
              <span style={s.statLabel}>Replies</span>
              <strong style={s.statValue}>{stats.replies}</strong>
            </div>
            <div style={s.statRow}>
              <span style={s.statLabel}>Players</span>
              <strong style={s.statValue}>{stats.players}</strong>
            </div>
          </div>
        </aside>

        {/* ── Feed ── */}
        <div style={s.feed}>
          {/* Sort bar */}
          <div style={s.sortBar}>
            <button
              style={{ ...s.sortBtn, ...(sortBy === 'new' ? s.sortBtnActive : {}) }}
              onClick={() => setSortBy('new')}
            >
              🌿 New
            </button>
            <button
              style={{ ...s.sortBtn, ...(sortBy === 'top' ? s.sortBtnActive : {}) }}
              onClick={() => setSortBy('top')}
            >
              🏆 Top
            </button>
          </div>

          {/* Pinned regulations post — always first */}
          <RegulationsCard />

          {loading ? (
            <p style={s.empty}>Loading community posts...</p>
          ) : sortedPosts.length === 0 ? (
            <p style={s.empty}>No posts here yet. Start the first conversation!</p>
          ) : (
            sortedPosts.map((post) => {
              const meta = topicMeta(post.topic)
              const isExpanded = expandedId === post.id
              const replyCount = post.replies.length

              return (
                <article key={post.id} style={s.postCard}>
                  <div style={s.postRow}>
                    {/* Vote column */}
                    <div style={s.voteCol}>
                      <button
                        style={{
                          ...s.voteBtn,
                          opacity: post.voted ? 1 : 0.45,
                          transform: post.voted ? 'scale(1.15)' : 'scale(1)',
                          color: post.voted ? 'var(--accent)' : 'var(--text-muted)',
                          filter: post.voted ? 'drop-shadow(0 0 4px var(--accent))' : 'none',
                        }}
                        onClick={() => handleVote(post.id)}
                        title={post.voted ? 'Remove vote' : 'Upvote'}
                      >
                        🍃
                      </button>
                      <span style={s.voteCount}>{post.votes ?? 0}</span>
                    </div>

                    {/* Content column */}
                    <div style={s.contentCol}>
                      <div style={s.postMeta}>
                        <span style={s.topicPill}>{meta.icon} {meta.label}</span>
                        <span style={s.metaDot}>·</span>
                        <AvatarCircle
                          username={post.author.username}
                          avatarUrl={post.author.avatarUrl}
                          avatarConfig={post.author.avatarConfig}
                          richAvatarConfig={post.author.richAvatarConfig}
                          avatarPreference={post.author.avatarPreference}
                          size={20}
                        />
                        <span style={s.metaText}>{post.author.username}</span>
                        {post.author.status && (
                          <>
                            <span style={s.metaDot}>·</span>
                            <span style={{ ...s.metaText, fontStyle: 'italic' }}>{post.author.status}</span>
                          </>
                        )}
                        <span style={s.metaDot}>·</span>
                        <span style={s.metaText}>{timeAgo(post.createdAt)}</span>
                      </div>

                      <h3 style={s.postTitle}>{post.title}</h3>

                      <p
                        style={
                          isExpanded
                            ? { ...s.postBody }
                            : {
                                ...s.postBody,
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                              }
                        }
                      >
                        {post.body}
                      </p>

                      <button
                        style={s.replyToggle}
                        onClick={() => setExpandedId(isExpanded ? null : post.id)}
                      >
                        💬 {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                        {isExpanded ? ' · collapse' : ' · view'}
                      </button>

                      {/* Expanded thread */}
                      {isExpanded && (
                        <div style={s.thread}>
                          {post.replies.length > 0 && (
                            <div style={s.replyList}>
                              {post.replies.map((reply) => (
                                <div key={reply.id} style={s.replyItem}>
                                  <AvatarCircle
                                    username={reply.author.username}
                                    avatarUrl={reply.author.avatarUrl}
                                    avatarConfig={reply.author.avatarConfig}
                                    richAvatarConfig={reply.author.richAvatarConfig}
                                    avatarPreference={reply.author.avatarPreference}
                                    size={32}
                                  />
                                  <div style={s.replyContent}>
                                    <div style={s.replyHeader}>
                                      <strong style={s.replyAuthor}>{reply.author.username}</strong>
                                      <span style={s.replyTime}>{timeAgo(reply.createdAt)}</span>
                                    </div>
                                    <p style={s.replyBody}>{reply.body}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={s.replyForm}>
                            <textarea
                              value={replyDrafts[post.id] ?? ''}
                              onChange={(e) =>
                                setReplyDrafts((cur) => ({ ...cur, [post.id]: e.target.value }))
                              }
                              placeholder="Add a reply..."
                              style={s.replyTextarea}
                              maxLength={800}
                              rows={3}
                            />
                            <button
                              type="button"
                              style={s.replyBtn}
                              disabled={submittingReply === post.id}
                              onClick={() => submitReply(post.id)}
                            >
                              {submittingReply === post.id ? 'Sending...' : '↩ Reply'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: '28px 32px',
    maxWidth: 1080,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    fontFamily: bodyFontFamily,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  pageTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 34,
    color: 'var(--text-h)',
  },
  pageSub: {
    margin: '3px 0 0',
    fontSize: 14,
    color: 'var(--text-muted)',
  },
  newPostBtn: {
    padding: '10px 20px',
    borderRadius: 999,
    border: '1.5px solid var(--accent)',
    background: 'transparent',
    color: 'var(--accent-dark)',
    fontFamily: bodyFontFamily,
    fontWeight: 800,
    fontSize: 14,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  },

  // Composer
  composer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 18,
    borderRadius: 18,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-md)',
  },
  composerTop: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    gap: 10,
  },
  select: {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-input)',
    color: 'var(--text-body)',
    fontFamily: bodyFontFamily,
  },
  titleInput: {
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-input)',
    color: 'var(--text-body)',
    fontFamily: bodyFontFamily,
  },
  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: 96,
    resize: 'vertical',
    padding: 12,
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-input)',
    color: 'var(--text-body)',
    fontFamily: bodyFontFamily,
    lineHeight: 1.45,
  },
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 11,
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  composerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  postBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
    color: 'var(--text-on-dark)',
    fontFamily: bodyFontFamily,
    fontWeight: 800,
    cursor: 'pointer',
  },
  error: {
    margin: 0,
    color: '#C04040',
    fontSize: 13,
  },

  // Two-column layout
  layout: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    gap: 20,
    alignItems: 'flex-start',
  },

  // Sidebar
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    position: 'sticky',
    top: 20,
  },
  sideSection: {
    padding: '14px 12px',
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sideHeading: {
    margin: '0 0 6px',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--text-muted)',
  },
  topicBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    borderRadius: 10,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-body)',
    fontFamily: bodyFontFamily,
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
    position: 'relative',
  },
  topicBtnActive: {
    background: 'var(--bg-accent-soft)',
    color: 'var(--accent-dark)',
    fontWeight: 800,
  },
  activeDot: {
    position: 'absolute',
    left: 2,
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: 'var(--accent)',
  },
  topicIcon: {
    fontSize: 15,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 2px',
    borderBottom: '1px solid var(--border)',
  },
  statLabel: {
    fontSize: 13,
    color: 'var(--text-muted)',
  },
  statValue: {
    fontSize: 14,
    color: 'var(--text-h)',
  },

  // Feed
  feed: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sortBar: {
    display: 'flex',
    gap: 6,
    padding: '10px 14px',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-sm)',
  },
  sortBtn: {
    padding: '7px 14px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontFamily: bodyFontFamily,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  sortBtnActive: {
    background: 'var(--bg-accent-soft)',
    color: 'var(--accent-dark)',
  },
  empty: {
    margin: 0,
    color: 'var(--text-muted)',
    padding: 20,
    borderRadius: 14,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
  },

  // ── Pinned regulations card ───────────────────────────────────────────────
  pinCard: {
    position: 'relative',
    borderRadius: 16,
    border: '2px solid var(--accent)',
    background: 'var(--bg-accent-soft)',
    boxShadow: '0 0 0 3px rgba(0,0,0,0.04), var(--shadow-sm)',
    overflow: 'hidden',
    padding: '16px 18px 14px',
  },
  pinBadge: {
    position: 'absolute',
    top: 10,
    right: 14,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.06em',
    color: 'var(--accent-dark)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-focus)',
    borderRadius: 999,
    padding: '3px 10px',
  },
  pinRow: {
    display: 'flex',
    gap: 14,
    alignItems: 'flex-start',
  },
  staffAvatar: {
    width: 40,
    height: 40,
    minWidth: 40,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  pinContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  pinMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  staffBadge: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: 'var(--accent-dark)',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-focus)',
    borderRadius: 4,
    padding: '2px 8px',
  },
  pinMetaDot: { color: 'var(--text-muted)', fontSize: 12 },
  pinTopic: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--accent-dark)',
    background: 'var(--bg-accent-soft)',
    border: '1px solid var(--border-focus)',
    borderRadius: 999,
    padding: '2px 9px',
  },
  pinDate: { fontSize: 12, color: 'var(--text-muted)' },
  pinTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 19,
    color: 'var(--text-h)',
    lineHeight: 1.3,
    paddingRight: 90,
  },
  pinIntro: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text-body)',
    lineHeight: 1.55,
  },
  rulesSections: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 4,
    padding: '14px 0 4px',
    borderTop: '1px solid var(--border-focus)',
  },
  rulesSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    paddingLeft: 4,
    borderLeft: '3px solid var(--accent)',
    paddingRight: 0,
    marginLeft: 2,
  },
  rulesSectionHeading: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    fontSize: 14,
    fontWeight: 800,
    fontFamily: headingFontFamily,
    color: 'var(--text-h)',
  },
  rulesSectionBody: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text-body)',
    lineHeight: 1.55,
    paddingLeft: 23,
  },
  rulesSignoff: {
    margin: '8px 0 0',
    fontSize: 13,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
    paddingTop: 10,
    borderTop: '1px solid var(--border-muted)',
  },
  pinToggle: {
    alignSelf: 'flex-start',
    marginTop: 2,
    padding: '5px 12px',
    borderRadius: 8,
    border: '1px solid var(--border-focus)',
    background: 'var(--bg-surface)',
    color: 'var(--accent-dark)',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 150ms',
  },

  // Post card
  postCard: {
    borderRadius: 16,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  },
  postRow: {
    display: 'flex',
    alignItems: 'stretch',
  },

  // Vote column
  voteCol: {
    width: 52,
    minWidth: 52,
    background: 'var(--bg-input)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
    gap: 4,
    borderRight: '1px solid var(--border)',
  },
  voteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 20,
    lineHeight: 1,
    padding: '4px 0',
    transition: 'opacity 0.15s, transform 0.15s, filter 0.15s',
  },
  voteCount: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--text-muted)',
    lineHeight: 1,
  },

  // Content column
  contentCol: {
    flex: 1,
    minWidth: 0,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  postMeta: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  topicPill: {
    padding: '3px 9px',
    borderRadius: 999,
    background: 'var(--bg-accent-soft)',
    color: 'var(--accent-dark)',
    fontSize: 11,
    fontWeight: 800,
  },
  metaDot: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  metaText: {
    color: 'var(--text-muted)',
    fontSize: 12,
  },
  postTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    color: 'var(--text-h)',
    fontSize: 18,
    lineHeight: 1.3,
  },
  postBody: {
    margin: 0,
    color: 'var(--text-body)',
    fontSize: 14,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
  },
  replyToggle: {
    alignSelf: 'flex-start',
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },

  // Thread / replies
  thread: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTop: '1px solid var(--border)',
  },
  replyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  replyItem: {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '0.03em',
  },
  replyContent: {
    flex: 1,
    minWidth: 0,
  },
  replyHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 3,
  },
  replyAuthor: {
    fontSize: 13,
    color: 'var(--text-h)',
  },
  replyTime: {
    fontSize: 11,
    color: 'var(--text-muted)',
  },
  replyBody: {
    margin: 0,
    fontSize: 13,
    color: 'var(--text-body)',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },

  // Reply form
  replyForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  replyTextarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-input)',
    color: 'var(--text-body)',
    fontFamily: bodyFontFamily,
    fontSize: 13,
    lineHeight: 1.4,
    resize: 'vertical',
  },
  replyBtn: {
    alignSelf: 'flex-end',
    padding: '8px 16px',
    borderRadius: 10,
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-accent-soft)',
    color: 'var(--accent-dark)',
    fontFamily: bodyFontFamily,
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
  },
}
