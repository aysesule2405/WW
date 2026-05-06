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

type GameView = 'spirit-drift' | 'delivery-on-the-wind' | 'spirit-sapling' | 'half-moon'
type RootView = 'landing' | 'login' | 'register'

function AppContent() {
  const { user, logout } = useAuth()
  const [rootView, setRootView] = useState<RootView>('landing')
  const [activeGame, setActiveGame] = useState<GameView | null>(null)

  // Menu music plays whenever the user is logged in and not inside a game.
  // Persists across Settings, Leaderboard, and all other shell tabs.
  useEffect(() => {
    if (user && !activeGame) {
      audioManager.playMusic('menu', 0.35)
    } else {
      audioManager.stopMusic(600)
    }
  }, [user, activeGame])

  // ── Logged in ──────────────────────────────────────────────────────────────
  if (user) {
    const exitGame = () => setActiveGame(null)

    if (activeGame === 'spirit-drift')        return <SpiritDriftGame onExit={exitGame} />
    if (activeGame === 'delivery-on-the-wind') return <DeliveryOnTheWindGame onExit={exitGame} />
    if (activeGame === 'spirit-sapling')      return <SpiritSaplingGame onExit={exitGame} />
    if (activeGame === 'half-moon')           return <HalfMoonGame onExit={exitGame} />

    return (
      <AppShell
        onSelect={(id) => setActiveGame(id as GameView)}
        onLogout={logout}
      />
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
