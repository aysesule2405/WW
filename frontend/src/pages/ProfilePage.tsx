import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import { bodyFontFamily, headingFontFamily, numberFontFamily, readableFontFamily } from '../theme/typography'
import { inputSurface, pageShell, primaryButton, surfaceCard, uiRadius, uiSpace, uiType } from '../theme/uiTokens'
import { AvatarCreator, AvatarSvg, DEFAULT_RICH_AVATAR, type RichAvatarConfig } from '../components/AvatarCreator'
import { useAuth } from '../context/AuthContext'

type AvatarConfig = { face: string; color: string; accessory: string }
type Profile = {
  email?: string
  username?: string
  avatarUrl?: string | null
  status?: string
  favoriteSong?: string
  favoriteSteamGames?: string
  avatarConfig?: AvatarConfig | null
  richAvatarConfig?: string | null
  avatarPreference?: 'photo' | 'rich' | null
}

const DEFAULT_AVATAR: AvatarConfig = { face: '🙂', color: '#ADC178', accessory: 'leaf' }

function parseRichAvatar(raw: string | null | undefined): RichAvatarConfig {
  if (!raw) return DEFAULT_RICH_AVATAR
  try { return { ...DEFAULT_RICH_AVATAR, ...JSON.parse(raw) } } catch { return DEFAULT_RICH_AVATAR }
}

function isCustomized(cfg: RichAvatarConfig): boolean {
  return JSON.stringify(cfg) !== JSON.stringify(DEFAULT_RICH_AVATAR)
}

export default function ProfilePage() {
  const { updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile>({})
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState('')
  const [favoriteSong, setFavoriteSong] = useState('')
  const [favoriteSteamGames, setFavoriteSteamGames] = useState('')
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR)
  const [richAvatar, setRichAvatar] = useState<RichAvatarConfig>(DEFAULT_RICH_AVATAR)
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
          setRichAvatar(parseRichAvatar(data.richAvatarConfig))
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
        richAvatarConfig: JSON.stringify(richAvatar),
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
          richAvatarConfig: JSON.stringify(richAvatar),
          avatarPreference: 'rich',
        }))
        updateUser({ username })
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
          setProfile((p) => ({ ...p, avatarUrl: data.avatarUrl, avatarPreference: 'photo' }))
          setMessage({ text: 'Avatar updated!', ok: true })
        }
      } catch (err: unknown) {
        setMessage({ text: (err as Error)?.message || 'Upload failed', ok: false })
      }
    }
    reader.readAsDataURL(file)
  }

  // Last saved wins: 'photo' preference shows uploaded image, 'rich' (or no photo) shows SVG avatar
  const showRichInPreview =
    profile.avatarPreference === 'rich'
      ? isCustomized(richAvatar)
      : !profile.avatarUrl && isCustomized(richAvatar)

  if (loading) return <div style={s.loading}>Loading profile…</div>

  return (
    <div style={s.page}>
      <header style={s.header}>
        <h2 style={s.pageTitle}>Your Profile</h2>
        <p style={s.pageSub}>Personalize how the grove remembers you.</p>
      </header>

      <div style={s.layout}>
        <aside style={s.previewCard}>
          <div style={s.profileHero}>
            <AvatarPreview
              config={avatarConfig}
              richAvatar={richAvatar}
              showRich={showRichInPreview}
              image={profile.avatarUrl ?? null}
              fallback={profile.username?.[0] ?? '?'}
              large
            />
            <div style={s.previewCopy}>
              <p style={s.previewEyebrow}>Profile preview</p>
              <h3 style={s.previewName}>{username || profile.username || 'Grove Visitor'}</h3>
              <p style={s.previewStatus}>{status || 'Wandering softly through the grove.'}</p>
            </div>
          </div>
          <div style={s.previewList}>
            <p style={s.previewLine}><strong>Favorite song</strong><span>{favoriteSong || 'Not set yet'}</span></p>
            <p style={s.previewLine}><strong>Favorite Steam games</strong><span>{favoriteSteamGames || 'Not set yet'}</span></p>
          </div>

          {/* ── How you appear ── */}
          <div style={s.howYouAppear}>
            <p style={s.howYouAppearLabel}>How you appear</p>

            <div style={s.appearBlock}>
              <p style={s.appearBlockLabel}>Community post</p>
              <div style={s.appearAuthorRow}>
                <AvatarPreview
                  config={avatarConfig}
                  richAvatar={richAvatar}
                  showRich={showRichInPreview}
                  image={profile.avatarUrl ?? null}
                  fallback={username?.[0] ?? '?'}
                  size={28}
                />
                <div style={{ minWidth: 0 }}>
                  <span style={s.appearUsername}>{username || 'Grove Visitor'}</span>
                  {status && <p style={s.appearStatusLine}>{status}</p>}
                </div>
              </div>
            </div>

            <div style={s.appearBlock}>
              <p style={s.appearBlockLabel}>Leaderboard row</p>
              <div style={s.appearLeaderRow}>
                <span style={{ fontSize: 18 }}>🥇</span>
                <AvatarPreview
                  config={avatarConfig}
                  richAvatar={richAvatar}
                  showRich={showRichInPreview}
                  image={profile.avatarUrl ?? null}
                  fallback={username?.[0] ?? '?'}
                  size={28}
                />
                <span style={s.appearUsername}>{username || 'Grove Visitor'}</span>
                <span style={s.appearScore}>— pts</span>
              </div>
            </div>
          </div>
        </aside>

        <section style={s.card}>
          {/* Profile Photo */}
          <div style={s.avatarSection}>
            <div style={s.avatarSectionCopy}>
              <AvatarPreview
                config={avatarConfig}
                richAvatar={richAvatar}
                showRich={showRichInPreview}
                image={profile.avatarUrl ?? null}
                fallback={profile.username?.[0] ?? '?'}
              />
              <div>
                <p style={s.formSectionTitle}>Profile Photo</p>
                <p style={s.formSectionDesc}>Upload a photo or design your grove avatar below.</p>
              </div>
            </div>
            <label style={s.avatarUploadLabel}>
              Upload Photo
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

          {message && (
            <div style={{ ...s.message, background: message.ok ? 'var(--bg-success-soft)' : 'var(--bg-danger-soft)', color: message.ok ? 'var(--accent-dark)' : '#C04040', border: `1px solid ${message.ok ? 'var(--border-focus)' : 'rgba(200,60,60,0.30)'}` }}>
              {message.text}
            </div>
          )}

          <button style={s.saveBtn} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </section>

        {/* ── Avatar creator – third column ── */}
        <section style={s.avatarCard}>
          <div style={s.builderHeader}>
            <h3 style={s.builderTitle}>Design Your Grove Avatar</h3>
            <p style={s.builderDesc}>Build a fully custom SVG avatar for your profile.</p>
          </div>
          <AvatarCreator value={richAvatar} onChange={setRichAvatar} />
        </section>
      </div>
    </div>
  )
}

