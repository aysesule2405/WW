import { useState } from 'react'
import api from '../../lib/api'
import { bodyFontFamily, headingFontFamily } from '../../theme/typography'

type Props = {
  onClose?: () => void
  onSuccess?: () => void
  modal?: boolean
}

export default function LoginPage({ onClose, onSuccess, modal = false }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'register') {
        const res = await api.register(email, username, password)
        if (res?.error) setError(res.error)
        else setSuccess('Account created — you can now log in')
      } else {
        const res = await api.login(email, password)
        if (res?.error) setError(res.error)
        else setSuccess(`Welcome back, ${res.username || username || 'player'}`)
        if (!res?.error && onSuccess) onSuccess()
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Unexpected error')
    }
  }

  return (
    <div style={modal ? styles.modalOverlay : styles.page}>
      <form style={modal ? { ...styles.card, ...styles.modalCard } : styles.card} onSubmit={submit}>
        <h2 style={styles.title}>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
        <label style={styles.label}>Email</label>
        <input style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode === 'register' && (
          <>
            <label style={styles.label}>Username</label>
            <input style={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
          </>
        )}
        <label style={styles.label}>Password</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

  {error ? <div style={styles.error}>{error}</div> : null}
  {success ? <div style={styles.success}>{success}</div> : null}

        <div style={styles.actions}>
          <button type="submit" style={styles.primary}>{mode === 'login' ? 'Sign in' : 'Create account'}</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={styles.ghost} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? 'Need an account?' : 'Have an account?'}
            </button>
            <button type="button" style={styles.ghost} onClick={() => { if (onClose) onClose() }}>
              Close
            </button>
          </div>
        </div>
      </form>
  </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    boxSizing: 'border-box',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    zIndex: 60,
  },
  modalCard: {
    width: 'min(640px, 92vw)',
    borderRadius: 14,
    padding: 28,
  },
  card: {
    width: 'min(560px, 94vw)',
    background: 'rgba(18,13,9,0.6)',
    padding: 24,
    borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.18)',
    boxShadow: '0 28px 60px rgba(0,0,0,0.5)'
  },
  title: { margin: 0, fontFamily: headingFontFamily, color: '#FFF6DF', fontSize: 36 },
  label: { display: 'block', marginTop: 12, color: '#F3E7CC', fontFamily: bodyFontFamily },
  input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', marginTop: 6, background: 'rgba(255,255,255,0.04)', color: '#F8F0DC' },
  actions: { marginTop: 18, display: 'flex', gap: 12, alignItems: 'center' },
  primary: { flex: 1, padding: '12px 16px', borderRadius: 10, background: '#DDE5B6', border: 'none', fontFamily: bodyFontFamily, fontSize: 18, cursor: 'pointer' },
  ghost: { padding: '10px 12px', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#F8F0DC', cursor: 'pointer' },
  error: { marginTop: 12, color: '#FFB6B6' },
  success: { marginTop: 12, color: '#B8E9A6' },
}
