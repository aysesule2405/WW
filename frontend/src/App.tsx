import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import GameSelectionScreen from './components/GameSelectionScreen';
import SpiritDriftGame from './components/SpiritDriftGame';
import GameExperienceScreen from './components/GameExperienceScreen';
import SpiritSaplingGame from './components/SpiritSaplingGame';

type GameView   = 'spirit-drift' | 'delivery-on-the-wind' | 'spirit-sapling';
type RootView   = 'landing' | 'login' | 'register';

function AppContent() {
  const { user, logout } = useAuth();
  const [rootView, setRootView]   = useState<RootView>('landing');
  const [activeGame, setActiveGame] = useState<GameView | null>(null);

  // ── Logged-in: game screens ──────────────────────────────────────────────
  if (user) {
    const exitGame = () => setActiveGame(null);

    if (activeGame === 'spirit-drift') {
      return <SpiritDriftGame onExit={exitGame} />;
    }
    if (activeGame === 'delivery-on-the-wind') {
      return (
        <GameExperienceScreen
          title="Delivery on the Wind"
          subtitle="Race the breeze and climb the daily ranking"
          backgroundImage="/assets/backgrounds/delivery-on-the-wind/game-bg.png"
          panelBackgroundImage="/assets/backgrounds/delivery-on-the-wind/score-board.png"
          mode="scoreboard"
          onExit={exitGame}
        />
      );
    }
    if (activeGame === 'spirit-sapling') {
      return <SpiritSaplingGame onExit={exitGame} />;
    }

    return (
      <GameSelectionScreen
        onSelect={(id) => setActiveGame(id as GameView)}
        onLogout={logout}
      />
    );
  }

  // ── Not logged in: landing → login / register ────────────────────────────
  if (rootView === 'login') {
    return (
      <LoginPage
        onGoToRegister={() => setRootView('register')}
        onGoToLanding={() => setRootView('landing')}
      />
    );
  }

  if (rootView === 'register') {
    return (
      <RegisterPage
        onGoToLogin={() => setRootView('login')}
        onGoToLanding={() => setRootView('landing')}
      />
    );
  }

  return (
    <LandingPage
      onSignIn={() => setRootView('login')}
      onCreateAccount={() => setRootView('register')}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
