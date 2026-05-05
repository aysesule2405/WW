const API_BASE = import.meta.env.VITE_API_BASE || '/api/v1'

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
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  })
  return res.json()
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
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
  const res = await fetch(`${API_BASE}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export async function getMyProgress() {
  const res = await fetch(`${API_BASE}/progress`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  return res.json()
}

export async function getProfile() {
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  return res.json()
}

export async function updateProfile(username: string) {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ username }),
  })
  return res.json()
}

export async function uploadAvatar(avatarBase64: string) {
  const res = await fetch(`${API_BASE}/users/profile/avatar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ avatarBase64 }),
  })
  return res.json()
}

export default { getToken, getUsername, register, login, saveProgress, getMyProgress, getProfile, updateProfile, uploadAvatar }
