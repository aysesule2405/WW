import { useState } from 'react'
import Sidebar from './Sidebar'
import type { SidebarSection } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import ProfilePage from '../../pages/ProfilePage'
import SettingsPage from '../../pages/SettingsPage'
import ProgressPage from '../../pages/ProgressPage'
import GameSelectionScreen from '../GameSelectionScreen'

type Props = {
  onSelect: (id: string) => void
  onLogout: () => void
}

export default function AppShell({ onSelect, onLogout }: Props) {
  const { user } = useAuth()
  const { theme } = useTheme()
  const [section, setSection] = useState<SidebarSection>('games')

  const isDark = theme === 'dark'

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(180deg, #1E2618 0%, #161C11 100%)'
        : 'linear-gradient(180deg, #f6f1de 0%, #e5edd0 52%, #d9e6bf 100%)',
      transition: 'background 250ms ease',
    }}>
      <Sidebar
        active={section}
        onChange={setSection}
        username={user?.username ?? ''}
        onLogout={onLogout}
      />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {section === 'games'    && <GameSelectionScreen onSelect={onSelect} onLogout={onLogout} />}
        {section === 'progress' && <ProgressPage />}
        {section === 'profile'  && <ProfilePage />}
        {section === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}
