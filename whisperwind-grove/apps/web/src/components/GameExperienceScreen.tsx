import React from 'react';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

type Props = {
  title: string;
  subtitle: string;
  backgroundImage: string;
  panelBackgroundImage?: string;
  mode: 'scoreboard' | 'plant-seed';
  onExit: () => void;
};

const panelBase: React.CSSProperties = {
  width: 'min(960px, 92vw)',
  height: 'min(540px, 72vh)',
  aspectRatio: '16 / 9',
  borderRadius: 20,
  padding: 24,
  backdropFilter: 'blur(6px)',
  background: 'rgba(15, 23, 42, 0.42)',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  boxShadow: '0 24px 48px rgba(0,0,0,0.28)',
  color: '#ffffff',
};

function ScoreboardPanel({ panelBackgroundImage }: { panelBackgroundImage?: string }) {
  if (panelBackgroundImage) {
    return (
      <div
        style={{
          ...panelBase,
          background: `url('${panelBackgroundImage}') center/cover no-repeat`,
          border: '1px solid rgba(255, 255, 255, 0.34)',
        }}
      />
    );
  }

  const scores = [
    { player: 'Breeze', score: 420 },
    { player: 'Willow', score: 360 },
    { player: 'Sprout', score: 290 },
  ];

  return (
    <div style={panelBase}>
      <h3 style={{ margin: '0 0 14px', fontSize: 38, fontFamily: headingFontFamily }}>Sky Delivery Score Board</h3>
      <div style={{ display: 'grid', gap: 10 }}>
        {scores.map((entry, index) => (
          <div
            key={entry.player}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.16)',
              fontFamily: bodyFontFamily,
              fontSize: 28,
            }}
          >
            <span>#{index + 1} {entry.player}</span>
            <strong>{entry.score}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlantSeedPanel({ panelBackgroundImage }: { panelBackgroundImage?: string }) {
  if (panelBackgroundImage) {
    return (
      <div
        style={{
          ...panelBase,
          background: `url('${panelBackgroundImage}') center/cover no-repeat`,
          border: '1px solid rgba(255, 255, 255, 0.34)',
        }}
      />
    );
  }

  return (
    <div style={panelBase}>
      <h3 style={{ margin: '0 0 14px', fontSize: 38, fontFamily: headingFontFamily }}>Plant Seed Ritual</h3>
      <p style={{ margin: '0 0 16px', opacity: 0.95, fontSize: 28, fontFamily: bodyFontFamily, lineHeight: 1.35 }}>
        Place your seed in soft soil and keep the wind gentle. Balance sunlight and water to help it grow.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button style={actionBtn}>Add Water</button>
        <button style={actionBtn}>Turn To Sun</button>
        <button style={actionBtn}>Sing To Seed</button>
      </div>
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  border: 'none',
  borderRadius: 10,
  padding: '14px 18px',
  background: '#DDE5B6',
  color: '#243010',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: bodyFontFamily,
  fontSize: 26,
};

export default function GameExperienceScreen({ title, subtitle, backgroundImage, panelBackgroundImage, mode, onExit }: Props) {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        boxSizing: 'border-box',
        background: `linear-gradient(rgba(20, 20, 20, 0.24), rgba(20, 20, 20, 0.24)), url('${backgroundImage}') center/cover no-repeat`,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button
          style={{
            border: 'none',
            borderRadius: 12,
            background: '#A98467',
            color: '#F0EAD2',
            padding: '14px 20px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: bodyFontFamily,
            fontSize: 28,
          }}
          onClick={onExit}
        >
          Back to Grove
        </button>
        <div style={{ color: '#ffffff', textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontFamily: headingFontFamily, fontSize: 44 }}>{title}</h2>
          <p style={{ margin: 0, opacity: 0.9, fontFamily: bodyFontFamily, fontSize: 28 }}>{subtitle}</p>
        </div>
      </div>

      <div style={{ marginTop: 'auto', marginBottom: 'auto', display: 'flex', justifyContent: 'center' }}>
        {mode === 'scoreboard'
          ? <ScoreboardPanel panelBackgroundImage={panelBackgroundImage} />
          : <PlantSeedPanel panelBackgroundImage={panelBackgroundImage} />}
      </div>
    </div>
  );
}