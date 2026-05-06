import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import type { SidebarSection } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import ProfilePage from '../../pages/ProfilePage'
import SettingsPage from '../../pages/SettingsPage'
import ProgressPage from '../../pages/ProgressPage'
import LeaderboardPage from '../../pages/LeaderboardPage'
import AchievementsPage from '../../pages/AchievementsPage'
import GameSelectionScreen from '../GameSelectionScreen'
import {
  SETTINGS_EVENT,
  loadDashboardBackground,
  loadUserSettings,
  type UserSettings,
} from '../../lib/userSettings'

type Props = {
  onSelect: (id: string) => void
  onLogout: () => void
}

export default function AppShell({ onSelect, onLogout }: Props) {
  const { user } = useAuth()
  const [section, setSection] = useState<SidebarSection>('games')
  const [settings, setSettings] = useState<UserSettings>(loadUserSettings)
  const [background, setBackground] = useState(loadDashboardBackground)

  useEffect(() => {
    const refresh = () => {
      setSettings(loadUserSettings())
      setBackground(loadDashboardBackground())
    }
    window.addEventListener(SETTINGS_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(SETTINGS_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      position: 'relative',
      backgroundColor: 'var(--bg-page)',
      backgroundImage: background
        ? `linear-gradient(var(--bg-photo-blend), var(--bg-photo-blend)), url('${background}')`
        : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      transition: 'background 250ms ease',
    }}>
      {settings.particles && !settings.reduceMotion && <ShellParticles />}
      <Sidebar
        active={section}
        onChange={setSection}
        username={user?.username ?? ''}
        onLogout={onLogout}
      />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0, position: 'relative', zIndex: 1 }}>
        {section === 'games'       && <GameSelectionScreen onSelect={onSelect} onLogout={onLogout} />}
        {section === 'progress'    && <ProgressPage />}
        {section === 'achievements' && <AchievementsPage />}
        {section === 'leaderboard' && <LeaderboardPage />}
        {section === 'profile'     && <ProfilePage />}
        {section === 'settings'    && <SettingsPage />}
      </main>
    </div>
  )
}

const PARTICLES = [
  { src: '/assets/animation/willow-leaves.gif', top: '0%', left: '18%', width: 150, opacity: 0.22, duration: '9s', delay: '0s' },
  { src: '/assets/animation/wind.gif', top: '58%', left: '76%', width: 150, opacity: 0.18, duration: '11s', delay: '1s' },
  { src: '/assets/animation/shine-1.gif', top: '18%', left: '62%', width: 58, opacity: 0.28, duration: '7s', delay: '0.5s' },
  { src: '/assets/animation/shine-2.gif', top: '76%', left: '42%', width: 54, opacity: 0.20, duration: '8s', delay: '1.5s' },
  { src: '/assets/animation/lady-2.gif', bottom: '0%', left: '84%', width: 96, opacity: 0.16, duration: '10s', delay: '0.8s' },
]

function ShellParticles() {
  return (
    <div style={particleStyles.wrap} aria-hidden="true">
      {PARTICLES.map((particle, index) => (
        <img
          key={`${particle.src}-${index}`}
          src={particle.src}
          alt=""
          style={{
            ...particleStyles.image,
            top: particle.top,
            bottom: particle.bottom,
            left: particle.left,
            width: particle.width,
            opacity: particle.opacity,
            animation: `float-spirit ${particle.duration} ease-in-out ${particle.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
}

const particleStyles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  image: {
    position: 'absolute',
    height: 'auto',
    filter: 'drop-shadow(0 4px 16px rgba(120,160,80,0.28))',
  },
}
