import { useState, useEffect } from 'react';
import GameSelectionScreen from './components/GameSelectionScreen';
import SpiritDriftGame from './components/SpiritDriftGame';
import GameExperienceScreen from './components/GameExperienceScreen';
import SpiritSaplingGame from './components/SpiritSaplingGame';
import LoginPage from './components/Auth/LoginPage';
import api from './lib/api'
import SiteHeader from './components/SiteHeader'
import MyProgress from './components/MyProgress'
import ProfileModal from './components/ProfileModal'

type SelectedGame = 'spirit-drift' | 'delivery-on-the-wind' | 'spirit-sapling' | 'login' | 'my-progress' | null;

export default function App() {
  const [selectedGame, setSelectedGame] = useState<SelectedGame>(null);
  const [username, setUsername] = useState<string | null>(() => api.getUsername())
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // fetch profile on mount if token present
  useEffect(() => {
    const token = api.getToken()
    if (!token) return
    ;(async () => {
      try {
        const res = await fetch('/api/users/profile', { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (!data?.error) {
          setUsername(data.username || api.getUsername())
          setAvatarUrl(data.avatarUrl || null)
        }
      } catch (err) {
        console.warn('Failed to fetch profile', err)
      }
    })()
  }, [])

  const handleSelectGame = (gameId: string) => {
    if (gameId === 'spirit-drift') setSelectedGame('spirit-drift');
    if (gameId === 'delivery-on-the-wind') setSelectedGame('delivery-on-the-wind');
    if (gameId === 'spirit-sapling') setSelectedGame('spirit-sapling');
  };

  const handleExitGame = () => setSelectedGame(null);

  const handleLogout = () => {
    api.logout()
    setUsername(null)
    setSelectedGame(null)
  }

  const openProgress = () => setSelectedGame('my-progress')

  const openLogin = () => setShowLoginModal(true)
  const openProfile = () => setShowProfileModal(true)

  if (selectedGame === 'spirit-drift') {
    return <SpiritDriftGame onExit={handleExitGame} />;
  }

  const closeLogin = () => setShowLoginModal(false)

  const loginSuccess = () => {
    setUsername(api.getUsername())
    setShowLoginModal(false)
  }

  if (selectedGame === 'my-progress') {
    return (
      <div>
  <SiteHeader username={username} onLogin={openLogin} onLogout={handleLogout} onOpenProgress={openProgress} avatarUrl={avatarUrl} />
        <MyProgress />
      </div>
    )
  }

  if (selectedGame === 'delivery-on-the-wind') {
    return (
      <GameExperienceScreen
        title="Delivery on the Wind"
        subtitle="Race the breeze and climb the daily ranking"
        backgroundImage="/assets/backgrounds/delivery-on-the-wind/game-bg.png"
        panelBackgroundImage="/assets/backgrounds/delivery-on-the-wind/score-board.png"
        mode="scoreboard"
        onExit={handleExitGame}
      />
    );
  }

  if (selectedGame === 'spirit-sapling') {
    return <SpiritSaplingGame onExit={handleExitGame} />;
  }

  return (
    <div>
  <SiteHeader username={username} onLogin={openLogin} onLogout={handleLogout} onOpenProgress={openProgress} onOpenProfile={openProfile} avatarUrl={avatarUrl} />
      <GameSelectionScreen onSelect={handleSelectGame} />

      {showLoginModal ? (
        <LoginPage modal onClose={closeLogin} onSuccess={loginSuccess} />
      ) : null}

      {showProfileModal ? (
        <ProfileModal onClose={() => setShowProfileModal(false)} onSave={(url) => setAvatarUrl(url)} />
      ) : null}
    </div>
  );
}