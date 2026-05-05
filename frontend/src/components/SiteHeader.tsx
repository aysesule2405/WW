import React from 'react'
// no direct API usage here; parent controls actions

type Props = {
  username: string | null
  onLogin: () => void
  onLogout: () => void
  onOpenProgress: () => void
  onOpenProfile?: () => void
  onOpenSettings?: () => void
  avatarUrl?: string | null
}

export default function SiteHeader({ username, onLogin, onLogout, onOpenProgress, onOpenProfile, onOpenSettings, avatarUrl }: Props) {
  const [open, setOpen] = React.useState(false)

  const initials = username ? username.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase() : ''

  return (
    <header style={styles.header}>
      <div style={styles.brand}>Whisperwind Grove</div>
      <div style={styles.actions}>
        <button style={styles.link} onClick={onOpenProgress}>My Progress</button>
        {username ? (
          <div style={{ position: 'relative' }}>
            <button style={styles.avatar} onClick={() => setOpen(v => !v)}>
              {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: 36, height: 36, borderRadius: 999 }} /> : initials}
            </button>
            {open ? (
              <div style={styles.dropdown} onMouseLeave={() => setOpen(false)}>
                <div style={styles.dropdownItem} onClick={() => { setOpen(false); if (onOpenProfile) onOpenProfile() }}>Profile</div>
                <div style={styles.dropdownItem} onClick={() => { setOpen(false); if (onOpenSettings) onOpenSettings() }}>Settings</div>
                <div style={styles.dropdownDivider} />
                <div style={styles.dropdownItem} onClick={() => { setOpen(false); onLogout() }}>Logout</div>
              </div>
            ) : null}
          </div>
        ) : (
          <button style={styles.button} onClick={onLogin}>Login</button>
        )}
      </div>
    </header>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', background: 'rgba(20,20,20,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  brand: { color: '#F8F0DC', fontWeight: 700, fontSize: 18 },
  actions: { display: 'flex', gap: 12, alignItems: 'center' },
  button: { padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
  link: { padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)' },
  username: { color: '#F8F0DC', marginRight: 6 },
  avatar: { width: 40, height: 40, borderRadius: 999, background: '#DDE5B6', color: '#2F3A1E', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, cursor: 'pointer', border: 'none' },
  dropdown: { position: 'absolute', right: 0, top: 48, background: 'rgba(16,12,10,0.96)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, minWidth: 160, boxShadow: '0 12px 36px rgba(0,0,0,0.45)', zIndex: 40 },
  dropdownItem: { padding: '10px 12px', cursor: 'pointer', color: '#F8F0DC' },
  dropdownDivider: { height: 1, background: 'rgba(255,255,255,0.04)', margin: '6px 0' },
}
