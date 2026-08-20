import type { CSSProperties } from 'react'
import { mediaUrl, type AvatarConfig } from '../../lib/api'
import { AvatarSvg, DEFAULT_RICH_AVATAR, type RichAvatarConfig } from './AvatarArtwork'

export type AvatarIdentity = {
  username?: string | null
  avatarUrl?: string | null
  avatarConfig?: AvatarConfig | null
  richAvatarConfig?: string | null
  avatarPreference?: 'photo' | 'rich' | null
}

const AVATAR_PALETTE = ['#4a7c59', '#6b5c3e', '#5c6b9e', '#7a3c5c', '#3c6b7a', '#7a6b3c', '#3c5c7a']

function parseRichAvatar(raw: string | null | undefined): RichAvatarConfig | null {
  if (!raw) return null
  try {
    const parsed = { ...DEFAULT_RICH_AVATAR, ...JSON.parse(raw) }
    return JSON.stringify(parsed) !== JSON.stringify(DEFAULT_RICH_AVATAR) ? parsed : null
  } catch {
    return null
  }
}

export default function UserAvatar({
  identity,
  size = 32,
  border = '1px solid rgba(0,0,0,0.08)',
  style,
  className,
  alt = '',
}: {
  identity: AvatarIdentity
  size?: number
  border?: string
  style?: CSSProperties
  className?: string
  alt?: string
}) {
  const username = identity.username?.trim() || 'Unknown'
  const richAvatar = parseRichAvatar(identity.richAvatarConfig)
  const showRich = identity.avatarPreference === 'rich'
    ? Boolean(richAvatar)
    : Boolean(richAvatar && !identity.avatarUrl)
  const shared: CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: '50%',
    flexShrink: 0,
    border,
    boxSizing: 'border-box',
    ...style,
  }

  if (showRich && richAvatar) {
    return (
      <div className={className} style={{ ...shared, overflow: 'hidden', lineHeight: 0 }} aria-label={alt || undefined}>
        <AvatarSvg config={richAvatar} size={size} />
      </div>
    )
  }

  if (identity.avatarUrl) {
    return (
      <img
        className={className}
        src={mediaUrl(identity.avatarUrl)}
        alt={alt}
        style={{ ...shared, objectFit: 'cover' }}
      />
    )
  }

  if (richAvatar) {
    return (
      <div className={className} style={{ ...shared, overflow: 'hidden', lineHeight: 0 }} aria-label={alt || undefined}>
        <AvatarSvg config={richAvatar} size={size} />
      </div>
    )
  }

  if (identity.avatarConfig) {
    return (
      <div
        className={className}
        style={{
          ...shared,
          background: `radial-gradient(circle at 35% 25%, #fff5, transparent 34%), ${identity.avatarConfig.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.round(size * 0.46),
        }}
        aria-label={alt || undefined}
      >
        {identity.avatarConfig.face}
      </div>
    )
  }

  const paletteIndex = username.charCodeAt(0) % AVATAR_PALETTE.length
  return (
    <div
      className={className}
      style={{
        ...shared,
        background: AVATAR_PALETTE[paletteIndex],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: Math.round(size * 0.38),
        fontWeight: 800,
        letterSpacing: '0.03em',
      }}
      aria-label={alt || undefined}
    >
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}
