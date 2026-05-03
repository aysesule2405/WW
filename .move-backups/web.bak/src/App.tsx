import { useState } from 'react';
import GameSelectionScreen from './components/GameSelectionScreen';
import SpiritDriftGame from './components/SpiritDriftGame';
import GameExperienceScreen from './components/GameExperienceScreen';
import SpiritSaplingGame from './components/SpiritSaplingGame';

type SelectedGame = 'spirit-drift' | 'delivery-on-the-wind' | 'spirit-sapling' | null;

export default function App() {
  const [selectedGame, setSelectedGame] = useState<SelectedGame>(null);

  const handleSelectGame = (gameId: string) => {
    if (gameId === 'spirit-drift') setSelectedGame('spirit-drift');
    if (gameId === 'delivery-on-the-wind') setSelectedGame('delivery-on-the-wind');
    if (gameId === 'spirit-sapling') setSelectedGame('spirit-sapling');
  };

  const handleExitGame = () => setSelectedGame(null);

  if (selectedGame === 'spirit-drift') {
    return <SpiritDriftGame onExit={handleExitGame} />;
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

  return <GameSelectionScreen onSelect={handleSelectGame} />;
}