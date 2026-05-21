import { useEffect, useState } from 'react'

function ShellDecor() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }} aria-hidden="true">
      {/* Willow — top corners */}
      <img src="/assets/animation/willow-leaves.gif" alt="" style={{ position:'absolute', top:0, left:-15, width:195, height:'auto', opacity:0.20, animation:'ww-float-gentle 9s ease-in-out 0s infinite', filter:'drop-shadow(0 4px 12px rgba(80,140,60,0.18))' }} />
      <img src="/assets/animation/willow-leaves.gif" alt="" style={{ position:'absolute', top:0, right:-15, width:175, height:'auto', opacity:0.16, animation:'ww-float-gentle 11s ease-in-out 1.5s infinite', filter:'drop-shadow(0 4px 12px rgba(80,140,60,0.16))', transform:'scaleX(-1)' }} />
      {/* Wind — drifting through */}
      <img src="/assets/animation/wind.gif" alt="" style={{ position:'absolute', top:'18%', left:'3%',  width:155, height:'auto', opacity:0.12, animation:'ww-drift 12s ease-in-out 0s   infinite' }} />
      <img src="/assets/animation/wind.gif" alt="" style={{ position:'absolute', top:'52%', right:'5%', width:140, height:'auto', opacity:0.10, animation:'ww-drift 15s ease-in-out 3.5s infinite' }} />
      <img src="/assets/animation/wind.gif" alt="" style={{ position:'absolute', top:'36%', left:'40%', width:120, height:'auto', opacity:0.08, animation:'ww-drift 18s ease-in-out 7s   infinite' }} />
      {/* Shines — sparse scatter */}
      {([
        ['shine-3.gif','10%','17%',52,0.26,'0.5s','6.2s'],['shine-1.gif','7%', '54%',44,0.20,'2.0s','7.0s'],
        ['shine-2.gif','28%','78%',48,0.22,'1.0s','5.8s'],['shine-3.gif','58%','30%',40,0.18,'3.0s','8.0s'],
        ['shine-1.gif','70%','64%',46,0.20,'1.5s','6.5s'],['shine-2.gif','44%','6%', 38,0.16,'4.0s','7.5s'],
        ['shine-3.gif','82%','88%',42,0.18,'2.5s','6.0s'],['shine-1.gif','48%','46%',50,0.22,'0.8s','5.5s'],
      ] as [string,string,string,number,number,string,string][]).map(([src,top,left,w,op,d,dr],i) => (
        <img key={i} src={`/assets/animation/${src}`} alt="" style={{ position:'absolute', top, left, width:w, height:'auto', opacity:op, animation:`ww-twinkle ${dr} ease-in-out ${d} infinite` }} />
      ))}
    </div>
  )
}

function WaterStrip() {
  return (
    <div style={{ position:'fixed', bottom:0, left:0, right:0, height:150, zIndex:0, pointerEvents:'none', overflow:'visible' }} aria-hidden="true">
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 0%, rgba(56,158,146,0.16) 40%, rgba(30,110,102,0.26) 100%)' }} />
      <img src="/assets/animation/lily-leaf-1.gif" alt="" style={{ position:'absolute', bottom:-8,  left:'6%',  width:118, height:'auto', opacity:0.68, animation:'ww-lily-bob 6.2s ease-in-out 0s   infinite', filter:'drop-shadow(0 4px 12px rgba(32,120,80,0.3))'  }} />
      <img src="/assets/animation/lily-leaf-2.gif" alt="" style={{ position:'absolute', bottom:-5,  left:'32%', width:155, height:'auto', opacity:0.60, animation:'ww-lily-bob 7.8s ease-in-out 1.3s infinite', filter:'drop-shadow(0 4px 12px rgba(32,120,80,0.25))' }} />
      <img src="/assets/animation/lily-leaf-1.gif" alt="" style={{ position:'absolute', bottom:-10, left:'60%', width:100, height:'auto', opacity:0.55, animation:'ww-lily-bob 8.5s ease-in-out 2.7s infinite', filter:'drop-shadow(0 4px 12px rgba(32,120,80,0.28))', transform:'scaleX(-1)' }} />
      <img src="/assets/animation/lily-leaf-2.gif" alt="" style={{ position:'absolute', bottom:-6,  left:'80%', width:138, height:'auto', opacity:0.52, animation:'ww-lily-bob 9.2s ease-in-out 4.0s infinite', filter:'drop-shadow(0 4px 12px rgba(32,120,80,0.22))' }} />
    </div>
  )
}

import Sidebar from './Sidebar'
import type { SidebarSection } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import ProfilePage from '../../pages/ProfilePage'
import SettingsPage from '../../pages/SettingsPage'
import ProgressPage from '../../pages/ProgressPage'
import LeaderboardPage from '../../pages/LeaderboardPage'
import AchievementsPage from '../../pages/AchievementsPage'
import CommunityPage from '../../pages/CommunityPage'
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
      <ShellDecor />
      <WaterStrip />
      <Sidebar
        active={section}
        onChange={setSection}
        username={user?.username ?? ''}
        onLogout={onLogout}
      />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0, position: 'relative', zIndex: 1, zoom: ({ sm: 0.9, md: 1.0, lg: 1.12 } as const)[settings.textSize ?? 'md'] }}>
        {section === 'games'       && <GameSelectionScreen onSelect={onSelect} onLogout={onLogout} />}
        {section === 'community'   && <CommunityPage />}
        {section === 'progress'    && <ProgressPage />}
        {section === 'achievements' && <AchievementsPage />}
        {section === 'leaderboard' && <LeaderboardPage />}
        {section === 'profile'     && <ProfilePage />}
        {section === 'settings'    && <SettingsPage />}
      </main>
    </div>
  )
}


