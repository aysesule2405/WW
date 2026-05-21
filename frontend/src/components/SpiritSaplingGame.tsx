import { useEffect, useMemo, useRef, useState } from 'react';
import { uiFontFamily, titleFontFamily, numberFontFamily } from '../theme/typography';
import { apiUrl, getToken, submitSession } from '../lib/api';
import { audioManager } from '../lib/AudioManager';
import GameShell from './game/GameShell';
import GameDescriptionPanel from '../games/spirit-sapling/GameDescriptionPanel';
import TalkToSaplingPanel from '../games/spirit-sapling/TalkToSaplingPanel';
import { useGameMusic } from '../hooks/useGameMusic';

const bodyFontFamily    = uiFontFamily
const headingFontFamily = titleFontFamily

type Props = {
  onExit: () => void;
};

type GuardianId = 'deer' | 'fox' | 'kodama' | 'mononoke';

type Guardian = {
  id: GuardianId;
  name: string;
  image: string;
  talkButton: string;
  fruitTree: string;
  fruitBasket: string;
  sacredTreeName: string;
  harvestName: string;
};

const guardians: Guardian[] = [
  {
    id: 'deer',
    name: 'Deer',
    image: '/assets/backgrounds/spirit-sapling/guardians/deer-guardian.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/deer-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/peach-deer.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-peach.png',
    sacredTreeName: 'Peach Tree',
    harvestName: 'peaches',
  },
  {
    id: 'fox',
    name: 'Fox',
    image: '/assets/backgrounds/spirit-sapling/guardians/fox-guardian.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/fox-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/persimmon-fox.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-persimmon.png',
    sacredTreeName: 'Persimmon Tree',
    harvestName: 'persimmons',
  },
  {
    id: 'kodama',
    name: 'Kodama',
    image: '/assets/backgrounds/spirit-sapling/guardians/kodama-guardian.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/kodama-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/pear-kodama.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-pear.png',
    sacredTreeName: 'Pear Tree',
    harvestName: 'pears',
  },
  {
    id: 'mononoke',
    name: 'Mononoke',
    image: '/assets/backgrounds/spirit-sapling/guardians/mononoke-guardian.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/mononoke-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/apple-mononoke.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-apple.png',
    sacredTreeName: 'Apple Tree',
    harvestName: 'apples',
  },
];

const baseGrowthStages = [
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-1.png',
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-2.png',
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-3.png',
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-4.png',
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-5.png',
];

const basketButtonImage = '/assets/backgrounds/spirit-sapling/baskets/basket.png';

const dropletOffsets = [12, 20, 28, 36, 44, 52, 60, 68, 76, 84];

const BASE_ENERGY_RECHARGE_SECONDS = 20;
const MIN_ENERGY_RECHARGE_SECONDS = 8;
const MAX_ENERGY_RECHARGE_SECONDS = 40;
const energyFrames = [
  '/assets/animation/energy/energy-0.png',
  '/assets/animation/energy/energy-25.png',
  '/assets/animation/energy/energy-50.png',
  '/assets/animation/energy/energy-75.png',
  '/assets/animation/energy/energy-100.png',
];

type GameScreen = 'description' | 'selection' | 'game' | 'results';
type SaplingEffect = 'water' | 'sun' | 'talk' | null;
type SaplingAction = Exclude<SaplingEffect, null> | 'harvest';

