import { useEffect, useMemo, useRef, useState } from 'react';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

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

const ENERGY_RECHARGE_SECONDS = 20;
const energyFrames = [
  '/assets/animation/energy/energy-0.png',
  '/assets/animation/energy/energy-25.png',
  '/assets/animation/energy/energy-50.png',
  '/assets/animation/energy/energy-75.png',
  '/assets/animation/energy/energy-100.png',
];

type SaplingEffect = 'water' | 'sun' | 'talk' | null;
type SaplingAction = Exclude<SaplingEffect, null> | 'harvest';

export default function SpiritSaplingGame({ onExit }: Props) {
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedGuardianId, setSelectedGuardianId] = useState<GuardianId>('deer');
  const [stageIndex, setStageIndex] = useState(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [spokenLine, setSpokenLine] = useState('');
  const [energyElapsedSeconds, setEnergyElapsedSeconds] = useState(ENERGY_RECHARGE_SECONDS);
  const [growthImageReady, setGrowthImageReady] = useState<Record<string, boolean>>({});
  const [activeEffect, setActiveEffect] = useState<SaplingEffect>(null);
  const [activeAction, setActiveAction] = useState<SaplingAction | null>(null);
  const [effectKey, setEffectKey] = useState(0);
  const [previousStageIndex, setPreviousStageIndex] = useState<number | null>(null);
  const [hasCollectedFruit, setHasCollectedFruit] = useState(false);
  const [harvestedGuardianId, setHarvestedGuardianId] = useState<GuardianId | null>(null);
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
  const isRecharging = energyElapsedSeconds < ENERGY_RECHARGE_SECONDS;
  const energyPercent = Math.round((energyElapsedSeconds / ENERGY_RECHARGE_SECONDS) * 100);
  const energyFrameIndex = Math.min(4, Math.floor(energyElapsedSeconds / 5));
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
    if (!hasStarted || atFinalStage || energyElapsedSeconds >= ENERGY_RECHARGE_SECONDS) {
      if (energyTickTimerRef.current) {
        window.clearInterval(energyTickTimerRef.current);
        energyTickTimerRef.current = null;
      }
      return;
    }

    energyTickTimerRef.current = window.setInterval(() => {
      setEnergyElapsedSeconds((current) => Math.min(ENERGY_RECHARGE_SECONDS, current + 1));
    }, 1000);

    return () => {
      if (energyTickTimerRef.current) {
        window.clearInterval(energyTickTimerRef.current);
        energyTickTimerRef.current = null;
      }
    };
  }, [hasStarted, atFinalStage, energyElapsedSeconds]);

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

    const effectDuration = action === 'water' ? 1900 : 1800;
    const growthDelay = action === 'water' ? 780 : 680;

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

  const handleTalkAction = async () => {
    if (!canUseNurtureAction) return;

    resetEnergyOnNurture();
    setActiveAction('talk');
    triggerEffect('talk', 3600);
    await speakGuardian();
    advanceGrowth();
    setActiveAction(null);
  };

  const handleCollectFruit = () => {
    if (!canCollectFruit) return;

    setActiveAction('harvest');
    setHarvestedGuardianId(selectedGuardianId);
    window.setTimeout(() => {
      setHasCollectedFruit(true);
      setActiveAction(null);
    }, 220);
  };

  const guardianLines: Record<GuardianId, string[]> = {
    deer: [
      'Grow gently, little one. Every morning breeze carries your strength.',
      'Roots below, leaves above. You are safe in this grove.',
    ],
    fox: [
      'Wake up, sprout. The sun has stories for your leaves today.',
      'Stretch and sparkle. The wind already knows your name.',
    ],
    kodama: [
      'Spirit child, drink the light and listen to the earth song.',
      'You rise with the forest heartbeat. Keep growing.',
    ],
    mononoke: [
      'Stand proud, sapling. Even storms must bow to your roots.',
      'Take this breath of power and bloom into your true form.',
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
    setSpokenLine(line);

    try {
      const response = await fetch('/api/tts/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardianId: selectedGuardianId,
          text: line,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Guardian TTS unavailable:', errorText);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const voice = new Audio(audioUrl);

      await voice.play();
      await new Promise<void>((resolve) => {
        voice.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        voice.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
      });
    } catch (error) {
      console.warn('Failed to play guardian voice:', error);
    } finally {
      const elapsedMs = Date.now() - startedAt;
      const holdMs = Math.max(0, minTalkAndSubtitleMs - elapsedMs);
      if (holdMs > 0) {
        await new Promise<void>((resolve) => {
          window.setTimeout(() => resolve(), holdMs);
        });
      }
      setIsTalking(false);
      setSpokenLine('');
    }
  };

  const restartJourney = () => {
    setStageIndex(0);
    setEnergyElapsedSeconds(ENERGY_RECHARGE_SECONDS);
    setTransitionKey((value) => value + 1);
    setPreviousStageIndex(null);
    setHasCollectedFruit(false);
    setHarvestedGuardianId(null);
    setActiveAction(null);
    setActiveEffect(null);
    setIsTalking(false);
    setSpokenLine('');
  };

  if (!hasStarted) {
    return (
      <div style={styles.page}>
        <div style={styles.topBar}>
          <button style={styles.backButton} onClick={onExit}>
            ← Back to Grove
          </button>
          <h2 style={styles.heading}>Spirit Sapling</h2>
        </div>

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

            <button type="button" style={styles.primaryAction} onClick={() => setHasStarted(true)}>
              Begin Nurturing
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasCollectedFruit && harvestedGuardian) {
    return (
      <div style={styles.page}>
        <div style={styles.topBar}>
          <button style={styles.backButton} onClick={onExit}>
            ← Back to Grove
          </button>
          <h2 style={styles.heading}>Spirit Sapling</h2>
        </div>

        <div style={styles.celebrationWrap}>
          <div style={styles.celebrationCard}>
            <p style={styles.celebrationOverline}>Sacred Harvest Gathered</p>
            <h3 style={styles.celebrationTitle}>{harvestedGuardian.sacredTreeName} Collected</h3>
            <p style={styles.celebrationSubtitle}>
              Guided by {harvestedGuardian.name}, your spirit sapling matured into a sacred tree and filled the basket with {harvestedGuardian.harvestName}.
            </p>

            <div style={styles.celebrationVisualArea}>
              <img
                key={`celebration-${transitionKey}`}
                src={harvestedGuardian.fruitTree}
                alt={harvestedGuardian.sacredTreeName}
                style={styles.celebrationSapling}
              />
              <img src={harvestedGuardian.image} alt={harvestedGuardian.name} style={styles.celebrationGuardian} />
              <img
                src={harvestedGuardian.fruitBasket}
                alt={`Basket of ${harvestedGuardian.harvestName}`}
                style={styles.celebrationBasket}
              />
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
                  setHasStarted(false);
                }}
              >
                Choose New Guardian
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={onExit}>
          ← Back to Grove
        </button>
        <h2 style={styles.heading}>Spirit Sapling</h2>
      </div>

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
                    ? `Energizing... ready in ${ENERGY_RECHARGE_SECONDS - energyElapsedSeconds}s`
                    : 'Fully energized. Choose one nurturing action.'}
                </p>
              </div>
            </div>
          </div>

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
                <span style={styles.collectHint}>Gather the {selectedGuardian.harvestName} from your sacred tree</span>
              </button>
            </div>
          ) : (
            <div style={styles.buttonRow}>
              <button
                type="button"
                style={{
                  ...styles.iconButton,
                  ...styles.talkButton,
                  opacity: (isRecharging || isTalking) && activeAction !== 'talk' ? 0.55 : 1,
                  boxShadow: activeAction === 'talk'
                    ? '0 0 18px rgba(236, 206, 145, 0.78), 0 0 32px rgba(236, 206, 145, 0.34)'
                    : '0 8px 18px rgba(0,0,0,0.22)',
                  transform: activeAction === 'talk' ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
                }}
                onClick={handleTalkAction}
                disabled={!canUseNurtureAction}
              >
                <img src={selectedGuardian.talkButton} alt={`Talk with ${selectedGuardian.name}`} style={styles.buttonArt} />
                <span style={styles.actionLabel}>Talk</span>
                <span style={styles.actionHint}>Hear {selectedGuardian.name}</span>
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
                  transform: activeAction === 'water' ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
                }}
                onClick={() => handleSunOrWaterAction('water')}
                disabled={!canUseNurtureAction}
              >
                <img
                  src="/assets/backgrounds/spirit-sapling/buttons/water-bucket-button.png"
                  alt="Water bucket"
                  style={styles.buttonArt}
                />
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
                  transform: activeAction === 'sun' ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
                }}
                onClick={() => handleSunOrWaterAction('sun')}
                disabled={!canUseNurtureAction}
              >
                <img
                  src="/assets/backgrounds/spirit-sapling/buttons/sun-light-button.png"
                  alt="Sun light"
                  style={styles.buttonArt}
                />
                <span style={styles.actionLabel}>Sun</span>
                <span style={styles.actionHint}>Warm the leaves</span>
              </button>
            </div>
          )}

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
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    position: 'relative',
    background:
      "linear-gradient(rgba(20, 20, 20, 0.2), rgba(20, 20, 20, 0.2)), url('/assets/backgrounds/spirit-sapling/game-bg.png') center/cover no-repeat",
    padding: 24,
    boxSizing: 'border-box',
  },
  topBar: {
    maxWidth: 1920,
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
    padding: '14px 22px',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: bodyFontFamily,
    fontSize: 28,
  },
  heading: {
    color: '#6C584C',
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 44,
  },
  selectionWrap: {
    minHeight: 'calc(100vh - 120px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  selectionCard: {
    width: 'min(1000px, 96vw)',
    borderRadius: 24,
    padding: 24,
    background: 'rgba(45, 30, 22, 0.54)',
    border: '1px solid rgba(255,255,255,0.36)',
    boxShadow: '0 20px 42px rgba(0,0,0,0.32)',
  },
  selectionTitle: {
    margin: 0,
    color: '#F0EAD2',
    textAlign: 'center',
    fontFamily: headingFontFamily,
    fontSize: 42,
  },
  selectionSubtitle: {
    margin: '8px 0 18px',
    color: '#F0EAD2',
    textAlign: 'center',
    fontFamily: bodyFontFamily,
    fontSize: 26,
    opacity: 0.95,
  },
  guardianGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
  },
  guardianChoice: {
    borderRadius: 14,
    padding: 12,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  guardianChoiceImage: {
    width: '100%',
    maxWidth: 140,
    aspectRatio: '1 / 1',
    objectFit: 'contain',
  },
  guardianChoiceLabel: {
    fontFamily: bodyFontFamily,
    color: '#F0EAD2',
    fontSize: 24,
  },
  primaryAction: {
    marginTop: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'block',
    border: 'none',
    borderRadius: 12,
    background: '#DDE5B6',
    color: '#3B4A20',
    fontFamily: bodyFontFamily,
    fontSize: 30,
    fontWeight: 700,
    padding: '12px 24px',
    cursor: 'pointer',
  },
  secondaryAction: {
    border: 'none',
    borderRadius: 12,
    background: 'rgba(233, 227, 201, 0.95)',
    color: '#5D3F2B',
    fontFamily: bodyFontFamily,
    fontSize: 28,
    fontWeight: 700,
    padding: '12px 24px',
    cursor: 'pointer',
  },
  gameLayout: {
    maxWidth: 1920,
    margin: '0 auto',
    width: '100%',
    minHeight: 'calc(100vh - 120px)',
    display: 'grid',
    gridTemplateColumns: '1fr minmax(140px, 220px)',
    gap: 16,
    alignItems: 'center',
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
    marginTop: 14,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(108px, 146px))',
    justifyContent: 'center',
    gap: 10,
  },
  harvestRow: {
    marginTop: 14,
    display: 'flex',
    justifyContent: 'center',
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
    border: '1px solid rgba(255,255,255,0.3)',
    background: 'rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: '8px 6px 7px',
    width: '100%',
    transition: 'transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease',
    cursor: 'pointer',
    display: 'grid',
    justifyItems: 'center',
    alignContent: 'start',
    gap: 2,
  },
  talkButton: {
    background: 'linear-gradient(180deg, rgba(234, 210, 162, 0.3), rgba(118, 84, 55, 0.36))',
  },
  waterButton: {
    background: 'linear-gradient(180deg, rgba(162, 219, 245, 0.34), rgba(44, 110, 145, 0.32))',
  },
  sunButton: {
    background: 'linear-gradient(180deg, rgba(255, 224, 145, 0.36), rgba(164, 108, 38, 0.32))',
  },
  buttonArt: {
    width: '100%',
    height: 70,
    objectFit: 'contain',
    display: 'block',
  },
  actionLabel: {
    color: '#FAF0DA',
    fontFamily: headingFontFamily,
    fontSize: 18,
    lineHeight: 1,
  },
  actionHint: {
    color: 'rgba(245, 239, 224, 0.92)',
    fontFamily: bodyFontFamily,
    fontSize: 13,
    lineHeight: 1.05,
    letterSpacing: 0.15,
  },
  collectButton: {
    border: '1px solid rgba(255,255,255,0.34)',
    background: 'linear-gradient(180deg, rgba(243, 219, 170, 0.35), rgba(126, 81, 33, 0.38))',
    borderRadius: 16,
    padding: '10px 16px',
    width: 'min(100%, 420px)',
    transition: 'transform 180ms ease, box-shadow 180ms ease',
    cursor: 'pointer',
    display: 'grid',
    justifyItems: 'center',
    gap: 4,
  },
  collectButtonArt: {
    width: '100%',
    maxWidth: 190,
    height: 86,
    objectFit: 'contain',
    display: 'block',
  },
  collectLabel: {
    color: '#FAF0DA',
    fontFamily: headingFontFamily,
    fontSize: 24,
    lineHeight: 1,
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
    display: 'grid',
    gap: 10,
  },
  guardianRailButton: {
    borderRadius: 14,
    padding: 8,
    cursor: 'pointer',
  },
  guardianRailImage: {
    width: '100%',
    maxWidth: 180,
    aspectRatio: '1 / 1',
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto',
  },
  celebrationWrap: {
    minHeight: 'calc(100vh - 120px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationCard: {
    width: 'min(1040px, 96vw)',
    borderRadius: 24,
    padding: 24,
    background: 'radial-gradient(circle at 50% 15%, rgba(244, 215, 122, 0.38), rgba(54, 32, 20, 0.86))',
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
    fontSize: 50,
  },
  celebrationSubtitle: {
    margin: '0 0 18px',
    color: '#F5EBD4',
    fontFamily: bodyFontFamily,
    fontSize: 26,
    lineHeight: 1.4,
    letterSpacing: 0.2,
  },
  celebrationVisualArea: {
    position: 'relative',
    borderRadius: 18,
    background: 'rgba(18, 13, 9, 0.4)',
    minHeight: 'min(52vh, 520px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'end',
    gap: 0,
    padding: 16,
  },
  celebrationSapling: {
    width: 'min(82%, 760px)',
    maxHeight: 'min(48vh, 460px)',
    objectFit: 'contain',
    animation: 'sapling-rise 700ms ease-out, bloom-pulse 2.3s ease-in-out infinite',
  },
  celebrationGuardian: {
    position: 'absolute',
    right: 18,
    bottom: 12,
    width: 'min(18vw, 180px)',
    objectFit: 'contain',
    animation: 'sapling-rise 500ms ease-out',
  },
  celebrationBasket: {
    position: 'absolute',
    left: 24,
    bottom: 12,
    width: 'min(24vw, 240px)',
    maxWidth: 240,
    objectFit: 'contain',
    animation: 'sapling-rise 620ms ease-out',
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
};
