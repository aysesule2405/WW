import React from 'react'
import { uiFontFamily, titleFontFamily } from '../../theme/typography'

type Props = {
  title: string
  onExit: () => void
  background: string
  accentColor?: string
  children: React.ReactNode
}

export default function GameShell({ title, onExit, background, accentColor = '#F0EAD2', children }: Props) {
  return (
    <div className="ww-game-shell" style={{ ...s.shell, background }}>
      <header className="ww-game-shell-header" style={s.topBar}>
        <button className="ww-game-shell-back" style={{ ...s.backBtn, color: accentColor, borderColor: `${accentColor}30` }} onClick={onExit}>
          ← Grove
        </button>
        <span className="ww-game-shell-title" style={{ ...s.title, color: accentColor }}>{title}</span>
      </header>
      <main className="ww-game-shell-content" style={s.content}>
        {children}
      </main>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  shell: {
    height: '100vh',
    maxHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  topBar: {
    flexShrink: 0,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    background: 'rgba(0,0,0,0.32)',
    backdropFilter: 'blur(14px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    zIndex: 20,
  },
  backBtn: {
    fontFamily: uiFontFamily,
    fontSize: 14,
    fontWeight: 600,
    padding: '7px 16px',
    borderRadius: 9,
    border: '1px solid',
    background: 'rgba(255,255,255,0.08)',
    cursor: 'pointer',
    letterSpacing: 0.2,
    transition: 'background 160ms ease',
    flexShrink: 0,
  },
  title: {
    fontFamily: titleFontFamily,
    fontSize: 22,
    fontWeight: 400,
    margin: 0,
    letterSpacing: 0.3,
    textShadow: '0 2px 10px rgba(0,0,0,0.55)',
    textAlign: 'right',
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
}