export default function SpiritSaplingGame({ onExit }: Props) {
  useGameMusic('spirit-sapling');

  const [screen, setScreen] = useState<GameScreen>('description');
  const [selectedGuardianId, setSelectedGuardianId] = useState<GuardianId>('deer');
  const [stageIndex, setStageIndex] = useState(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [spokenLine, setSpokenLine] = useState('');
  const [energyElapsedSeconds, setEnergyElapsedSeconds] = useState(BASE_ENERGY_RECHARGE_SECONDS);
  const [energyRechargeSeconds, setEnergyRechargeSeconds] = useState(BASE_ENERGY_RECHARGE_SECONDS);
  const [growthImageReady, setGrowthImageReady] = useState<Record<string, boolean>>({});
  const [activeEffect, setActiveEffect] = useState<SaplingEffect>(null);
  const [activeAction, setActiveAction] = useState<SaplingAction | null>(null);
  const [effectKey, setEffectKey] = useState(0);
  const [previousStageIndex, setPreviousStageIndex] = useState<number | null>(null);
  const [hasCollectedFruit, setHasCollectedFruit] = useState(false);
  const [harvestedGuardianId, setHarvestedGuardianId] = useState<GuardianId | null>(null);
  const [harvestScore, setHarvestScore] = useState<number | null>(null);
  const [showTalkPanel, setShowTalkPanel] = useState(false);
  const [talkBoostTotal, setTalkBoostTotal] = useState(0);
  const waterCountRef = useRef(0);
  const sunCountRef   = useRef(0);
  const talkCountRef  = useRef(0);
  const effectTimerRef = useRef<number | null>(null);
  const stageTransitionTimerRef = useRef<number | null>(null);
  const growthDelayTimerRef = useRef<number | null>(null);
  const activeActionTimerRef = useRef<number | null>(null);
  const energyTickTimerRef = useRef<number | null>(null);
  const growthImageReadyRef = useRef<Record<string, boolean>>({});

  const selectedGuardian = useMemo(
    () => guardians.find((guardian) => guardian.id === selectedGuardianId) ?? guardians[0],
    [selectedGuardianId],
  );
  const harvestedGuardian = useMemo(
    () => guardians.find((guardian) => guardian.id === harvestedGuardianId) ?? null,
    [harvestedGuardianId],
  );
  const growthStages = useMemo(
    () => [...baseGrowthStages, selectedGuardian.fruitTree],
    [selectedGuardian.fruitTree],
  );
  const growthStageAssets = useMemo(
    () => [...baseGrowthStages, ...guardians.map((guardian) => guardian.fruitTree)],
    [],
  );

  const atFinalStage = stageIndex >= growthStages.length - 1;
  const canCollectFruit = atFinalStage && !hasCollectedFruit && previousStageIndex === null && !isTalking;
  const isRecharging = energyElapsedSeconds < energyRechargeSeconds;
  const energyPercent = Math.min(100, Math.round((energyElapsedSeconds / energyRechargeSeconds) * 100));
  const energyFrameIndex = Math.min(4, Math.floor((energyPercent / 100) * 4));
  const currentStageSrc = growthStages[stageIndex];
  const isCurrentStageLoaded = Boolean(growthImageReady[currentStageSrc]);

  useEffect(() => {
    growthImageReadyRef.current = growthImageReady;
  }, [growthImageReady]);

  useEffect(() => {
    let cancelled = false;

    growthStageAssets.forEach((src) => {
      const image = new Image();
      image.decoding = 'async';
      image.src = src;
      image.onload = () => {
        if (cancelled) return;
        setGrowthImageReady((current) => (current[src] ? current : { ...current, [src]: true }));
      };
      image.onerror = () => {
        // Treat error as ready to avoid blocking transition cleanup forever.
        if (cancelled) return;
        setGrowthImageReady((current) => (current[src] ? current : { ...current, [src]: true }));
      };
    });

    return () => {
      cancelled = true;
    };
  }, [growthStageAssets]);

  const advanceGrowth = () => {
    if (atFinalStage) return;
    setStageIndex((current) => {
      const next = Math.min(current + 1, growthStages.length - 1);
      if (next !== current) {
        setPreviousStageIndex(current);
        setTransitionKey((value) => value + 1);
        if (stageTransitionTimerRef.current) {
          window.clearTimeout(stageTransitionTimerRef.current);
        }
        const nextStageSrc = growthStages[next];
        const clearPreviousWhenReady = () => {
          if (growthImageReadyRef.current[nextStageSrc]) {
            setPreviousStageIndex(null);
            stageTransitionTimerRef.current = null;
            return;
          }

          stageTransitionTimerRef.current = window.setTimeout(clearPreviousWhenReady, 120);
        };

        stageTransitionTimerRef.current = window.setTimeout(clearPreviousWhenReady, 900);
      }
      return next;
    });
  };

  const triggerEffect = (effect: Exclude<SaplingEffect, null>, durationMs: number) => {
    setActiveEffect(effect);
    setEffectKey((value) => value + 1);
    if (effectTimerRef.current) {
      window.clearTimeout(effectTimerRef.current);
    }
    effectTimerRef.current = window.setTimeout(() => {
      setActiveEffect(null);
      effectTimerRef.current = null;
    }, durationMs);
  };

  useEffect(() => {
    return () => {
      if (effectTimerRef.current) {
        window.clearTimeout(effectTimerRef.current);
      }
      if (stageTransitionTimerRef.current) {
        window.clearTimeout(stageTransitionTimerRef.current);
      }
      if (growthDelayTimerRef.current) {
        window.clearTimeout(growthDelayTimerRef.current);
      }
      if (activeActionTimerRef.current) {
        window.clearTimeout(activeActionTimerRef.current);
      }
      if (energyTickTimerRef.current) {
        window.clearInterval(energyTickTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (screen !== 'game' || atFinalStage || energyElapsedSeconds >= energyRechargeSeconds) {
      if (energyTickTimerRef.current) {
        window.clearInterval(energyTickTimerRef.current);
        energyTickTimerRef.current = null;
      }
      return;
    }

    energyTickTimerRef.current = window.setInterval(() => {
      setEnergyElapsedSeconds((current) => Math.min(energyRechargeSeconds, current + 1));
    }, 1000);

    return () => {
      if (energyTickTimerRef.current) {
        window.clearInterval(energyTickTimerRef.current);
        energyTickTimerRef.current = null;
      }
    };
  }, [screen, atFinalStage, energyElapsedSeconds, energyRechargeSeconds]);

  const scheduleGrowthAdvance = (delayMs: number) => {
    if (growthDelayTimerRef.current) {
      window.clearTimeout(growthDelayTimerRef.current);
    }
    growthDelayTimerRef.current = window.setTimeout(() => {
      advanceGrowth();
      growthDelayTimerRef.current = null;
    }, delayMs);
  };

  const resetEnergyOnNurture = () => {
    setEnergyElapsedSeconds(0);
  };

  const canUseNurtureAction = !isTalking && !isRecharging && !atFinalStage && !hasCollectedFruit;

  const handleSunOrWaterAction = (action: Extract<SaplingAction, 'sun' | 'water'>) => {
    if (!canUseNurtureAction) return;

    if (action === 'water') waterCountRef.current += 1;
    else sunCountRef.current += 1;

    const effectDuration = action === 'water' ? 1900 : 1800;
    const growthDelay = action === 'water' ? 780 : 680;

    if (action === 'water') audioManager.playWater(0.22);
    else audioManager.playSun(0.18);

    resetEnergyOnNurture();
    setActiveAction(action);
    triggerEffect(action, effectDuration);
    scheduleGrowthAdvance(growthDelay);
    if (activeActionTimerRef.current) {
      window.clearTimeout(activeActionTimerRef.current);
    }
    activeActionTimerRef.current = window.setTimeout(() => {
      setActiveAction(null);
      activeActionTimerRef.current = null;
    }, 1050);
  };

  const handleHearGuardian = async () => {
    if (isTalking) return;
    talkCountRef.current += 1;
    resetEnergyOnNurture();
    setActiveAction('talk');
    triggerEffect('talk', 3600);
    audioManager.playSoftChime(0.12);
    await speakGuardian();
    advanceGrowth();
    setActiveAction(null);
  };

  const handleSaplingEnergyEvaluated = ({
    energyDeltaSeconds,
    growthBoost,
  }: {
    sentiment: 'positive' | 'negative' | 'neutral';
    energyDeltaSeconds: number;
    growthBoost: number;
  }) => {
    if (growthBoost > 0) {
      setTalkBoostTotal((prev) => prev + growthBoost);
      talkCountRef.current += 1;
    }

    setEnergyRechargeSeconds((current) =>
      Math.min(
        MAX_ENERGY_RECHARGE_SECONDS,
        Math.max(MIN_ENERGY_RECHARGE_SECONDS, current + energyDeltaSeconds),
      )
    );
  };

  const handleCollectFruit = async () => {
    if (!canCollectFruit) return;

    const harmonyBonus = waterCountRef.current > 0 && sunCountRef.current > 0 && talkCountRef.current > 0;
    const score = 50 + 10 + (harmonyBonus ? 20 : 0) + talkBoostTotal * 5;

    setActiveAction('harvest');
    setHarvestedGuardianId(selectedGuardianId);
    setHarvestScore(score);

    await submitSession('spirit-sapling', {
      completed: true,
      won: true,
      score,
      guardianId: selectedGuardianId,
      growthStageReached: 'full',
      waterActions: waterCountRef.current,
      sunActions:   sunCountRef.current,
      talkActions:  talkCountRef.current,
      harmonyBonus,
      saplingsGrown: 1,
      fruitsCollected: 1,
    });
    window.setTimeout(() => {
      setHasCollectedFruit(true);
      setScreen('results');
      setActiveAction(null);
    }, 220);
  };

  const guardianLines: Record<GuardianId, string[]> = {
    deer: [
      'Grow gently, little one. Every morning breeze carries your strength.',
      'Roots below, leaves above. You are safe in this grove.',
      'The dew remembers you. Drink deep and reach for the sky.',
      'Still waters nourish the deepest roots. Trust your quiet growth.',
    ],
    fox: [
      'Wake up, sprout. The sun has stories for your leaves today.',
      'Stretch and sparkle. The wind already knows your name.',
      'Mischief and moonlight made you. Now dazzle the whole grove!',
      'Every trickster knows — the brightest flame grows from the smallest spark.',
    ],
    kodama: [
      'Spirit child, drink the light and listen to the earth song.',
      'You rise with the forest heartbeat. Keep growing.',
      'The old trees lean in to whisper your name. They have waited long.',
      'Between breath and root, you belong. Grow on, gentle spirit.',
    ],
    mononoke: [
      'Stand proud, sapling. Even storms must bow to your roots.',
      'Take this breath of power and bloom into your true form.',
      'You are forged from wild things. Let nothing tame your branches.',
      'The mountain watches. Show it the strength that lives inside you.',
    ],
  };

  const getTalkLine = (guardianId: GuardianId, currentStage: number) => {
    const lines = guardianLines[guardianId];
    return lines[currentStage % lines.length];
  };

  const speakGuardian = async () => {
    if (isTalking) return;

    const line = getTalkLine(selectedGuardianId, stageIndex);
    const startedAt = Date.now();
    const minTalkAndSubtitleMs = 3000;
    setIsTalking(true);
    setSpokenLine('…');

    try {
      const token = getToken();
      const response = await fetch(apiUrl('/tts/guardian'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          guardianId: selectedGuardianId,
          text: line,
        }),
      });

      setSpokenLine(line);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error(`[TTS] Request failed (HTTP ${response.status}): ${errBody}`);
        return;
      }

      const voiceId = response.headers.get('X-ElevenLabs-Voice-Id');
      const modelId = response.headers.get('X-ElevenLabs-Model-Id');
      if (voiceId || modelId) {
        console.info(`[TTS] ElevenLabs guardian=${selectedGuardianId} voice=${voiceId ?? 'unknown'} model=${modelId ?? 'unknown'}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const voice = new Audio(audioUrl);

      await voice.play();
      await new Promise<void>((resolve) => {
        voice.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
        voice.onerror = () => { URL.revokeObjectURL(audioUrl); resolve(); };
      });
    } catch (error) {
      setSpokenLine(line);
      console.warn('Failed to play ElevenLabs guardian voice:', error);
    } finally {
      const elapsedMs = Date.now() - startedAt;
      const holdMs = Math.max(0, minTalkAndSubtitleMs - elapsedMs);
      if (holdMs > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, holdMs));
      }
      setIsTalking(false);
      setSpokenLine('');
    }
  };

  const restartJourney = () => {
    setStageIndex(0);
    setEnergyElapsedSeconds(BASE_ENERGY_RECHARGE_SECONDS);
    setEnergyRechargeSeconds(BASE_ENERGY_RECHARGE_SECONDS);
    setTransitionKey((value) => value + 1);
    setPreviousStageIndex(null);
    setHasCollectedFruit(false);
    setHarvestedGuardianId(null);
    setHarvestScore(null);
    setTalkBoostTotal(0);
    setShowTalkPanel(false);
    waterCountRef.current = 0;
    sunCountRef.current   = 0;
    talkCountRef.current  = 0;
    setActiveAction(null);
    setActiveEffect(null);
    setIsTalking(false);
    setSpokenLine('');
    setScreen('game');
  };

  const SHELL_BG = "linear-gradient(rgba(20,20,20,0.2),rgba(20,20,20,0.2)), url('/assets/backgrounds/spirit-sapling/game-bg.png') center/cover no-repeat";
  const actionButtons = (
    <div style={styles.buttonRow}>
      <button
        type="button"
        style={{
          ...styles.iconButton,
          ...styles.talkSaplingButton,
          opacity: isTalking ? 0.55 : 1,
        }}
        onClick={() => setShowTalkPanel(true)}
        disabled={isTalking}
      >
        <span style={styles.buttonEmoji}>💬</span>
        <span style={styles.actionLabel}>Talk to Sapling</span>
        <span style={styles.actionHint}>Kind words help it grow</span>
      </button>
      <button
        type="button"
        style={{
          ...styles.iconButton,
          ...styles.talkButton,
          opacity: (isRecharging || isTalking) && activeAction !== 'talk' ? 0.55 : 1,
          boxShadow: activeAction === 'talk'
            ? '0 0 18px rgba(236, 206, 145, 0.78), 0 0 32px rgba(236, 206, 145, 0.34)'
            : '0 8px 18px rgba(0,0,0,0.22)',
          transform: activeAction === 'talk' ? 'translateX(2px) scale(1.03)' : 'translateX(0) scale(1)',
        }}
        onClick={handleHearGuardian}
        disabled={!canUseNurtureAction}
      >
        <img src={selectedGuardian.talkButton} alt={`Hear ${selectedGuardian.name}`} style={styles.buttonArt} />
        <span style={styles.actionLabel}>Hear {selectedGuardian.name}</span>
        <span style={styles.actionHint}>Guardian speaks</span>
      </button>
      <button
        type="button"
        style={{
          ...styles.iconButton,
          ...styles.waterButton,
          opacity: (isRecharging || isTalking) && activeAction !== 'water' ? 0.55 : 1,
          boxShadow: activeAction === 'water'
            ? '0 0 18px rgba(108, 177, 231, 0.82), 0 0 28px rgba(108, 177, 231, 0.32)'
            : '0 8px 18px rgba(0,0,0,0.22)',
          transform: activeAction === 'water' ? 'translateX(2px) scale(1.03)' : 'translateX(0) scale(1)',
        }}
        onClick={() => handleSunOrWaterAction('water')}
        disabled={!canUseNurtureAction}
      >
        <img src="/assets/backgrounds/spirit-sapling/buttons/water-bucket-button.png" alt="Water bucket" style={styles.buttonArt} />
        <span style={styles.actionLabel}>Water</span>
        <span style={styles.actionHint}>Rain blessing</span>
      </button>
      <button
        type="button"
        style={{
          ...styles.iconButton,
          ...styles.sunButton,
          opacity: (isRecharging || isTalking) && activeAction !== 'sun' ? 0.55 : 1,
          boxShadow: activeAction === 'sun'
            ? '0 0 18px rgba(255, 208, 99, 0.86), 0 0 28px rgba(255, 208, 99, 0.36)'
            : '0 8px 18px rgba(0,0,0,0.22)',
          transform: activeAction === 'sun' ? 'translateX(2px) scale(1.03)' : 'translateX(0) scale(1)',
        }}
        onClick={() => handleSunOrWaterAction('sun')}
        disabled={!canUseNurtureAction}
      >
        <img src="/assets/backgrounds/spirit-sapling/buttons/sun-light-button.png" alt="Sun light" style={styles.buttonArt} />
        <span style={styles.actionLabel}>Sun</span>
        <span style={styles.actionHint}>Warm leaves</span>
      </button>
    </div>
  );

  if (screen === 'description') {
    return (
      <GameShell title="Spirit Sapling" onExit={onExit} background={SHELL_BG} accentColor="#F0EAD2">
        <GameDescriptionPanel onContinue={() => setScreen('selection')} />
      </GameShell>
    );
  }

  if (screen === 'selection') {
    return (
      <GameShell title="Spirit Sapling" onExit={onExit} background={SHELL_BG} accentColor="#F0EAD2">
        <div style={styles.selectionWrap}>
          <div style={styles.selectionCard}>
            <h3 style={styles.selectionTitle}>Choose Your Guardian</h3>
            <p style={styles.selectionSubtitle}>Pick the spirit companion that will guide your sapling.</p>

            <div style={styles.guardianGrid}>
              {guardians.map((guardian) => {
                const selected = guardian.id === selectedGuardianId;
                return (
                  <button
                    key={guardian.id}
                    type="button"
                    onClick={() => setSelectedGuardianId(guardian.id)}
                    style={{
                      ...styles.guardianChoice,
                      border: selected ? '3px solid #F2CC8F' : '2px solid rgba(255,255,255,0.4)',
                      backgroundColor: selected ? 'rgba(110, 86, 66, 0.48)' : 'rgba(34, 48, 33, 0.35)',
                    }}
                  >
                    <img src={guardian.image} alt={guardian.name} style={styles.guardianChoiceImage} />
                    <span style={styles.guardianChoiceLabel}>{guardian.name}</span>
                  </button>
                );
              })}
            </div>

            <div style={styles.selectionActions}>
              <button type="button" style={styles.ghostAction} onClick={() => setScreen('description')}>
                ← Back
              </button>
              <button type="button" style={styles.primaryAction} onClick={() => setScreen('game')}>
                Begin Nurturing
              </button>
            </div>
          </div>
        </div>
      </GameShell>
    );
  }

  if (screen === 'results' && harvestedGuardian) {
    return (
      <GameShell title="Spirit Sapling" onExit={onExit}
        background="linear-gradient(rgba(20,20,20,0.2),rgba(20,20,20,0.2)), url('/assets/backgrounds/spirit-sapling/game-bg.png') center/cover no-repeat"
        accentColor="#F0EAD2"
      >
        <div style={styles.celebrationWrap}>
          <div style={styles.celebrationCard}>
            <p style={styles.celebrationOverline}>Sacred Harvest Gathered</p>
            <p style={styles.celebrationSubtitle}>
              Guided by {harvestedGuardian.name}, your spirit sapling matured into a sacred tree and filled the basket with {harvestedGuardian.harvestName}.
            </p>

            {harvestScore !== null && (
              <div style={styles.scoreBreakdown}>
                <div style={styles.scoreRow}>
                  <span style={styles.scoreDetail}>Fully grown</span>
                  <span style={styles.scoreDetail}>+50</span>
                </div>
                <div style={styles.scoreRow}>
                  <span style={styles.scoreDetail}>Harvest gathered</span>
                  <span style={styles.scoreDetail}>+10</span>
                </div>
                {(harvestScore - talkBoostTotal * 5) >= 80 && (
                  <div style={styles.scoreRow}>
                    <span style={styles.scoreDetail}>Harmony bonus ✨</span>
                    <span style={styles.scoreDetail}>+20</span>
                  </div>
                )}
                {talkBoostTotal > 0 && (
                  <div style={styles.scoreRow}>
                    <span style={styles.scoreDetail}>Kind words 💚 ×{talkBoostTotal}</span>
                    <span style={styles.scoreDetail}>+{talkBoostTotal * 5}</span>
                  </div>
                )}
                <div style={{ ...styles.scoreRow, ...styles.scoreTotalRow }}>
                  <span style={styles.scoreTotalLabel}>Total Score</span>
                  <span style={styles.scoreTotalValue}>{harvestScore} pts</span>
                </div>
              </div>
            )}

            <div style={styles.celebrationVisualArea}>
              <img
                src={harvestedGuardian.fruitBasket}
                alt={`Basket of ${harvestedGuardian.harvestName}`}
                style={styles.celebrationBasket}
              />
              <div style={styles.celebrationResultText}>
                <span style={styles.celebrationResultKicker}>Harvest Complete</span>
                <span style={styles.celebrationResultMain}>{harvestedGuardian.harvestName} gathered</span>
              </div>
              <img src={harvestedGuardian.image} alt={harvestedGuardian.name} style={styles.celebrationGuardian} />
            </div>

            <div style={styles.celebrationActions}>
              <button type="button" style={styles.celebrationPrimaryAction} onClick={restartJourney}>
                Plant Another Sapling
              </button>
              <button
                type="button"
                style={styles.celebrationSecondaryAction}
                onClick={() => {
                  restartJourney();
                  setScreen('selection');
                }}
              >
                Choose New Guardian
              </button>
            </div>
          </div>
        </div>
      </GameShell>
    );
  }

  return (
    <GameShell title="Spirit Sapling" onExit={onExit} background={SHELL_BG} accentColor="#F0EAD2">
      {showTalkPanel && (
        <TalkToSaplingPanel
          guardianName={selectedGuardian.name}
          onClose={() => setShowTalkPanel(false)}
          onEnergyEvaluated={handleSaplingEnergyEvaluated}
        />
      )}
      <div style={styles.gameLayout}>
        <div style={styles.saplingPanel}>
          <div style={styles.saplingFrame}>
            {previousStageIndex !== null ? (
              <img
                key={`previous-${previousStageIndex}-${transitionKey}`}
                src={growthStages[previousStageIndex]}
                alt={`Sapling growth stage ${previousStageIndex + 1}`}
                style={isCurrentStageLoaded ? styles.saplingImagePrevious : styles.saplingImagePreviousHold}
              />
            ) : null}
            <img
              key={`current-${stageIndex}-${transitionKey}`}
              src={currentStageSrc}
              alt={`Sapling growth stage ${stageIndex + 1}`}
              style={isCurrentStageLoaded ? styles.saplingImageCurrent : styles.saplingImageCurrentHidden}
              onLoad={() => {
                setGrowthImageReady((current) => (current[currentStageSrc] ? current : { ...current, [currentStageSrc]: true }));
              }}
            />
            {activeEffect === 'sun' ? (
              <div key={`sun-${effectKey}`} style={styles.sunOverlay}>
                <div style={styles.sunRays} />
                <div style={styles.sunGlow} />
              </div>
            ) : null}
            {activeEffect === 'water' ? (
              <div key={`water-${effectKey}`} style={styles.waterOverlay}>
                {dropletOffsets.map((left, index) => (
                  <span
                    key={`${left}-${effectKey}`}
                    style={{
                      ...styles.waterDroplet,
                      left: `${left}%`,
                      animationDelay: `${index * 90}ms`,
                      animationName: index % 2 === 0 ? 'water-drop-scrapbook-a' : 'water-drop-scrapbook-b',
                      animationDuration: `${1450 + (index % 3) * 180}ms`,
                    }}
                  />
                ))}
              </div>
            ) : null}
            {activeEffect === 'talk' || isTalking ? (
              <div key={`talk-${effectKey}`} style={styles.talkAuraWrap}>
                <span style={styles.talkAuraRing} />
                <span style={{ ...styles.talkAuraRing, animationDelay: '170ms' }} />
              </div>
            ) : null}
            {isTalking && spokenLine ? (
              <div style={styles.subtitleBubble}>
                <strong style={styles.subtitleSpeaker}>{selectedGuardian.name}:</strong>
                <span>{spokenLine}</span>
              </div>
            ) : null}
            <div style={styles.stagePill}>
              Stage {stageIndex + 1} / {growthStages.length}
            </div>
            <div style={styles.energyPanel}>
              <img src={energyFrames[energyFrameIndex]} alt={`Energy at ${energyPercent}%`} style={styles.energyFrame} />
              <div style={styles.energyTextWrap}>
                <p style={styles.energyLabel}>Sapling Energy {energyPercent}%</p>
                <p style={styles.energyHint}>
                  {isRecharging
                    ? `Energizing... ready in ${energyRechargeSeconds - energyElapsedSeconds}s`
                    : `Fully energized. Next recharge: ${energyRechargeSeconds}s.`}
                </p>
              </div>
            </div>
            {!canCollectFruit ? actionButtons : null}
            {canCollectFruit ? (
              <div style={styles.harvestRow}>
                <button
                  type="button"
                  style={{
                    ...styles.collectButton,
                    boxShadow: activeAction === 'harvest'
                      ? '0 0 18px rgba(242, 204, 143, 0.8), 0 0 30px rgba(242, 204, 143, 0.34)'
                      : '0 8px 18px rgba(0,0,0,0.24)',
                    transform: activeAction === 'harvest' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                  }}
                  onClick={handleCollectFruit}
                >
                  <img src={basketButtonImage} alt="Collect fruit basket" style={styles.collectButtonArt} />
                  <span style={styles.collectLabel}>Collect Fruits</span>
                </button>
              </div>
            ) : null}
          </div>

          <p style={styles.statusText}>
            {canCollectFruit
              ? `Your ${selectedGuardian.sacredTreeName.toLowerCase()} is ready. Select the basket to gather the ${selectedGuardian.harvestName}.`
              : atFinalStage
              ? `${selectedGuardian.name} has guided the sapling into its sacred tree form.`
              : 'Use any nurturing action to guide the sapling into its next stage.'}
          </p>
        </div>

        <aside style={styles.guardianRail}>
          {guardians.map((guardian) => {
            const active = guardian.id === selectedGuardianId;
            return (
              <button
                key={guardian.id}
                type="button"
                onClick={() => setSelectedGuardianId(guardian.id)}
                style={{
                  ...styles.guardianRailButton,
                  border: active ? '3px solid #F2CC8F' : '2px solid rgba(255,255,255,0.36)',
                  background: active ? 'rgba(120, 87, 49, 0.48)' : 'rgba(43, 56, 37, 0.32)',
                }}
              >
                <img src={guardian.image} alt={guardian.name} style={styles.guardianRailImage} />
              </button>
            );
          })}
        </aside>
      </div>
    </GameShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // page and topBar are now provided by GameShell
  page:   {},
  topBar: {
    maxWidth: 1920,
    margin: '0 auto 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  backButton: {},
  heading: {},
  selectionWrap: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  selectionCard: {
    width: 'min(800px, 96vw)',
    borderRadius: 22,
    padding: '20px 24px',
    background: 'rgba(45, 30, 22, 0.72)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.22)',
    boxShadow: '0 20px 42px rgba(0,0,0,0.45)',
  },
  selectionTitle: {
    margin: 0,
    color: '#F0EAD2',
    textAlign: 'center',
    fontFamily: headingFontFamily,
    fontSize: 28,
  },
  selectionSubtitle: {
    margin: '6px 0 16px',
    color: 'rgba(240,234,210,0.8)',
    textAlign: 'center',
    fontFamily: bodyFontFamily,
    fontSize: 14,
  },
  guardianGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  },
  guardianChoice: {
    borderRadius: 12,
    padding: '10px 8px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  guardianChoiceImage: {
    width: '100%',
    maxWidth: 100,
    aspectRatio: '1 / 1',
    objectFit: 'contain',
  },
  guardianChoiceLabel: {
    fontFamily: bodyFontFamily,
    color: '#F0EAD2',
    fontSize: 14,
    fontWeight: 600,
  },
  selectionActions: {
    marginTop: 16,
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
  primaryAction: {
    border: 'none',
    borderRadius: 11,
    background: '#DDE5B6',
    color: '#3B4A20',
    fontFamily: bodyFontFamily,
    fontSize: 15,
    fontWeight: 700,
    padding: '11px 24px',
    cursor: 'pointer',
  },
  ghostAction: {
    border: '1px solid rgba(240,234,210,0.3)',
    borderRadius: 11,
    background: 'transparent',
    color: 'rgba(240,234,210,0.7)',
    fontFamily: bodyFontFamily,
    fontSize: 15,
    padding: '11px 20px',
    cursor: 'pointer',
  },
  secondaryAction: {
    border: 'none',
    borderRadius: 11,
    background: 'rgba(233, 227, 201, 0.95)',
    color: '#5D3F2B',
    fontFamily: bodyFontFamily,
    fontSize: 15,
    fontWeight: 700,
    padding: '11px 20px',
    cursor: 'pointer',
  },
  gameLayout: {
    maxWidth: 1920,
    margin: '0 auto',
    width: '100%',
    flex: 1,
    padding: '12px 20px 16px',
    boxSizing: 'border-box',
    display: 'grid',
    gridTemplateColumns: '1fr minmax(140px, 220px)',
    gap: 16,
    alignItems: 'stretch',
  },
  saplingPanel: {
    borderRadius: 22,
    background: 'rgba(41, 27, 18, 0.44)',
    border: '1px solid rgba(255,255,255,0.34)',
    padding: 18,
    boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
  },
  saplingFrame: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.22)',
    minHeight: 'min(60vh, 620px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterOverlay: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: '38%',
    transform: 'translateX(-50%)',
    pointerEvents: 'none',
    overflow: 'hidden',
  },
  waterDroplet: {
    position: 'absolute',
    top: -24,
    width: 8,
    height: 26,
    borderRadius: '50% 50% 60% 60%',
    background: 'linear-gradient(180deg, rgba(190, 236, 255, 0.92), rgba(81, 169, 228, 0.96))',
    boxShadow: '0 0 10px rgba(111, 203, 255, 0.45)',
    animationTimingFunction: 'cubic-bezier(0.25, 0.05, 0.42, 1)',
    animationFillMode: 'forwards',
  },
  talkAuraWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '54%',
    aspectRatio: '1 / 1',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
  },
  talkAuraRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '3px solid rgba(242, 204, 143, 0.86)',
    animation: 'talk-aura-ring 1300ms ease-out forwards',
  },
  saplingImageCurrent: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxHeight: 'min(76vh, 820px)',
    objectFit: 'contain',
    animation: 'sapling-stage-in 900ms ease-out both',
  },
  saplingImagePrevious: {
    position: 'absolute',
    zIndex: 1,
    width: '100%',
    maxHeight: 'min(76vh, 820px)',
    objectFit: 'contain',
    animation: 'sapling-stage-out 900ms ease-out both',
  },
  saplingImagePreviousHold: {
    position: 'absolute',
    zIndex: 1,
    width: '100%',
    maxHeight: 'min(76vh, 820px)',
    objectFit: 'contain',
  },
  saplingImageCurrentHidden: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxHeight: 'min(76vh, 820px)',
    objectFit: 'contain',
    opacity: 0,
  },
  stagePill: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: '8px 14px',
    borderRadius: 999,
    background: 'rgba(19, 25, 19, 0.7)',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 24,
    zIndex: 7,
  },
  subtitleBubble: {
    position: 'absolute',
    left: '50%',
    bottom: 18,
    transform: 'translateX(-50%)',
    width: 'min(94%, 1050px)',
    maxWidth: 'min(94%, 1050px)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'baseline',
    borderRadius: 14,
    padding: '12px 16px',
    background: 'rgba(19, 25, 19, 0.82)',
    color: '#F8F0DC',
    fontFamily: bodyFontFamily,
    fontSize: 23,
    lineHeight: 1.4,
    letterSpacing: 0.2,
    animation: 'subtitle-rise 340ms ease-out',
    zIndex: 7,
  },
  subtitleSpeaker: {
    color: '#F2CC8F',
    fontWeight: 700,
    flexShrink: 0,
    fontFamily: headingFontFamily,
  },
  sunOverlay: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 6,
    animation: 'sun-overlay-fade 1800ms ease-out forwards',
  },
  sunRays: {
    position: 'absolute',
    inset: '-4% -8%',
    background:
      'conic-gradient(from 200deg at 52% 6%, rgba(255, 229, 137, 0.58) 0deg, rgba(255, 229, 137, 0.16) 34deg, rgba(255, 229, 137, 0.02) 62deg, rgba(255, 229, 137, 0.56) 97deg, rgba(255, 229, 137, 0.08) 128deg, rgba(255, 229, 137, 0.62) 162deg, rgba(255, 229, 137, 0.03) 195deg, rgba(255, 229, 137, 0.58) 238deg, rgba(255, 229, 137, 0.08) 282deg, rgba(255, 229, 137, 0.6) 322deg, rgba(255, 229, 137, 0.58) 360deg)',
    mixBlendMode: 'screen',
    animation: 'sun-ray-sweep 1650ms ease-out forwards',
  },
  sunGlow: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: '70%',
    height: '72%',
    transform: 'translateX(-50%)',
    background: 'radial-gradient(circle at 50% 0%, rgba(255, 244, 173, 0.7), rgba(255, 244, 173, 0) 68%)',
    mixBlendMode: 'screen',
    animation: 'sun-glow-pulse 1600ms ease-out forwards',
  },
  buttonRow: {
    position: 'absolute',
    left: 14,
    top: 76,
    zIndex: 8,
    display: 'flex',
    flexDirection: 'column',
    width: 154,
    gap: 10,
  },
  harvestRow: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    zIndex: 9,
    display: 'flex',
    justifyContent: 'flex-start',
    pointerEvents: 'auto',
  },
  energyPanel: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    padding: '8px 10px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.25)',
    background: 'rgba(18, 24, 18, 0.56)',
    width: 'min(460px, 62%)',
  },
  energyFrame: {
    width: 74,
    height: 74,
    objectFit: 'contain',
    flexShrink: 0,
  },
  energyTextWrap: {
    minWidth: 0,
    textAlign: 'left',
  },
  energyLabel: {
    margin: 0,
    color: '#F3E7CC',
    fontFamily: headingFontFamily,
    fontSize: 24,
    lineHeight: 1,
  },
  energyHint: {
    margin: '2px 0 0',
    color: '#E5DBC5',
    fontFamily: bodyFontFamily,
    fontSize: 16,
    letterSpacing: 0.2,
    lineHeight: 1.25,
  },
  iconButton: {
    border: '1px solid rgba(210, 232, 184, 0.36)',
    background: 'linear-gradient(180deg, rgba(35, 61, 32, 0.9), rgba(17, 38, 22, 0.92))',
    borderRadius: 12,
    padding: '9px 8px 8px',
    width: '100%',
    transition: 'transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease',
    cursor: 'pointer',
    display: 'grid',
    justifyItems: 'center',
    alignContent: 'start',
    gap: 4,
    minHeight: 112,
    backdropFilter: 'blur(8px)',
    boxShadow: '0 10px 24px rgba(0,0,0,0.32)',
  },
  talkSaplingButton: {
    background: 'linear-gradient(180deg, rgba(42, 84, 45, 0.94), rgba(18, 48, 25, 0.96))',
    border: '1px solid rgba(156, 213, 139, 0.44)',
  },
  buttonEmoji: {
    fontSize: 28,
    lineHeight: 1,
    display: 'block',
  },
  talkButton: {
    background: 'linear-gradient(180deg, rgba(53, 76, 42, 0.94), rgba(23, 42, 24, 0.96))',
  },
  waterButton: {
    background: 'linear-gradient(180deg, rgba(38, 77, 58, 0.94), rgba(18, 46, 35, 0.96))',
  },
  sunButton: {
    background: 'linear-gradient(180deg, rgba(67, 80, 39, 0.94), rgba(33, 47, 21, 0.96))',
  },
  buttonArt: {
    width: '100%',
    height: 56,
    objectFit: 'contain',
    display: 'block',
  },
  actionLabel: {
    color: '#FAF0DA',
    fontFamily: headingFontFamily,
    fontSize: 17,
    lineHeight: 1,
    textAlign: 'center',
  },
  actionHint: {
    color: 'rgba(245, 239, 224, 0.94)',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    lineHeight: 1.05,
    letterSpacing: 0.15,
    textAlign: 'center',
  },
  collectButton: {
    border: '1px solid rgba(255,255,255,0.34)',
    background: 'linear-gradient(180deg, rgba(57, 73, 39, 0.86), rgba(34, 43, 25, 0.9))',
    borderRadius: 14,
    padding: '8px 10px 10px',
    width: 156,
    minHeight: 116,
    transition: 'transform 180ms ease, box-shadow 180ms ease',
    cursor: 'pointer',
    display: 'grid',
    justifyItems: 'center',
    alignContent: 'center',
    gap: 3,
    backdropFilter: 'blur(8px)',
  },
  collectButtonArt: {
    width: '100%',
    maxWidth: 118,
    height: 70,
    objectFit: 'contain',
    display: 'block',
  },
  collectLabel: {
    color: '#FAF0DA',
    fontFamily: headingFontFamily,
    fontSize: 20,
    lineHeight: 1,
    textAlign: 'center',
  },
  collectHint: {
    color: 'rgba(245, 239, 224, 0.92)',
    fontFamily: bodyFontFamily,
    fontSize: 18,
    lineHeight: 1.2,
    textAlign: 'center',
  },
  statusText: {
    margin: '10px 0 0',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 24,
    lineHeight: 1.4,
    letterSpacing: 0.18,
    textAlign: 'center',
  },
  guardianRail: {
    alignSelf: 'center',
    justifySelf: 'center',
    display: 'grid',
    gridTemplateRows: 'repeat(4, minmax(0, 1fr))',
    gap: 10,
    width: 'min(100%, 172px)',
    height: 'min(720px, calc(100vh - 142px))',
    minHeight: 0,
  },
  guardianRailButton: {
    borderRadius: 14,
    padding: 8,
    cursor: 'pointer',
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    justifySelf: 'center',
    boxSizing: 'border-box',
  },
  guardianRailImage: {
    width: '84%',
    maxWidth: 126,
    maxHeight: '84%',
    aspectRatio: '1 / 1',
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto',
  },
  celebrationWrap: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '26px 16px 18px',
  },
  celebrationCard: {
    width: 'min(960px, 96vw)',
    borderRadius: 24,
    padding: '22px 24px 24px',
    background: 'linear-gradient(180deg, rgba(54, 58, 31, 0.84), rgba(38, 27, 17, 0.9))',
    border: '1px solid rgba(255,255,255,0.42)',
    boxShadow: '0 28px 56px rgba(0,0,0,0.38)',
    textAlign: 'center',
  },
  celebrationOverline: {
    margin: 0,
    color: '#F8E9C7',
    fontFamily: headingFontFamily,
    fontSize: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  celebrationTitle: {
    margin: '8px 0 6px',
    color: '#FFF6DF',
    fontFamily: headingFontFamily,
    fontSize: 42,
    lineHeight: 1.05,
  },
  celebrationSubtitle: {
    margin: '0 auto 16px',
    color: '#F5EBD4',
    fontFamily: bodyFontFamily,
    fontSize: 21,
    lineHeight: 1.4,
    letterSpacing: 0.2,
    maxWidth: 760,
  },
  celebrationVisualArea: {
    position: 'relative',
    borderRadius: 18,
    background: 'radial-gradient(circle at 50% 20%, rgba(242, 204, 143, 0.18), rgba(18, 34, 20, 0.62))',
    minHeight: 250,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
    padding: '22px 28px',
    overflow: 'hidden',
  },
  celebrationGuardian: {
    width: 'min(24vw, 180px)',
    maxWidth: 180,
    objectFit: 'contain',
    filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.34))',
    animation: 'celebration-guardian-in 620ms ease-out, celebration-float 2.8s ease-in-out 650ms infinite',
  },
  celebrationBasket: {
    width: 'min(30vw, 240px)',
    maxWidth: 240,
    objectFit: 'contain',
    filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.34))',
    animation: 'celebration-basket-pop 720ms cubic-bezier(0.2, 1.2, 0.25, 1), basket-bob 2.4s ease-in-out 780ms infinite',
  },
  celebrationResultText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: 220,
    color: '#FFF6DF',
    textShadow: '0 2px 10px rgba(0,0,0,0.4)',
  },
  celebrationResultKicker: {
    fontFamily: bodyFontFamily,
    fontSize: 18,
    color: '#F2CC8F',
  },
  celebrationResultMain: {
    fontFamily: headingFontFamily,
    fontSize: 34,
    lineHeight: 1.05,
  },
  celebrationActions: {
    marginTop: 20,
    display: 'flex',
    gap: 14,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  celebrationPrimaryAction: {
    border: 'none',
    borderRadius: 12,
    background: '#DDE5B6',
    color: '#3B4A20',
    fontFamily: bodyFontFamily,
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1,
    padding: '16px 30px',
    minWidth: 320,
    cursor: 'pointer',
  },
  celebrationSecondaryAction: {
    border: 'none',
    borderRadius: 12,
    background: 'rgba(233, 227, 201, 0.95)',
    color: '#5D3F2B',
    fontFamily: bodyFontFamily,
    fontSize: 30,
    fontWeight: 700,
    lineHeight: 1,
    padding: '16px 30px',
    minWidth: 320,
    cursor: 'pointer',
  },

  scoreBreakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: 'rgba(18, 13, 9, 0.38)',
    border: '1px solid rgba(242, 204, 143, 0.28)',
    borderRadius: 14,
    padding: '14px 20px',
    maxWidth: 360,
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreDetail: {
    color: '#F5EBD4',
    fontFamily: numberFontFamily,
    fontSize: 20,
    lineHeight: 1.3,
  },
  scoreTotalRow: {
    borderTop: '1px solid rgba(242, 204, 143, 0.3)',
    marginTop: 4,
    paddingTop: 8,
  },
  scoreTotalLabel: {
    color: '#F2CC8F',
    fontFamily: headingFontFamily,
    fontSize: 22,
    fontWeight: 700,
  },
  scoreTotalValue: {
    color: '#F2CC8F',
    fontFamily: numberFontFamily,
    fontSize: 26,
    fontWeight: 700,
  },
};
