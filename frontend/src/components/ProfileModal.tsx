import { useEffect, useState } from 'react'
import api, { isProfileError, type UserProfile } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import UserAvatar from './avatar/UserAvatar'

type Props = {
  onClose: () => void
  onSave?: (avatarUrl: string | null) => void
}

export default function ProfileModal({ onClose, onSave }: Props) {
  const { setCurrentProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
  // fetch profile
    ;(async () => {
      try {
        const data = await api.getProfile()
        if (!mounted) return
        if (isProfileError(data)) setMessage(data.error)
        else {
          setProfile(data)
          setCurrentProfile(data)
          setUsername(data.username || '')
        }
      } catch (err: unknown) {
        setMessage((err as Error)?.message || 'Failed')
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [setCurrentProfile])

  const save = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const data = await api.updateProfile({ username })
      if (isProfileError(data)) setMessage(data.error)
      else {
        setProfile(data)
        setCurrentProfile(data)
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
        const data = await api.uploadAvatar(result)
        if (isProfileError(data)) setMessage(data.error)
        else {
          setProfile(data)
          setCurrentProfile(data)
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
    <div className="ww-game-modal-backdrop" style={overlayStyles.overlay}>
      <div className="ww-game-modal-card" style={overlayStyles.card}>
        <h3>Profile</h3>
        <UserAvatar identity={{ ...profile, username: profile.username ?? username }} size={96} alt="Profile avatar" />
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
