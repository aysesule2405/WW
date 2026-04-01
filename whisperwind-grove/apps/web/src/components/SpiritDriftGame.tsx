import { useEffect, useRef } from 'react';
import { createGame } from '../game/createGame';

type Props = {
  onExit: () => void;
};

export default function SpiritDriftGame({ onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<ReturnType<typeof createGame> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    apiRef.current = createGame(containerRef.current);
    // start when scene is ready (createGame now defers safely)
    apiRef.current.start?.();

    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={() => onExit()}>
          ← Back to Grove
        </button>
        <h2 style={styles.heading}>Spirit Drift</h2>
      </div>

      <div ref={containerRef} style={styles.gameWrap} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #F0EAD2 0%, #DDE5B6 55%, #ADC178 100%)',
    padding: 24,
    boxSizing: 'border-box',
  },
  topBar: {
    maxWidth: 1200,
    margin: '0 auto 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  backButton: {
    backgroundColor: '#A98467',
    color: '#F0EAD2',
    border: 'none',
    borderRadius: 12,
    padding: '12px 18px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  heading: {
    color: '#6C584C',
    margin: 0,
  },
  gameWrap: {
    maxWidth: 1200,
    margin: '0 auto',
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 18px 40px rgba(108, 88, 76, 0.18)',
    border: '1px solid rgba(169, 132, 103, 0.2)',
    height: 'min(700px, 76vh)',
  },
};
