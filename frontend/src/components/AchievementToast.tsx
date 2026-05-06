import React, { useEffect } from 'react'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'

export type UnlockedAchievement = {
  code: string
  title: string
  description: string
  iconUrl?: string | null
}

type Props = {
  achievements: UnlockedAchievement[]
  onDone: () => void
}

export default function AchievementToast({ achievements, onDone }: Props) {
  useEffect(() => {
    if (achievements.length === 0) return
    const timer = window.setTimeout(onDone, 5200)
    return () => window.clearTimeout(timer)
  }, [achievements.length, onDone])

  if (achievements.length === 0) return null

  return (
    <div style={s.wrap}>
      {achievements.slice(0, 3).map((achievement) => (
        <div key={achievement.code} style={s.toast}>
          <div style={s.icon}>{achievement.iconUrl ? <img src={achievement.iconUrl} alt="" style={s.iconImg} /> : '🏆'}</div>
          <div style={s.copy}>
            <p style={s.kicker}>Achievement Unlocked</p>
            <h3 style={s.title}>{achievement.title}</h3>
            <p style={s.desc}>{achievement.description}</p>
          </div>
          <button style={s.close} onClick={onDone} aria-label="Dismiss achievement">×</button>
        </div>
      ))}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed',
    right: 18,
    bottom: 18,
    zIndex: 200,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    pointerEvents: 'none',
  },
  toast: {
    position: 'relative',
    width: 'min(360px, calc(100vw - 36px))',
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    padding: '14px 42px 14px 14px',
    borderRadius: 14,
    border: '1px solid rgba(242, 204, 143, 0.42)',
    background: 'linear-gradient(135deg, rgba(35, 54, 28, 0.96), rgba(73, 50, 24, 0.96))',
    boxShadow: '0 18px 40px rgba(0,0,0,0.42)',
    color: '#FFF6DF',
    pointerEvents: 'auto',
    animation: 'achievement-toast-in 360ms ease-out both',
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(242, 204, 143, 0.18)',
    fontSize: 25,
    flexShrink: 0,
  },
  iconImg: { width: 34, height: 34, objectFit: 'contain' },
  copy: { minWidth: 0 },
  kicker: {
    margin: 0,
    fontFamily: bodyFontFamily,
    fontSize: 11,
    color: '#F2CC8F',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: 700,
  },
  title: {
    margin: '2px 0',
    fontFamily: headingFontFamily,
    fontSize: 20,
    lineHeight: 1.05,
  },
  desc: {
    margin: 0,
    fontFamily: bodyFontFamily,
    fontSize: 13,
    lineHeight: 1.25,
    color: 'rgba(255,246,223,0.82)',
  },
  close: {
    position: 'absolute',
    top: 8,
    right: 10,
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,246,223,0.7)',
    fontSize: 20,
    cursor: 'pointer',
  },
}
