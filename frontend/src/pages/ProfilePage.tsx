import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'

type AvatarConfig = { face: string; color: string; accessory: string }
type Profile = {
  email?: string
  username?: string
  avatarUrl?: string | null
  status?: string
  favoriteSong?: string
  favoriteSteamGames?: string
  avatarConfig?: AvatarConfig | null
}

const DEFAULT_AVATAR: AvatarConfig = { face: '🙂', color: '#ADC178', accessory: 'leaf' }
const FACES = ['🙂', '😊', '😌', '🌙', '🌿', '✨']
const COLORS = ['#ADC178', '#9EECF8', '#FFAFBA', '#F2CC8F', '#8F8FBA', '#C6CF79']
const ACCESSORIES = ['leaf', 'moon', 'spark', 'flower']

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile>({})
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState('')
  const [favoriteSong, setFavoriteSong] = useState('')
  const [favoriteSteamGames, setFavoriteSteamGames] = useState('')
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await api.getProfile()
        if (!mounted) return
        if (data?.error) setMessage({ text: data.error, ok: false })
        else {
          setProfile(data)
          setUsername(data.username || '')
          setStatus(data.status || '')
          setFavoriteSong(data.favoriteSong || '')
          setFavoriteSteamGames(data.favoriteSteamGames || '')
          setAvatarConfig(data.avatarConfig || DEFAULT_AVATAR)
        }
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
      const data = await api.updateProfile({
        username,
        status,
        favoriteSong,
        favoriteSteamGames,
        avatarConfig,
      })
      if (data?.error) setMessage({ text: data.error, ok: false })
      else {
        setProfile((current) => ({
          ...current,
          username,
          status,
          favoriteSong,
          favoriteSteamGames,
          avatarConfig,
        }))
        setMessage({ text: 'Profile updated!', ok: true })
      }
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
      <div>
        <h2 style={s.pageTitle}>Your Profile</h2>
        <p style={s.pageSub}>Personalize how the grove remembers you.</p>
      </div>

      <div style={s.layout}>
      <div style={s.previewCard}>
        <div style={s.profileHero}>
          <AvatarPreview config={avatarConfig} image={profile.avatarUrl ?? null} fallback={profile.username?.[0] ?? '?'} large />
          <div>
            <h3 style={s.previewName}>{username || profile.username || 'Grove Visitor'}</h3>
            <p style={s.previewStatus}>{status || 'Wandering softly through the grove.'}</p>
          </div>
        </div>
        <div style={s.previewList}>
          <p style={s.previewLine}><strong>Favorite song:</strong> {favoriteSong || 'Not set yet'}</p>
          <p style={s.previewLine}><strong>Favorite Steam games:</strong> {favoriteSteamGames || 'Not set yet'}</p>
        </div>
      </div>

      <div style={s.card}>
        {/* Avatar */}
        <div style={s.avatarSection}>
          <AvatarPreview config={avatarConfig} image={profile.avatarUrl ?? null} fallback={profile.username?.[0] ?? '?'} />
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

        <div style={s.field}>
          <label style={s.fieldLabel}>Status</label>
          <input
            style={s.input}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            maxLength={180}
            placeholder="What should the grove know about today?"
          />
        </div>

        <div style={s.field}>
          <label style={s.fieldLabel}>Favorite song</label>
          <input
            style={s.input}
            value={favoriteSong}
            onChange={(e) => setFavoriteSong(e.target.value)}
            maxLength={140}
            placeholder="A song that feels like your grove"
          />
        </div>

        <div style={s.field}>
          <label style={s.fieldLabel}>Favorite Steam games</label>
          <textarea
            style={{ ...s.input, ...s.textarea }}
            value={favoriteSteamGames}
            onChange={(e) => setFavoriteSteamGames(e.target.value)}
            maxLength={300}
            placeholder="Stardew Valley, Hades, Spiritfarer..."
          />
        </div>

        <div style={s.avatarBuilder}>
          <div>
            <h3 style={s.builderTitle}>Create Your Own Avatar</h3>
            <p style={s.builderDesc}>Pick a face, aura color, and tiny grove charm.</p>
          </div>
          <div style={s.optionGroup}>
            {FACES.map((face) => (
              <button key={face} style={{ ...s.optionBtn, ...(avatarConfig.face === face ? s.optionActive : {}) }} onClick={() => setAvatarConfig((current) => ({ ...current, face }))}>{face}</button>
            ))}
          </div>
          <div style={s.optionGroup}>
            {COLORS.map((color) => (
              <button key={color} aria-label={`Avatar color ${color}`} style={{ ...s.colorBtn, background: color, ...(avatarConfig.color === color ? s.colorActive : {}) }} onClick={() => setAvatarConfig((current) => ({ ...current, color }))} />
            ))}
          </div>
          <div style={s.optionGroup}>
            {ACCESSORIES.map((accessory) => (
              <button key={accessory} style={{ ...s.charmBtn, ...(avatarConfig.accessory === accessory ? s.optionActive : {}) }} onClick={() => setAvatarConfig((current) => ({ ...current, accessory }))}>
                {accessoryLabel(accessory)}
              </button>
            ))}
          </div>
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
    </div>
  )
}

