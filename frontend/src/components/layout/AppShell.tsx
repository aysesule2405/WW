import { useState } from 'react'
import Sidebar from './Sidebar'
import type { SidebarSection } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import ProfilePage from '../../pages/ProfilePage'
import SettingsPage from '../../pages/SettingsPage'
import ProgressPage from '../../pages/ProgressPage'
import LeaderboardPage from '../../pages/LeaderboardPage'
import AchievementsPage from '../../pages/AchievementsPage'
import GameSelectionScreen from '../GameSelectionScreen'

type Props = {
  onSelect: (id: string) => void
  onLogout: () => void
}

export default function AppShell({ onSelect, onLogout }: Props) {
  const { user } = useAuth()
  const [section, setSection] = useState<SidebarSection>('games')

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-page)',
      transition: 'background 250ms ease',
    }}>
      <Sidebar
        active={section}
        onChange={setSection}
        username={user?.username ?? ''}
        onLogout={onLogout}
      />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
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
