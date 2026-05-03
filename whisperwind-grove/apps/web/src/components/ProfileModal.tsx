import { useEffect, useState } from 'react'
import api from '../lib/api'

type Props = {
  onClose: () => void
  onSave?: (avatarUrl: string | null) => void
}

export default function ProfileModal({ onClose, onSave }: Props) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<{ id?: number; email?: string; username?: string; avatarUrl?: string }>({})
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
  // fetch profile
    ;(async () => {
      try {
        const res = await fetch('/api/users/profile', { headers: { 'Content-Type': 'application/json', ...(api.getToken() ? { Authorization: `Bearer ${api.getToken()}` } : {}) } })
        const data = await res.json()
        if (!mounted) return
        if (data?.error) setMessage(data.error)
        else {
          setProfile(data)
          setUsername(data.username || '')
        }
      } catch (err: unknown) {
        setMessage((err as Error)?.message || 'Failed')
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
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(api.getToken() ? { Authorization: `Bearer ${api.getToken()}` } : {}) },
        body: JSON.stringify({ username })
      })
      const data = await res.json()
      if (data?.error) setMessage(data.error)
      else {
        setMessage('Profile updated')
        if (typeof onSave === 'function') onSave(data.avatarUrl || null)
      }
    } catch (err: unknown) {
      setMessage((err as Error)?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const uploadFile = async (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const result = reader.result as string
      try {
        const res = await fetch('/api/users/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(api.getToken() ? { Authorization: `Bearer ${api.getToken()}` } : {}) },
          body: JSON.stringify({ avatarBase64: result })
        })
        const data = await res.json()
        if (data?.error) setMessage(data.error)
        else {
          setProfile((p) => ({ ...p, avatarUrl: data.avatarUrl }))
          setMessage('Avatar uploaded')
          if (typeof onSave === 'function') onSave(data.avatarUrl || null)
        }
      } catch (err: unknown) {
        setMessage((err as Error)?.message || 'Upload failed')
      }
    }
    reader.readAsDataURL(file)
  }

  if (loading) return <div style={overlayStyles.overlay}>Loading...</div>

  return (
    <div style={overlayStyles.overlay}>
      <div style={overlayStyles.card}>
        <h3>Profile</h3>
        {profile.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" style={{ width: 96, height: 96, borderRadius: 12 }} /> : <div style={{ width: 96, height: 96, borderRadius: 12, background: '#ddd' }} />}
        <div style={{ marginTop: 8 }}>
          <input type="file" accept="image/*" onChange={(e) => uploadFile(e.target.files ? e.target.files[0] : null)} />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} style={{ display: 'block', width: '100%', padding: 8 }} />
        </div>
        {message ? <div style={{ marginTop: 8 }}>{message}</div> : null}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving}>Save</button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

const overlayStyles = {
  overlay: { position: 'fixed' as const, inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 90 },
  card: { background: 'rgba(20,18,16,0.96)', padding: 20, borderRadius: 12, width: 'min(480px, 94vw)', color: '#F8F0DC' }
}
