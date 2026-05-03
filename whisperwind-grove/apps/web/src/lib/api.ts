const API_BASE = import.meta.env.VITE_API_BASE || '/api'

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
  const data = await res.json()
  if (data.token) {
    localStorage.setItem('ww_token', data.token)
    localStorage.setItem('ww_username', data.username || '')
  }
  return data
}

export function getToken(): string | null {
  return localStorage.getItem('ww_token')
}

export async function saveProgress(payload: { gameId?: number; gameSlug?: string; levelReached?: number; xp?: number; completionPercent?: number }) {
  const token = getToken()
  const res = await fetch(`${API_BASE}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  })
  return res.json()
}

export function logout() {
  localStorage.removeItem('ww_token')
  localStorage.removeItem('ww_username')
}

export function getUsername() {
  return localStorage.getItem('ww_username')
}

export async function getMyProgress() {
  const token = getToken()
  const res = await fetch(`${API_BASE}/progress`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  return res.json()
}

export default { register, login, saveProgress, logout, getToken, getUsername, getMyProgress }