function AvatarPreview({ config, image, fallback, large = false }: {
  config: AvatarConfig
  image: string | null
  fallback: string
  large?: boolean
}) {
  const size = large ? 112 : 80
  return image ? (
    <img src={api.mediaUrl(image)} alt="avatar" style={{ ...s.avatarImg, width: size, height: size }} />
  ) : (
    <div style={{ ...s.customAvatar, width: size, height: size, background: `radial-gradient(circle at 35% 25%, #fff8, transparent 32%), ${config.color}` }}>
      <span style={{ fontSize: large ? 42 : 32 }}>{config.face || fallback.toUpperCase()}</span>
      <span style={s.avatarCharm}>{accessoryIcon(config.accessory)}</span>
    </div>
  )
}

function accessoryIcon(accessory: string) {
  if (accessory === 'moon') return '☾'
  if (accessory === 'spark') return '✦'
  if (accessory === 'flower') return '✿'
  return '☘'
}

function accessoryLabel(accessory: string) {
  return `${accessoryIcon(accessory)} ${accessory.charAt(0).toUpperCase()}${accessory.slice(1)}`
}

const s: Record<string, React.CSSProperties> = {
  loading: { padding: 32, color: 'var(--text-secondary)', fontFamily: bodyFontFamily },
  page: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: bodyFontFamily },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 32, color: 'var(--text-h)' },
  pageSub: { margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 14 },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 360px) minmax(360px, 560px)',
    gap: 20,
    alignItems: 'start',
  },
  previewCard: {
    background: 'var(--bg-surface)',
    borderRadius: 18,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)',
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  profileHero: { display: 'flex', alignItems: 'center', gap: 16 },
  previewName: { margin: 0, fontFamily: headingFontFamily, fontSize: 25, color: 'var(--text-h)' },
  previewStatus: { margin: '4px 0 0', color: 'var(--text-secondary)', lineHeight: 1.4 },
  previewList: { display: 'flex', flexDirection: 'column', gap: 8 },
  previewLine: { margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.45 },
  card: {
    background: 'var(--bg-surface)',
    borderRadius: 18,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)',
    padding: '28px 30px',
    maxWidth: 560,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  avatarSection: { display: 'flex', alignItems: 'center', gap: 16 },
  avatarImg: { width: 80, height: 80, borderRadius: 14, objectFit: 'cover', border: '2px solid var(--border)' },
  customAvatar: {
    position: 'relative',
    borderRadius: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#233018',
    border: '2px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    flexShrink: 0,
  },
  avatarCharm: {
    position: 'absolute',
    right: 7,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.78)',
    color: 'var(--accent-dark)',
    fontSize: 15,
    boxShadow: '0 2px 6px rgba(0,0,0,0.16)',
  },
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
  textarea: { minHeight: 78, resize: 'vertical' },
  avatarBuilder: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    background: 'var(--bg-badge)',
    border: '1px solid var(--border-muted)',
  },
  builderTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 20, color: 'var(--text-h)' },
  builderDesc: { margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 },
  optionGroup: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text-body)',
    borderRadius: 10,
    padding: '8px 10px',
    cursor: 'pointer',
    fontFamily: bodyFontFamily,
  },
  optionActive: { borderColor: 'var(--accent)', background: 'var(--bg-accent-soft)', color: 'var(--accent-dark)' },
  colorBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    border: '2px solid var(--border)',
    cursor: 'pointer',
  },
  colorActive: { borderColor: 'var(--text-h)', transform: 'scale(1.08)' },
  charmBtn: {
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text-body)',
    borderRadius: 999,
    padding: '7px 12px',
    cursor: 'pointer',
    fontFamily: bodyFontFamily,
  },
  message: { padding: '10px 14px', borderRadius: 9, fontSize: 14, fontWeight: 600, fontFamily: bodyFontFamily },
  saveBtn: {
    padding: '12px 0', borderRadius: 11, border: 'none',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
    color: 'var(--text-on-dark)', fontFamily: bodyFontFamily, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 6px 18px rgba(58,88,32,0.35)',
  },
}