function AvatarPreview({ config, richAvatar, showRich, image, fallback, large = false, size: sizeProp }: {
  config: AvatarConfig
  richAvatar: RichAvatarConfig
  showRich: boolean
  image: string | null
  fallback: string
  large?: boolean
  size?: number
}) {
  const size = sizeProp ?? (large ? 112 : 80)
  const fontSize = large ? 42 : sizeProp ? Math.round(sizeProp * 0.46) : 32
  const showCharm = !sizeProp || sizeProp >= 40

  // showRich is already resolved to respect avatarPreference — render whichever comes first
  if (showRich) {
    return (
      <div style={{ borderRadius: '50%', overflow: 'hidden', flexShrink: 0, lineHeight: 0 }}>
        <AvatarSvg config={richAvatar} size={size} />
      </div>
    )
  }

  if (image) {
    return (
      <img
        src={api.mediaUrl(image)}
        alt="avatar"
        style={{ ...s.avatarImg, width: size, height: size, borderRadius: sizeProp && sizeProp < 48 ? '50%' : undefined }}
      />
    )
  }

  return (
    <div style={{ ...s.customAvatar, width: size, height: size, background: `radial-gradient(circle at 35% 25%, #fff8, transparent 32%), ${config.color}`, borderRadius: sizeProp && sizeProp < 48 ? '50%' : undefined }}>
      <span style={{ fontSize }}>{config.face || fallback.toUpperCase()}</span>
      {showCharm && <span style={s.avatarCharm}>{accessoryIcon(config.accessory)}</span>}
    </div>
  )
}

function accessoryIcon(accessory: string) {
  if (accessory === 'moon') return '☾'
  if (accessory === 'spark') return '✦'
  if (accessory === 'flower') return '✿'
  return '☘'
}

