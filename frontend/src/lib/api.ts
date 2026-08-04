export const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1'

export function apiUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

export function mediaUrl(path: string | null | undefined): string {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (!/^https?:/.test(API_BASE)) return normalized
  return new URL(normalized, API_BASE).toString()
}

// AuthContext stores { token, username } under 'ww_auth'
export function getToken(): string | null {
  try {
    const raw = localStorage.getItem('ww_auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token ?? null
  } catch {
    return null
  }
}

export function getUsername(): string | null {
  try {
    const raw = localStorage.getItem('ww_auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.username ?? null
  } catch {
    return null
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function register(email: string, username: string, password: string) {
  const res = await fetch(apiUrl('/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  })
  return res.json()
}

export async function login(email: string, password: string) {
  const res = await fetch(apiUrl('/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

export async function saveProgress(payload: {
  gameSlug?: string
  levelReached?: number
  xp?: number
  completionPercent?: number
}) {
  const res = await fetch(apiUrl('/progress'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function getMyProgress() {
  const res = await fetch(apiUrl('/progress'), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  return res.json()
}

export async function getProfile() {
  const res = await fetch(apiUrl('/users/profile'), {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  return res.json()
}

export async function updateProfile(profile: {
  username: string
  status?: string
  favoriteSong?: string
  favoriteSteamGames?: string
  avatarConfig?: { face: string; color: string; accessory: string }
  richAvatarConfig?: string
}) {
  const res = await fetch(apiUrl('/users/profile'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(profile),
  })
  return res.json()
}

export async function uploadAvatar(avatarBase64: string) {
  const res = await fetch(apiUrl('/users/profile/avatar'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ avatarBase64 }),
  })
  return res.json()
}

// ── Session recording ─────────────────────────────────────────────────────────

function fireAchievementEvents(achievements: unknown[]) {
  if (!Array.isArray(achievements)) return
  achievements.forEach((a) =>
    window.dispatchEvent(new CustomEvent('ww-achievement', { detail: a }))
  )
}

export async function submitSession(
  gameSlug: string,
  data: {
    completed: boolean
    score?: number | null
    completionTimeSeconds?: number | null
    deliveriesCompleted?: number | null
    mapId?: string | null
    guardianId?: string | null
    growthStageReached?: string | null
    waterActions?: number | null
    sunActions?: number | null
    talkActions?: number | null
    harmonyBonus?: boolean | null
    totalCardPoints?: number | null
    moonScore?: number | null
    winner?: string | null
    won?: boolean | null
    saplingsGrown?: number | null
    fruitsCollected?: number | null
    shortestGrowthTimeSeconds?: number | null
    hastyAttempts?: number | null
    patienceBonus?: number | null
    needMatchCount?: number | null
    synergyBoostCount?: number | null
    eventsSurvived?: number | null
    corruptionScore?: number | null
    levelReached?: number | null
    finalPlayerScore?: number | null
    completionTime?: number | null
    shortestTime?: number | null
    // Spirit Drift run stats
    realmId?:        string | null
    raresCaught?:    number | null
    fleetingCaught?: number | null
    cursedCaught?:   number | null
    maxComboStreak?: number | null
    timingBonuses?:  number | null
    difficulty?: string | null
    aiMode?: string | null
  }
) {
  try {
    const res = await fetch(apiUrl(`/games/${gameSlug}/sessions`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    const json = await res.json()
    fireAchievementEvents(json?.achievements)
    return json
  } catch {
    return null
  }
}

export async function submitScore(
  gameSlug: string,
  data: {
    score: number
    durationMs?: number | null
    metadata?: Record<string, unknown>
  }
) {
  try {
    const res = await fetch(apiUrl(`/games/${gameSlug}/scores`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    const json = await res.json()
    fireAchievementEvents(json?.achievements)
    return json
  } catch {
    return null
  }
}

export async function getGameSessions(gameSlug: string, limit = 20) {
  try {
    const res = await fetch(apiUrl(`/games/${gameSlug}/sessions/me?limit=${limit}`), {
      headers: authHeaders(),
    })
    if (!res.ok) return { sessions: [] }
    return res.json()
  } catch {
    return { sessions: [] }
  }
}

export async function getProgressSummary() {
  try {
    const res = await fetch(apiUrl('/games/progress/summary'), {
      headers: authHeaders(),
    })
    if (!res.ok) return { games: [] }
    return res.json()
  } catch {
    return { games: [] }
  }
}

export async function getScoreLeaderboard(gameSlug: string, limit = 25) {
  try {
    const res = await fetch(apiUrl(`/games/${gameSlug}/leaderboard?limit=${limit}`))
    if (!res.ok) return { leaderboard: [] }
    return res.json()
  } catch {
    return { leaderboard: [] }
  }
}

export async function getDeliveryLeaderboard() {
  try {
    const res = await fetch(apiUrl('/games/delivery-on-the-wind/leaderboard/fastest'))
    if (!res.ok) return { leaderboard: [] }
    return res.json()
  } catch {
    return { leaderboard: [] }
  }
}

export async function getMyBest(gameSlug: string) {
  try {
    const res = await fetch(apiUrl(`/games/${gameSlug}/me`), { headers: authHeaders() })
    if (!res.ok) return { best: null }
    return res.json()
  } catch {
    return { best: null }
  }
}

export async function getRecentScores(gameSlug: string, limit = 5) {
  try {
    const res = await fetch(apiUrl(`/games/${gameSlug}/recent?limit=${limit}`), {
      headers: authHeaders(),
    })
    if (!res.ok) return { recent: [] }
    return res.json()
  } catch {
    return { recent: [] }
  }
}

export async function getAchievements() {
  try {
    const res = await fetch(apiUrl('/achievements/me'), {
      headers: authHeaders(),
    })
    if (!res.ok) return getAchievementCatalog()
    return res.json()
  } catch {
    return getAchievementCatalog()
  }
}

export async function getAchievementCatalog() {
  try {
    const res = await fetch(apiUrl('/achievements/catalog'))
    if (!res.ok) return { achievements: [] }
    return res.json()
  } catch {
    return { achievements: [] }
  }
}

export type CommunityTopic = 'general' | 'delivery' | 'sapling' | 'half-moon' | 'spirit-drift'

export type AvatarConfig = { face: string; color: string; accessory: string }

export type CommunityPost = {
  id: string
  topic: CommunityTopic
  title: string
  body: string
  votes: number
  voted?: boolean
  author: { id: string; username: string; avatarUrl?: string | null; avatarConfig?: AvatarConfig | null; richAvatarConfig?: string | null; avatarPreference?: 'photo' | 'rich' | null; status?: string | null }
  replies: Array<{
    id: string
    body: string
    createdAt: string
    author: { id: string; username: string; avatarUrl?: string | null; avatarConfig?: AvatarConfig | null; richAvatarConfig?: string | null; avatarPreference?: 'photo' | 'rich' | null }
  }>
  createdAt: string
  updatedAt: string
}

export async function getCommunityPosts(topic = 'all') {
  const res = await fetch(apiUrl(`/community/posts?topic=${encodeURIComponent(topic)}`), {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Could not load community posts')
  return res.json() as Promise<{ posts: CommunityPost[] }>
}

export async function createCommunityPost(data: { topic: CommunityTopic; title: string; body: string }) {
  const res = await fetch(apiUrl('/community/posts'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Could not create post')
  return res.json() as Promise<{ post: CommunityPost }>
}

export async function createCommunityReply(postId: string, body: string) {
  const res = await fetch(apiUrl(`/community/posts/${postId}/replies`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ body }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Could not add reply')
  return res.json() as Promise<{ post: CommunityPost }>
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const res = await fetch(apiUrl('/auth/change-password'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) throw new Error((await res.json()).error || 'Could not change password')
  return res.json() as Promise<{ updated: boolean }>
}

export async function voteOnPost(postId: string): Promise<{ votes: number; voted: boolean }> {
  const res = await fetch(apiUrl(`/community/posts/${postId}/vote`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  if (!res.ok) throw new Error('Could not vote')
  return res.json()
}

export default {
  getToken, getUsername, register, login,
  apiUrl, mediaUrl, saveProgress, getMyProgress, getProfile, updateProfile, uploadAvatar,
  submitScore, submitSession, getGameSessions, getProgressSummary,
  getScoreLeaderboard, getDeliveryLeaderboard, getMyBest, getRecentScores,
  getAchievements, getAchievementCatalog,
  getCommunityPosts, createCommunityPost, createCommunityReply, voteOnPost,
  changePassword,
}
