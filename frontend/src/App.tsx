import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import LandingPage from './components/LandingPage'
import LoginPage from './components/LoginPage'
import RegisterPage from './components/RegisterPage'
import AppShell from './components/layout/AppShell'
import SpiritDriftGame from './components/SpiritDriftGame'
import DeliveryOnTheWindGame from './games/delivery-on-the-wind/DeliveryOnTheWindGame'
import SpiritSaplingGame from './components/SpiritSaplingGame'
import HalfMoonGame from './games/half-moon/HalfMoonGame'
import { audioManager } from './lib/AudioManager'
import { SETTINGS_EVENT, loadUserSettings } from './lib/userSettings'
import AchievementToast from './components/AchievementToast'

type GameView = 'spirit-drift' | 'delivery-on-the-wind' | 'spirit-sapling' | 'half-moon'
type RootView = 'landing' | 'login' | 'register'

function AppContent() {
  const { user, logout } = useAuth()
  const [rootView, setRootView] = useState<RootView>('landing')
  const [activeGame, setActiveGame] = useState<GameView | null>(null)
  const [settingsTick, setSettingsTick] = useState(0)

  useEffect(() => {
    const refresh = () => setSettingsTick((value) => value + 1)
    window.addEventListener(SETTINGS_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(SETTINGS_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  // Menu music plays whenever the user is logged in and not inside a game.
  // Persists across Settings, Leaderboard, and all other shell tabs.
  useEffect(() => {
    const settings = loadUserSettings()
    document.documentElement.setAttribute('data-reduce-motion', settings.reduceMotion ? 'true' : 'false')
    if (activeGame) return // game components manage their own music
    if (user && settings.music) {
      audioManager.playMusic('menu')
    } else {
      audioManager.stopMusic(600)
    }
  }, [user, activeGame, settingsTick])

  // ── Logged in ──────────────────────────────────────────────────────────────
  if (user) {
    const exitGame = () => setActiveGame(null)
    return (
      <>
        <AchievementToast />
        {activeGame === 'spirit-drift'         && <SpiritDriftGame onExit={exitGame} />}
        {activeGame === 'delivery-on-the-wind' && <DeliveryOnTheWindGame onExit={exitGame} />}
        {activeGame === 'spirit-sapling'       && <SpiritSaplingGame onExit={exitGame} />}
        {activeGame === 'half-moon'            && <HalfMoonGame onExit={exitGame} />}
        {!activeGame && (
          <AppShell
            onSelect={(id) => setActiveGame(id as GameView)}
            onLogout={logout}
          />
        )}
      </>
    )
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (rootView === 'login') {
    return (
      <LoginPage
        onGoToRegister={() => setRootView('register')}
        onGoToLanding={() => setRootView('landing')}
      />
    )
  }

  if (rootView === 'register') {
    return (
      <RegisterPage
        onGoToLogin={() => setRootView('login')}
        onGoToLanding={() => setRootView('landing')}
      />
    )
  }

  return (
    <LandingPage
      onSignIn={() => setRootView('login')}
      onCreateAccount={() => setRootView('register')}
    />
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}