const s: Record<string, React.CSSProperties> = {
  loading: { ...pageShell(99999), color: 'var(--text-secondary)', fontFamily: bodyFontFamily },
  page: { ...pageShell(99999), display: 'flex', flexDirection: 'column', gap: uiSpace.lg, fontFamily: bodyFontFamily },
  header: { display: 'flex', flexDirection: 'column', gap: 4 },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: uiType.pageTitle, color: 'var(--text-h)', lineHeight: 1 },
  pageSub: { margin: 0, color: 'var(--text-muted)', fontSize: uiType.small, fontFamily: readableFontFamily },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: uiSpace.lg,
    alignItems: 'start',
  },
  previewCard: {
    ...surfaceCard,
    padding: uiSpace.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: uiSpace.lg,
    position: 'sticky',
    top: uiSpace.lg,
  },
  profileHero: { display: 'flex', alignItems: 'center', gap: uiSpace.md, flexWrap: 'wrap' },
  previewCopy: { minWidth: 0, flex: 1 },
  previewEyebrow: { margin: 0, color: 'var(--text-muted)', fontSize: uiType.micro, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: readableFontFamily },
  previewName: { margin: 0, fontFamily: headingFontFamily, fontSize: 26, color: 'var(--text-h)', lineHeight: 1.05 },
  previewStatus: { margin: '5px 0 0', color: 'var(--text-secondary)', lineHeight: 1.45, fontFamily: readableFontFamily },
  previewList: { display: 'flex', flexDirection: 'column', gap: uiSpace.sm },
  previewLine: {
    margin: 0, color: 'var(--text-secondary)', fontSize: uiType.small, lineHeight: 1.45,
    display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px',
    borderRadius: uiRadius.md, background: 'var(--bg-badge)', border: '1px solid var(--border-muted)',
    fontFamily: readableFontFamily,
  },
  card: {
    ...surfaceCard,
    padding: 'clamp(18px, 3vw, 28px)',
    display: 'flex',
    flexDirection: 'column',
    gap: uiSpace.lg,
    minWidth: 0,
  },
  avatarSection: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: uiSpace.md, flexWrap: 'wrap' },
  avatarSectionCopy: { display: 'flex', alignItems: 'center', gap: uiSpace.md, minWidth: 0 },
  formSectionTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: uiType.cardTitle, color: 'var(--text-h)', lineHeight: 1 },
  formSectionDesc: { margin: '4px 0 0', color: 'var(--text-muted)', fontSize: uiType.small, fontFamily: readableFontFamily },
  avatarImg: { width: 80, height: 80, borderRadius: uiRadius.lg, objectFit: 'cover', border: '2px solid var(--border)' },
  customAvatar: {
    position: 'relative',
    borderRadius: uiRadius.xl,
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
  avatarUploadLabel: {
    fontSize: uiType.small, color: 'var(--accent-dark)', fontWeight: 700, cursor: 'pointer',
    padding: '9px 14px', borderRadius: uiRadius.md, border: '1px solid var(--border-focus)',
    background: 'var(--bg-accent-soft)', fontFamily: bodyFontFamily,
  },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: uiType.micro, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: readableFontFamily },
  fieldReadonly: { fontSize: uiType.body, color: 'var(--text-secondary)', padding: '11px 14px', background: 'var(--bg-badge)', borderRadius: uiRadius.md, border: '1px solid var(--border-muted)', fontFamily: readableFontFamily },
  input: {
    ...inputSurface,
    fontSize: uiType.body, padding: '11px 14px',
    fontFamily: readableFontFamily,
  },
  textarea: { minHeight: 78, resize: 'vertical' },
  avatarCard: {
    ...surfaceCard,
    padding: 'clamp(18px, 3vw, 28px)',
    display: 'flex',
    flexDirection: 'column',
    gap: uiSpace.md,
    minWidth: 0,
  },
  builderHeader: { display: 'flex', flexDirection: 'column', gap: 2 },
  builderTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: uiType.sectionTitle, color: 'var(--text-h)' },
  builderDesc: { margin: 0, color: 'var(--text-muted)', fontSize: uiType.small, fontFamily: readableFontFamily },
  message: { padding: '10px 14px', borderRadius: uiRadius.md, fontSize: uiType.small, fontWeight: 700, fontFamily: readableFontFamily },
  saveBtn: {
    ...primaryButton,
    padding: '12px 0',
    fontFamily: bodyFontFamily, fontSize: 16, fontWeight: 700,
  },
  howYouAppear: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 },
  howYouAppearLabel: { margin: '0 0 2px', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: readableFontFamily },
  appearBlock: {
    padding: '10px 12px', borderRadius: uiRadius.md, border: '1px solid var(--border-muted)',
    background: 'var(--bg-badge)', display: 'flex', flexDirection: 'column', gap: 8,
  },
  appearBlockLabel: { margin: 0, fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: readableFontFamily },
  appearAuthorRow: { display: 'flex', alignItems: 'center', gap: 8 },
  appearLeaderRow: { display: 'flex', alignItems: 'center', gap: 8 },
  appearUsername: { fontSize: 13, fontWeight: 700, color: 'var(--text-body)', fontFamily: bodyFontFamily },
  appearStatusLine: { margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: readableFontFamily, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 },
  appearScore: { marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: 'var(--accent)', fontFamily: numberFontFamily },
}
