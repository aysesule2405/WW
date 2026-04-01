import { useState } from 'react';
import GameSelectionScreen from './components/GameSelectionScreen';
import SpiritDriftGame from './components/SpiritDriftGame';

type SelectedGame = 'spirit-drift' | 'delivery-on-the-wind' | 'spirit-sapling' | null;

export default function App() {
  const [selectedGame, setSelectedGame] = useState<SelectedGame>(null);

  const handleSelectGame = (gameId: string) => {
    if (gameId === 'spirit-drift') setSelectedGame('spirit-drift');
  };

  const handleExitGame = () => setSelectedGame(null);

  if (selectedGame === 'spirit-drift') {
    return <SpiritDriftGame onExit={handleExitGame} />;
  }

  return <GameSelectionScreen onSelect={handleSelectGame} />;
}