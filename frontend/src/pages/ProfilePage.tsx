import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ email?: string; username?: string; avatarUrl?: string }>({})
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await api.getProfile()
        if (!mounted) return
        if (data?.error) setMessage({ text: data.error, ok: false })
        else { setProfile(data); setUsername(data.username || '') }
      } catch (err: unknown) {
        setMessage({ text: (err as Error)?.message || 'Failed to load profile', ok: false })
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const data = await api.updateProfile(username)
      if (data?.error) setMessage({ text: data.error, ok: false })
      else setMessage({ text: 'Profile updated!', ok: true })
    } catch (err: unknown) {
      setMessage({ text: (err as Error)?.message || 'Save failed', ok: false })
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const data = await api.uploadAvatar(reader.result as string)
        if (data?.error) setMessage({ text: data.error, ok: false })
        else {
          setProfile((p) => ({ ...p, avatarUrl: data.avatarUrl }))
          setMessage({ text: 'Avatar updated!', ok: true })
        }
      } catch (err: unknown) {
        setMessage({ text: (err as Error)?.message || 'Upload failed', ok: false })
      }
    }
    reader.readAsDataURL(file)
  }

  if (loading) return <div style={s.loading}>Loading profile…</div>

  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>Your Profile</h2>

      <div style={s.card}>
        {/* Avatar */}
        <div style={s.avatarSection}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="avatar" style={s.avatarImg} />
          ) : (
            <div style={s.avatarPlaceholder}>
              {profile.username?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <label style={s.avatarUploadLabel}>
            Change photo
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => uploadAvatar(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* Email (read-only) */}
        <div style={s.field}>
          <label style={s.fieldLabel}>Email</label>
          <div style={s.fieldReadonly}>{profile.email ?? '—'}</div>
        </div>

        {/* Username */}
        <div style={s.field}>
          <label style={s.fieldLabel}>Username</label>
          <input
            style={s.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your display name"
          />
        </div>

        {message && (
          <div style={{ ...s.message, background: message.ok ? 'var(--bg-success-soft)' : 'var(--bg-danger-soft)', color: message.ok ? 'var(--accent-dark)' : '#C04040', border: `1px solid ${message.ok ? 'var(--border-focus)' : 'rgba(200,60,60,0.30)'}` }}>
            {message.text}
          </div>
        )}

        <button style={s.saveBtn} onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  loading: { padding: 32, color: 'var(--text-secondary)', fontFamily: bodyFontFamily },
  page: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20 },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 32, color: 'var(--text-h)' },
  card: {
    background: 'var(--bg-surface)',
    borderRadius: 18,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)',
    padding: '28px 30px',
    maxWidth: 480,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  avatarSection: { display: 'flex', alignItems: 'center', gap: 16 },
  avatarImg: { width: 80, height: 80, borderRadius: 14, objectFit: 'cover', border: '2px solid var(--border)' },
  avatarPlaceholder: {
    width: 80, height: 80, borderRadius: 14,
    background: 'linear-gradient(135deg, #ADC178, #6C584C)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: 32, fontWeight: 700,
  },
  avatarUploadLabel: {
    fontSize: 14, color: 'var(--accent)', fontWeight: 600, cursor: 'pointer',
    padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-focus)',
    background: 'var(--bg-accent-soft)', fontFamily: bodyFontFamily,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 },
  fieldReadonly: { fontSize: 15, color: 'var(--text-secondary)', padding: '10px 14px', background: 'var(--bg-badge)', borderRadius: 9, border: '1px solid var(--border-muted)' },
  input: {
    fontSize: 15, color: 'var(--text-body)', padding: '10px 14px',
    background: 'var(--bg-input)', borderRadius: 9, border: '1px solid var(--border-strong)',
    outline: 'none', fontFamily: bodyFontFamily,
  },
  message: { padding: '10px 14px', borderRadius: 9, fontSize: 14, fontWeight: 600, fontFamily: bodyFontFamily },
  saveBtn: {
    padding: '12px 0', borderRadius: 11, border: 'none',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
    color: 'var(--text-on-dark)', fontFamily: bodyFontFamily, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 6px 18px rgba(58,88,32,0.35)',
  },
}
