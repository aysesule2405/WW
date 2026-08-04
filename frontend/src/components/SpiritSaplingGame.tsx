import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { uiFontFamily, titleFontFamily, numberFontFamily } from '../theme/typography';
import { apiUrl, getToken, submitSession } from '../lib/api';
import { loadSaplingProgress, updateProgressAfterHarvest, LOCKED_GUARDIANS } from '../lib/saplingProgress';
import { loadDailyEnergy, spendDailyEnergy, restoreDailyEnergy, DAILY_ENERGY_TOTAL } from '../lib/dailyEnergy';
import { audioManager } from '../lib/AudioManager';
import GameShell from './game/GameShell';
import GameDescriptionPanel from '../games/spirit-sapling/GameDescriptionPanel';
import TalkToSaplingPanel from '../games/spirit-sapling/TalkToSaplingPanel';
import GentleHarvestGame, { type HarvestResult } from '../games/spirit-sapling/GentleHarvestGame';
import { useGameMusic } from '../hooks/useGameMusic';

const bodyFontFamily    = uiFontFamily
const headingFontFamily = titleFontFamily

type Props = {
  onExit: () => void;
};

type GuardianId = 'deer' | 'fox' | 'kodama' | 'mononoke' | 'wanderer' | 'silent';

type Guardian = {
  id: GuardianId;
  name: string;
  image: string;
  imageFilter?: string;
  hearButton: string;
  talkButton: string;
  fruitTree: string;
  fruitBasket: string;
  sacredTreeName: string;
  harvestName: string;
  fruitKind: 'apple' | 'peach' | 'pear' | 'persimmon';
  synergy: 'water' | 'sun' | 'talk' | 'spirit' | 'any';
  synergyColor: string;
  talkPanelDisabled?: boolean;
};

const BASE_GUARDIANS: Guardian[] = [
  {
    id: 'deer',
    name: 'Deer',
    image: '/assets/backgrounds/spirit-sapling/guardians/deer-guardian.png',
    hearButton: '/assets/backgrounds/spirit-sapling/buttons/deer-hear-button.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/deer-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/peach-deer.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-peach.png',
    sacredTreeName: 'Peach Tree',
    harvestName: 'peaches',
    fruitKind: 'peach',
    synergy: 'water',
    synergyColor: '#6BC8EB',
  },
  {
    id: 'fox',
    name: 'Fox',
    image: '/assets/backgrounds/spirit-sapling/guardians/fox-guardian.png',
    hearButton: '/assets/backgrounds/spirit-sapling/buttons/fox-hear-button.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/fox-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/persimmon-fox.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-persimmon.png',
    sacredTreeName: 'Persimmon Tree',
    harvestName: 'persimmons',
    fruitKind: 'persimmon',
    synergy: 'sun',
    synergyColor: '#FFD444',
  },
  {
    id: 'kodama',
    name: 'Kodama',
    image: '/assets/backgrounds/spirit-sapling/guardians/kodama-guardian.png',
    hearButton: '/assets/backgrounds/spirit-sapling/buttons/kodama-hear-button.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/kodama-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/pear-kodama.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-pear.png',
    sacredTreeName: 'Pear Tree',
    harvestName: 'pears',
    fruitKind: 'pear',
    synergy: 'spirit',
    synergyColor: '#ECBC58',
  },
  {
    id: 'mononoke',
    name: 'Mononoke',
    image: '/assets/backgrounds/spirit-sapling/guardians/mononoke-guardian.png',
    hearButton: '/assets/backgrounds/spirit-sapling/buttons/mononoke-hear-button.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/mononoke-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/apple-mononoke.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-apple.png',
    sacredTreeName: 'Apple Tree',
    harvestName: 'apples',
    fruitKind: 'apple',
    synergy: 'talk',
    synergyColor: '#8CD778',
  },
];

const UNLOCKABLE_GUARDIAN_DEFS: Guardian[] = [
  {
    id: 'wanderer',
    name: 'Wanderer',
    image: '/assets/backgrounds/spirit-sapling/guardians/mononoke-guardian.png',
    imageFilter: 'sepia(0.55) hue-rotate(75deg) saturate(1.5) brightness(1.08)',
    hearButton: '/assets/backgrounds/spirit-sapling/buttons/mononoke-hear-button.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/mononoke-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/apple-mononoke.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-apple.png',
    sacredTreeName: 'World Tree',
    harvestName: 'wild fruits',
    fruitKind: 'apple',
    synergy: 'any',
    synergyColor: '#C8A0E8',
  },
  {
    id: 'silent',
    name: 'Silent One',
    image: '/assets/backgrounds/spirit-sapling/guardians/kodama-guardian.png',
    imageFilter: 'sepia(0.35) hue-rotate(185deg) saturate(0.75) brightness(0.88) contrast(1.1)',
    hearButton: '/assets/backgrounds/spirit-sapling/buttons/kodama-hear-button.png',
    talkButton: '/assets/backgrounds/spirit-sapling/buttons/kodama-talk-button.png',
    fruitTree: '/assets/backgrounds/spirit-sapling/sacred-fruit-trees/pear-kodama.png',
    fruitBasket: '/assets/backgrounds/spirit-sapling/baskets/basket-of-pear.png',
    sacredTreeName: 'Moon Pear Tree',
    harvestName: 'moonpears',
    fruitKind: 'pear',
    synergy: 'spirit',
    synergyColor: '#9EC8D8',
    talkPanelDisabled: true,
  },
];

const SPORE_POSITIONS = [
  { left: 12, delay: 0.0, size: 7,  dur: 4.2 },
  { left: 26, delay: 0.9, size: 5,  dur: 5.1 },
  { left: 40, delay: 1.8, size: 8,  dur: 3.9 },
  { left: 54, delay: 0.5, size: 6,  dur: 4.8 },
  { left: 68, delay: 1.4, size: 5,  dur: 5.4 },
  { left: 80, delay: 2.2, size: 7,  dur: 4.1 },
  { left: 20, delay: 2.6, size: 5,  dur: 5.8 },
  { left: 58, delay: 0.3, size: 6,  dur: 4.5 },
  { left: 36, delay: 1.6, size: 4,  dur: 6.0 },
  { left: 74, delay: 1.1, size: 8,  dur: 3.7 },
];

const CORRUPTION_BORDER = [
  'rgba(100,160,80,0.16)',
  'rgba(160,120,50,0.42)',
  'rgba(190,70,35,0.58)',
  'rgba(150,25,55,0.72)',
  'rgba(100,8,35,0.88)',
];
const CORRUPTION_GLOW = [
  'transparent',
  'rgba(160,80,20,0.10)',
  'rgba(190,60,20,0.24)',
  'rgba(150,20,50,0.38)',
  'rgba(100,0,30,0.55)',
];
const CORRUPTION_LABEL_TEXT = ['', 'Tainted', 'Blighted', 'Corrupted', 'Forsaken'];
const CORRUPTION_TEXT_COLOR = ['', '#B07838', '#C04828', '#A01845', '#780020'];

const baseGrowthStages = [
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-1.png',
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-2.png',
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-3.png',
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-4.png',
  '/assets/backgrounds/spirit-sapling/sapling-growth/sapling-5.png',
];

const basketButtonImage = '/assets/backgrounds/spirit-sapling/baskets/empty-basket.png';

const dropletOffsets = [12, 20, 28, 36, 44, 52, 60, 68, 76, 84];

type GameScreen = 'description' | 'selection' | 'game' | 'harvest' | 'results';
type SaplingEffect = 'water' | 'sun' | 'talk' | null;
type SaplingAction = Exclude<SaplingEffect, null> | 'harvest';
type NeedType = 'water' | 'sun' | 'talk' | 'spirit';

const ALL_NEEDS: NeedType[] = ['water', 'sun', 'talk', 'spirit'];
const REGRESSION_TIMEOUT = 60;
const REGRESSION_WARN = 10;

const NEED_CONFIG: Record<NeedType, { label: string; wiltLabel: string; color: string; border: string; glow: string }> = {
  water:  { label: 'Thirsty',     wiltLabel: 'Parched!',   color: '#6BC8EB', border: 'rgba(100,200,235,0.55)', glow: 'rgba(100,200,235,0.28)' },
  sun:    { label: 'Sun-starved', wiltLabel: 'Darkening!', color: '#FFD444', border: 'rgba(255,212,68,0.55)',  glow: 'rgba(255,212,68,0.28)'  },
  talk:   { label: 'Lonely',      wiltLabel: 'Longing…',   color: '#8CD778', border: 'rgba(140,215,120,0.55)', glow: 'rgba(140,215,120,0.28)' },
  spirit: { label: 'Restless',    wiltLabel: 'Fading…',    color: '#ECBC58', border: 'rgba(235,188,88,0.55)',  glow: 'rgba(235,188,88,0.28)'  },
};

function pickNeed(exclude?: NeedType): NeedType {
  const pool = exclude ? ALL_NEEDS.filter(n => n !== exclude) : ALL_NEEDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

type EventType = 'drought' | 'blight' | 'frost' | 'storm' | 'whisper';
type ActiveEvent = { type: EventType; secondsLeft: number } | null;

const ALL_EVENT_TYPES: EventType[] = ['drought', 'blight', 'frost', 'storm', 'whisper'];

const EVENT_CONFIG: Record<EventType, {
  label: string; icon: string; description: string;
  counterHint: string | null; duration: number;
  bgColor: string; borderColor: string; textColor: string;
}> = {
  drought: {
    label: 'Drought', icon: '☀',
    description: 'The earth cracks and dries. The sapling thirsts urgently.',
    counterHint: 'Water the sapling now',
    duration: 22, bgColor: 'rgba(120,60,10,0.28)',
    borderColor: 'rgba(200,120,40,0.75)', textColor: '#F0A050',
  },
  blight: {
    label: 'Blight', icon: '◉',
    description: 'Dark spores cloud the grove. Only kind words can cleanse it.',
    counterHint: 'Talk to Spirit with kindness',
    duration: 25, bgColor: 'rgba(50,15,70,0.35)',
    borderColor: 'rgba(140,60,190,0.72)', textColor: '#C080E0',
  },
  frost: {
    label: 'Frost', icon: '❄',
    description: 'A cold wind sweeps the grove. The leaves begin to freeze.',
    counterHint: 'Bring sunlight to warm the sapling',
    duration: 22, bgColor: 'rgba(30,60,120,0.32)',
    borderColor: 'rgba(80,150,220,0.72)', textColor: '#80C0F0',
  },
  storm: {
    label: 'Storm', icon: '⛈',
    description: 'A fierce storm rages. Be still and let it pass.',
    counterHint: null,
    duration: 18, bgColor: 'rgba(15,15,35,0.50)',
    borderColor: 'rgba(70,70,130,0.72)', textColor: '#9090C0',
  },
  whisper: {
    label: 'Whisper Night', icon: '✦',
    description: 'The ancient forest whispers. Your guardian feels close.',
    counterHint: 'Call upon your guardian now',
    duration: 28, bgColor: 'rgba(50,60,15,0.30)',
    borderColor: 'rgba(180,200,80,0.72)', textColor: '#E0D060',
  },
};

export default function SpiritSaplingGame({ onExit }: Props) {
  useGameMusic('spirit-sapling');

  const [screen, setScreen] = useState<GameScreen>('description');
  const [selectedGuardianId, setSelectedGuardianId] = useState<GuardianId>('deer');
  const [stageIndex, setStageIndex] = useState(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const [isTalking, setIsTalking] = useState(false);
  const [spokenLine, setSpokenLine] = useState('');
  const [dailyEnergy, setDailyEnergy] = useState(() => loadDailyEnergy());
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
  const [dailyNeed, setDailyNeed] = useState<NeedType>(() => pickNeed());
  const [needMatchCount, setNeedMatchCount] = useState(0);
  const [careMessage, setCareMessage] = useState('Pause, notice the sapling, then choose the care it is asking for.');
  const [regressionSeconds, setRegressionSeconds] = useState(REGRESSION_TIMEOUT);
  const [corruptionScore, setCorruptionScore] = useState(0);
  const [needFlash, setNeedFlash] = useState(false);
  const [isWilting, setIsWilting] = useState(false);
  const [harvestHarmonyBonus, setHarvestHarmonyBonus] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ActiveEvent>(null);
  const [eventsSurvived, setEventsSurvived] = useState(0);
  const [eventFlash, setEventFlash] = useState<'success' | 'fail' | null>(null);
  const [synergyBoostCount, setSynergyBoostCount] = useState(0);
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(null);
  const [isPageVisible, setIsPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [saplingProgress, setSaplingProgress] = useState(() => loadSaplingProgress());
  const availableGuardians = useMemo(
    () => [
      ...BASE_GUARDIANS,
      ...UNLOCKABLE_GUARDIAN_DEFS.filter(g => saplingProgress.unlockedGuardians.includes(g.id)),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saplingProgress.unlockedGuardians.join(',')],
  );
  const waterCountRef = useRef(0);
  const sunCountRef   = useRef(0);
  const talkCountRef  = useRef(0);
  const effectTimerRef = useRef<number | null>(null);
  const stageTransitionTimerRef = useRef<number | null>(null);
  const growthDelayTimerRef = useRef<number | null>(null);
  const growthImageReadyRef = useRef<Record<string, boolean>>({});
  const regressionTickRef = useRef<number | null>(null);
  const stageIndexRef = useRef(0);
  const growthStagesRef = useRef<string[]>([]);
  const dailyNeedRef = useRef<NeedType>(dailyNeed);
  const needFlashTimerRef = useRef<number | null>(null);
  const eventTickRef = useRef<number | null>(null);
  const eventSpawnTimerRef = useRef<number | null>(null);
  const eventFlashTimerRef = useRef<number | null>(null);
  const atFinalStageRef = useRef(false);
  const hasCollectedFruitRef = useRef(false);
  const activeEventRef = useRef<ActiveEvent>(null);
  const milestoneEventTriggeredRef = useRef(false);

  const selectedGuardian = useMemo(
    () => availableGuardians.find((g) => g.id === selectedGuardianId) ?? BASE_GUARDIANS[0],
    [availableGuardians, selectedGuardianId],
  );
  const selectedGuardianRef = useRef(selectedGuardian);
  const harvestedGuardian = useMemo(
    () => availableGuardians.find((g) => g.id === harvestedGuardianId) ?? null,
    [availableGuardians, harvestedGuardianId],
  );
  const growthStages = useMemo(
    () => [...baseGrowthStages, selectedGuardian.fruitTree],
    [selectedGuardian.fruitTree],
  );
  const growthStageAssets = useMemo(
    () => [
      ...baseGrowthStages,
      ...BASE_GUARDIANS.map((g) => g.fruitTree),
      ...UNLOCKABLE_GUARDIAN_DEFS.map((g) => g.fruitTree),
    ],
    [],
  );

  const atFinalStage = stageIndex >= growthStages.length - 1;
  const corruptionStage = corruptionScore < 20 ? 0 : corruptionScore < 40 ? 1 : corruptionScore < 60 ? 2 : corruptionScore < 80 ? 3 : 4;
  const sporeOpacity = corruptionStage === 2 ? 0.30 : corruptionStage === 3 ? 0.48 : 0.65;
  const canCollectFruit = atFinalStage && !hasCollectedFruit && previousStageIndex === null && !isTalking;
  const currentStageSrc = growthStages[stageIndex];
  const isCurrentStageLoaded = Boolean(growthImageReady[currentStageSrc]);
  const interactionOverlayPaused = showTalkPanel || isTalking || !isPageVisible;
  const gameplayPaused = interactionOverlayPaused || activeAction !== null;

  // Keep refs in sync so stable callbacks can read current values
  useEffect(() => { stageIndexRef.current = stageIndex; }, [stageIndex]);
  useEffect(() => { growthStagesRef.current = growthStages; }, [growthStages]);
  useEffect(() => { dailyNeedRef.current = dailyNeed; }, [dailyNeed]);
  useEffect(() => { atFinalStageRef.current = atFinalStage; }, [atFinalStage]);
  useEffect(() => { hasCollectedFruitRef.current = hasCollectedFruit; }, [hasCollectedFruit]);
  useEffect(() => { activeEventRef.current = activeEvent; }, [activeEvent]);
  useEffect(() => { selectedGuardianRef.current = selectedGuardian; }, [selectedGuardian]);

  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const regressionStage = useCallback(() => {
    const current = stageIndexRef.current;
    setIsWilting(false);
    if (current <= 0) {
      setCorruptionScore(c => Math.min(100, c + 5));
      return;
    }
    const prev = current - 1;
    const prevSrc = growthStagesRef.current[prev];
    setStageIndex(prev);
    setPreviousStageIndex(current);
    setTransitionKey(k => k + 1);
    setCorruptionScore(c => Math.min(100, c + 10));
    if (stageTransitionTimerRef.current) window.clearTimeout(stageTransitionTimerRef.current);
    const clearWhenReady = () => {
      if (growthImageReadyRef.current[prevSrc]) { setPreviousStageIndex(null); stageTransitionTimerRef.current = null; return; }
      stageTransitionTimerRef.current = window.setTimeout(clearWhenReady, 120);
    };
    stageTransitionTimerRef.current = window.setTimeout(clearWhenReady, 900);
  }, []);

  const resetRegressionTimer = useCallback(() => {
    setRegressionSeconds(REGRESSION_TIMEOUT);
    setIsWilting(false);
  }, []);

  const checkNeedMatch = useCallback((action: NeedType): boolean => {
    const current = dailyNeedRef.current;
    if (action === current) {
      setNeedMatchCount(c => c + 1);
      setNeedFlash(true);
      // Synergy boost: guardian's synergy matches the action (or is 'any' — The Wanderer)
      const guardianSynergy = selectedGuardianRef.current?.synergy;
      if (guardianSynergy === 'any' || guardianSynergy === action) setSynergyBoostCount(c => c + 1);
      if (needFlashTimerRef.current) window.clearTimeout(needFlashTimerRef.current);
      needFlashTimerRef.current = window.setTimeout(() => setNeedFlash(false), 1200);
      const nextNeed = pickNeed(current);
      dailyNeedRef.current = nextNeed;
      setDailyNeed(nextNeed);
      setCareMessage('You noticed what the sapling was asking for. Its leaves open with trust.');
      return true;
    }
    setCareMessage(`That care was gentle, but the sapling is still ${NEED_CONFIG[current].label.toLowerCase()}. Look again.`);
    return false;
  }, []);

  const applyEventPenalty = useCallback((type: EventType) => {
    if (type === 'drought') regressionStage();
    else if (type === 'blight') setCorruptionScore(c => Math.min(100, c + 20));
    else if (type === 'frost') { regressionStage(); setCorruptionScore(c => Math.min(100, c + 10)); }
    // storm and whisper carry no penalty — storm resolves naturally, whisper is a missed bonus
  }, [regressionStage]);

  const scheduleNextEventSpawn = useCallback((minMs = 35000, maxMs = 65000) => {
    if (eventSpawnTimerRef.current) window.clearTimeout(eventSpawnTimerRef.current);
    const delay = minMs + Math.random() * (maxMs - minMs);
    eventSpawnTimerRef.current = window.setTimeout(() => {
      if (atFinalStageRef.current || hasCollectedFruitRef.current || activeEventRef.current) {
        scheduleNextEventSpawn();
        return;
      }
      const type = ALL_EVENT_TYPES[Math.floor(Math.random() * ALL_EVENT_TYPES.length)];
      const event: ActiveEvent = { type, secondsLeft: EVENT_CONFIG[type].duration };
      activeEventRef.current = event;
      setActiveEvent(event);
    }, delay);
  }, []);

  const resolveEvent = useCallback((type: EventType, success: boolean) => {
    setActiveEvent(null);
    activeEventRef.current = null;
    if (success) {
      setEventsSurvived(c => c + 1);
      setEventFlash('success');
      resetRegressionTimer();
    } else {
      setEventFlash('fail');
      applyEventPenalty(type);
    }
    if (eventFlashTimerRef.current) window.clearTimeout(eventFlashTimerRef.current);
    eventFlashTimerRef.current = window.setTimeout(() => {
      setEventFlash(null);
      scheduleNextEventSpawn();
    }, 2000);
  }, [applyEventPenalty, resetRegressionTimer, scheduleNextEventSpawn]);

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

  // Attention timer — pauses during care and never removes earned growth.
  useEffect(() => {
    if (screen !== 'game' || atFinalStage || hasCollectedFruit || gameplayPaused) {
      if (regressionTickRef.current) { window.clearInterval(regressionTickRef.current); regressionTickRef.current = null; }
      return;
    }
    if (regressionSeconds <= 0) {
      setCorruptionScore((score) => Math.min(100, score + 4));
      setCareMessage('The sapling waited through the quiet. Look closely and reconnect—its growth is still safe.');
      setRegressionSeconds(REGRESSION_TIMEOUT);
      return;
    }
    if (regressionSeconds <= REGRESSION_WARN) setIsWilting(true);
    regressionTickRef.current = window.setInterval(() => {
      setRegressionSeconds(s => s - 1);
    }, 1000);
    return () => {
      if (regressionTickRef.current) { window.clearInterval(regressionTickRef.current); regressionTickRef.current = null; }
    };
  }, [screen, atFinalStage, hasCollectedFruit, gameplayPaused, regressionSeconds, regressionStage]);

  // Guarantee one guardian-aligned forest trial at the midpoint of every run.
  useEffect(() => {
    if (
      screen !== 'game'
      || stageIndex !== 2
      || interactionOverlayPaused
      || atFinalStage
      || hasCollectedFruit
      || milestoneEventTriggeredRef.current
      || activeEventRef.current
    ) {
      if (eventSpawnTimerRef.current) { window.clearTimeout(eventSpawnTimerRef.current); eventSpawnTimerRef.current = null; }
      return;
    }

    const trialByGuardian: Record<GuardianId, EventType> = {
      deer: 'drought',
      fox: 'frost',
      kodama: 'whisper',
      mononoke: 'blight',
      wanderer: 'whisper',
      silent: 'whisper',
    };
    eventSpawnTimerRef.current = window.setTimeout(() => {
      const type = trialByGuardian[selectedGuardianRef.current.id];
      const event: ActiveEvent = { type, secondsLeft: EVENT_CONFIG[type].duration };
      milestoneEventTriggeredRef.current = true;
      activeEventRef.current = event;
      setActiveEvent(event);
      eventSpawnTimerRef.current = null;
    }, 1000);

    return () => {
      if (eventSpawnTimerRef.current) { window.clearTimeout(eventSpawnTimerRef.current); eventSpawnTimerRef.current = null; }
    };
  }, [screen, stageIndex, interactionOverlayPaused, atFinalStage, hasCollectedFruit]);

  // Event countdown — ticks every second while an event is active
  useEffect(() => {
    if (!activeEvent || screen !== 'game' || gameplayPaused) {
      if (eventTickRef.current) { window.clearInterval(eventTickRef.current); eventTickRef.current = null; }
      return;
    }
    if (activeEvent.secondsLeft <= 0) {
      const expiredType = activeEvent.type;
      setActiveEvent(null);
      activeEventRef.current = null;
      setEventFlash('fail');
      applyEventPenalty(expiredType);
      if (eventFlashTimerRef.current) window.clearTimeout(eventFlashTimerRef.current);
      eventFlashTimerRef.current = window.setTimeout(() => {
        setEventFlash(null);
        scheduleNextEventSpawn();
      }, 2000);
      return;
    }
    eventTickRef.current = window.setInterval(() => {
      setActiveEvent(prev => prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null);
    }, 1000);
    return () => {
      if (eventTickRef.current) { window.clearInterval(eventTickRef.current); eventTickRef.current = null; }
    };
  }, [screen, activeEvent, gameplayPaused, applyEventPenalty, scheduleNextEventSpawn]);

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
      if (regressionTickRef.current) {
        window.clearInterval(regressionTickRef.current);
      }
      if (needFlashTimerRef.current) {
        window.clearTimeout(needFlashTimerRef.current);
      }
      if (eventTickRef.current) {
        window.clearInterval(eventTickRef.current);
      }
      if (eventSpawnTimerRef.current) {
        window.clearTimeout(eventSpawnTimerRef.current);
      }
      if (eventFlashTimerRef.current) {
        window.clearTimeout(eventFlashTimerRef.current);
      }
    };
  }, []);

  const scheduleCareResolution = (delayMs: number, shouldGrow: boolean) => {
    if (growthDelayTimerRef.current) {
      window.clearTimeout(growthDelayTimerRef.current);
    }
    growthDelayTimerRef.current = window.setTimeout(() => {
      if (shouldGrow) advanceGrowth();
      setActiveAction(null);
      growthDelayTimerRef.current = null;
    }, delayMs);
  };

  const spendEnergy = (amount = 1) => {
    setDailyEnergy(spendDailyEnergy(amount));
  };

  const isStorm = activeEvent?.type === 'storm';
  const energyDepleted = dailyEnergy <= 0;
  const canUseNurtureAction = !isTalking && activeAction === null && !energyDepleted && !atFinalStage && !hasCollectedFruit && !isStorm;

  const handleSunOrWaterAction = (action: Extract<SaplingAction, 'sun' | 'water'>) => {
    if (!canUseNurtureAction) return;

    if (action === 'water') waterCountRef.current += 1;
    else sunCountRef.current += 1;

    const matchedNeed = checkNeedMatch(action as NeedType);
    resetRegressionTimer();
    const counteredEvent = (activeEvent?.type === 'drought' && action === 'water')
      || (activeEvent?.type === 'frost' && action === 'sun');
    if (activeEvent?.type === 'drought' && action === 'water') resolveEvent('drought', true);
    if (activeEvent?.type === 'frost'   && action === 'sun')   resolveEvent('frost',   true);

    const effectDuration = matchedNeed || counteredEvent
      ? action === 'water' ? 2200 : 1800
      : 1200;

    if (action === 'water') audioManager.playWater(0.22);
    else audioManager.playSun(0.18);

    spendEnergy();
    setActiveAction(action);
    triggerEffect(action, effectDuration);
    scheduleCareResolution(effectDuration, matchedNeed || counteredEvent);
  };

  const handleHearGuardian = async () => {
    if (isTalking || isStorm || energyDepleted) return;
    spendEnergy();
    talkCountRef.current += 1;
    const matchedNeed = checkNeedMatch('spirit');
    resetRegressionTimer();
    const counteredEvent = activeEvent?.type === 'whisper';
    if (counteredEvent) resolveEvent('whisper', true);
    setActiveAction('talk');
    triggerEffect('talk', 3600);
    audioManager.playSoftChime(0.12);
    await speakGuardian();
    if (matchedNeed || counteredEvent) advanceGrowth();
    setActiveAction(null);
  };

  const handleSaplingEnergyEvaluated = ({
    sentiment,
    growthBoost,
  }: {
    sentiment: 'positive' | 'negative' | 'neutral';
    energyDeltaSeconds: number;
    growthBoost: number;
  }) => {
    if (sentiment === 'negative') {
      setCorruptionScore(c => Math.min(100, c + 8));
    }
    if (growthBoost > 0) {
      setTalkBoostTotal((prev) => prev + growthBoost);
      talkCountRef.current += 1;
      const matchedNeed = checkNeedMatch('talk');
      resetRegressionTimer();
      const counteredEvent = activeEvent?.type === 'blight';
      if (counteredEvent) resolveEvent('blight', true);
      if (matchedNeed || counteredEvent) advanceGrowth();
      // Positive words restore 1 orb — kind energy feeds the grove
      setDailyEnergy(restoreDailyEnergy(1));
    }
  };

  const handleCollectFruit = () => {
    if (!canCollectFruit) return;

    setActiveAction('harvest');
    setHarvestedGuardianId(selectedGuardianId);
    setActiveEvent(null);
    activeEventRef.current = null;
    setScreen('harvest');
  };

  const handleHarvestComplete = (result: HarvestResult) => {
    const guardian = selectedGuardianRef.current;

    const harmonyBonus = waterCountRef.current > 0 && sunCountRef.current > 0 && talkCountRef.current > 0;
    const needSynergyBonus = needMatchCount * 15 + synergyBoostCount * 10;
    const eventBonus = eventsSurvived * 50;
    const corruptionPenalty = Math.floor(corruptionScore * 0.5);
    const harvestPoints = result.collected * 10 + result.patienceBonus;
    const score = Math.max(0, 50 + harvestPoints + (harmonyBonus ? 20 : 0) + talkBoostTotal * 5 + needSynergyBonus + eventBonus - corruptionPenalty);

    setHarvestResult(result);
    setHarvestedGuardianId(guardian.id);
    setHarvestHarmonyBonus(harmonyBonus);
    setHarvestScore(score);

    // Persist progress to localStorage and check for new guardian unlocks
    const updated = updateProgressAfterHarvest(
      guardian.id,
      eventsSurvived,
      talkCountRef.current > 0,
    );
    setSaplingProgress(updated);

    void submitSession('spirit-sapling', {
      completed: true,
      won: true,
      score,
      guardianId: guardian.id,
      growthStageReached: 'full',
      waterActions: waterCountRef.current,
      sunActions:   sunCountRef.current,
      talkActions:  talkCountRef.current,
      harmonyBonus,
      saplingsGrown: 1,
      fruitsCollected: result.collected,
      hastyAttempts: result.hastyAttempts,
      patienceBonus: result.patienceBonus,
      needMatchCount,
      synergyBoostCount,
      eventsSurvived,
      corruptionScore,
    });
    setHasCollectedFruit(true);
    setScreen('results');
    setActiveAction(null);
  };

  const guardianLines: Record<GuardianId, string[]> = {
    deer: [
      'Grow gently, little one. Every morning breeze carries your strength.',
      'Roots below, leaves above. You are safe in this grove.',
      'The dew remembers you. Drink deep and reach for the sky.',
      'Still waters nourish the deepest roots. Trust your quiet growth.',
      'This rain falls just for you — open every leaf to it.',
      'Small and certain, like a droplet finding stone. You will make your mark.',
      'Be patient, little one. Even rivers began as springs.',
      'I have sat with mountains. They grow slowly, too.',
    ],
    fox: [
      'Wake up, sprout. The sun has stories for your leaves today.',
      'Stretch and sparkle. The wind already knows your name.',
      'Mischief and moonlight made you. Now dazzle the whole grove!',
      'Every trickster knows — the brightest flame grows from the smallest spark.',
      "Oh, don't be shy! Lean into the light and let them all stare.",
      'I learned long ago — the bravest thing is simply to bloom.',
      'You remind me of my first dawn. Restless. Radiant. Ready.',
      "Shine before you're certain. That's the fox way.",
    ],
    kodama: [
      'Spirit child, drink the light and listen to the earth song.',
      'You rise with the forest heartbeat. Keep growing.',
      'The old trees lean in to whisper your name. They have waited long.',
      'Between breath and root, you belong. Grow on, gentle spirit.',
      'Even the ancients began as seeds. Your moment is now.',
      'I hear the forest humming your name into the deep roots.',
      'Something in you hums the same song as this world. Follow it.',
      'Grow where your spirit points. The earth already knows the way.',
    ],
    mononoke: [
      'Stand proud, sapling. Even storms must bow to your roots.',
      'Take this breath of power and bloom into your true form.',
      'You are forged from wild things. Let nothing tame your branches.',
      'The mountain watches. Show it the strength that lives inside you.',
      'Wild and unbroken — that is the only way worth growing.',
      'I have no patience for slow things. But you, I will wait for.',
      'The grove does not bow to me. Nor should you bow to fear.',
      'Power is not taken. It grows from within. Like you.',
    ],
    wanderer: [
      'I have walked a thousand groves. Yours has something the others lacked.',
      'Every forest speaks differently. This one whispers of resilience.',
      'I carry seeds from forgotten places. Let me plant hope here too.',
      'You need no single home when the whole forest welcomes you.',
      'I learned from dry deserts and drowned valleys alike. Adaptation is everything.',
      'The wind taught me patience. Your roots will teach you the rest.',
      'I belong nowhere, which means I can help anywhere. Grow, little one.',
      'No map leads here. But I always find where I am meant to be.',
    ],
    silent: [
      '…listen…',
      '…',
      '…grow…',
      '…still…',
      '…breathe…',
      '…',
      '…yes…',
      '…hold…',
    ],
  };

  const corruptionGuardianLines: Partial<Record<GuardianId, string[]>> = {
    deer: [
      'The shadows reach for you, little one. Drink deep and fight them back.',
      'Something taints the soil. We must not yield to the dark.',
      'The dew runs bitter now. But your roots still hold. Keep growing.',
    ],
    fox: [
      "Even my tricks can't outfox this darkness. Stay bright, sapling!",
      'The grove feels wrong — like moonlight swallowed whole. Let us burn it out.',
      'My flame flickers in this shadow. But it still burns for you.',
    ],
    kodama: [
      'The old forest weeps. Something has broken the sacred harmony.',
      'Corruption creeps through the roots. The spirits are frightened.',
      'Ancient darkness stirs. Your spirit must be stronger than fear.',
    ],
    mononoke: [
      'This corruption angers me. We will not fall to it — I promise you.',
      'The grove fights back. Your words must be louder than the blight.',
      'I have seen forests corrupted before. I will not watch another fall.',
    ],
    wanderer: [
      'I have seen corruption consume whole groves. This one still has hope.',
      'Every forest I have walked has faced this shadow. Only the tended ones survive.',
      'The dark does not linger where love is stubborn. Keep going.',
    ],
    silent: [
      '…danger…',
      '…',
      '…hold…',
      '…fight…',
      '…no…',
    ],
  };

  const getTalkLine = (guardianId: GuardianId, currentStage: number) => {
    if (corruptionScore >= 40) {
      const corrupt = corruptionGuardianLines[guardianId];
      if (corrupt) return corrupt[currentStage % corrupt.length];
    }
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
    setDailyEnergy(loadDailyEnergy());
    setTransitionKey((value) => value + 1);
    setPreviousStageIndex(null);
    setHasCollectedFruit(false);
    setHarvestedGuardianId(null);
    setHarvestScore(null);
    setTalkBoostTotal(0);
    setDailyNeed(pickNeed());
    setNeedMatchCount(0);
    setCareMessage('Pause, notice the sapling, then choose the care it is asking for.');
    setRegressionSeconds(REGRESSION_TIMEOUT);
    setCorruptionScore(0);
    setNeedFlash(false);
    setIsWilting(false);
    setHarvestHarmonyBonus(false);
    setActiveEvent(null);
    setEventsSurvived(0);
    setEventFlash(null);
    setSynergyBoostCount(0);
    setHarvestResult(null);
    milestoneEventTriggeredRef.current = false;
    activeEventRef.current = null;
    if (eventSpawnTimerRef.current) { window.clearTimeout(eventSpawnTimerRef.current); eventSpawnTimerRef.current = null; }
    if (eventFlashTimerRef.current) { window.clearTimeout(eventFlashTimerRef.current); eventFlashTimerRef.current = null; }
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

  const _synergyAny = selectedGuardian.synergy === 'any';
  const isTalkSynergyActive  = !atFinalStage && !hasCollectedFruit && dailyNeed === 'talk'   && (_synergyAny || selectedGuardian.synergy === 'talk');
  const isHearSynergyActive  = !atFinalStage && !hasCollectedFruit && dailyNeed === 'spirit' && (_synergyAny || selectedGuardian.synergy === 'spirit');
  const isWaterSynergyActive = !atFinalStage && !hasCollectedFruit && dailyNeed === 'water'  && (_synergyAny || selectedGuardian.synergy === 'water');
  const isSunSynergyActive   = !atFinalStage && !hasCollectedFruit && dailyNeed === 'sun'    && (_synergyAny || selectedGuardian.synergy === 'sun');
  const canOpenTalk = !isTalking && activeAction === null && !atFinalStage && !hasCollectedFruit && !isStorm && !selectedGuardian.talkPanelDisabled;

  const SHELL_BG = "linear-gradient(rgba(20,20,20,0.2),rgba(20,20,20,0.2)), url('/assets/backgrounds/spirit-sapling/game-bg.png') center/cover no-repeat";
  const actionButtons = (
    <div className="ww-sapling-actions" style={styles.buttonRow}>
      <button
        className="ww-sapling-action"
        type="button"
        style={{
          ...styles.iconButton,
          ...styles.talkSaplingButton,
          opacity: canOpenTalk ? 1 : 0.38,
          border: isTalkSynergyActive ? `1px solid ${selectedGuardian.synergyColor}` : undefined,
          borderTop: isTalkSynergyActive ? `2px solid ${selectedGuardian.synergyColor}` : undefined,
          boxShadow: isTalkSynergyActive
            ? `0 0 14px ${selectedGuardian.synergyColor}66, 0 8px 22px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)`
            : undefined,
        }}
        onClick={() => {
          if (!canOpenTalk) return;
          if (!energyDepleted) spendEnergy();
          setShowTalkPanel(true);
          resetRegressionTimer();
        }}
        disabled={!canOpenTalk}
      >
        <img className="ww-sapling-action-art" src={selectedGuardian.talkButton} alt={`Talk to ${selectedGuardian.name}`} style={styles.buttonArt} />
        <span className="ww-sapling-action-label" style={styles.actionLabel}>Talk to Spirit</span>
        <span className="ww-sapling-action-hint" style={styles.actionHint}>
          {selectedGuardian.talkPanelDisabled
            ? 'Silence is strength'
            : energyDepleted
              ? 'A quiet visit costs no orb'
              : isTalkSynergyActive
                ? '✦ Synergy active'
                : 'Kind words help it grow'}
        </span>
      </button>
      <button
        className="ww-sapling-action"
        type="button"
        style={{
          ...styles.iconButton,
          ...styles.talkButton,
          opacity: !canUseNurtureAction && activeAction !== 'talk' ? 0.55 : 1,
          border: isHearSynergyActive ? `1px solid ${selectedGuardian.synergyColor}` : undefined,
          borderTop: isHearSynergyActive ? `2px solid ${selectedGuardian.synergyColor}` : undefined,
          boxShadow: activeAction === 'talk'
            ? '0 0 18px rgba(236, 206, 145, 0.78), 0 0 32px rgba(236, 206, 145, 0.34)'
            : isHearSynergyActive
            ? `0 0 14px ${selectedGuardian.synergyColor}66, 0 8px 18px rgba(0,0,0,0.22)`
            : '0 8px 18px rgba(0,0,0,0.22)',
          transform: activeAction === 'talk' ? 'translateX(2px) scale(1.03)' : 'translateX(0) scale(1)',
        }}
        onClick={handleHearGuardian}
        disabled={!canUseNurtureAction}
      >
        <img className="ww-sapling-action-art" src={selectedGuardian.hearButton} alt={`Hear ${selectedGuardian.name}`} style={styles.buttonArt} />
        <span className="ww-sapling-action-label" style={styles.actionLabel}>Hear {selectedGuardian.name}</span>
        <span className="ww-sapling-action-hint" style={styles.actionHint}>{isHearSynergyActive ? '✦ Synergy active' : 'Guardian speaks'}</span>
      </button>
      <button
        className="ww-sapling-action"
        type="button"
        style={{
          ...styles.iconButton,
          ...styles.waterButton,
          opacity: !canUseNurtureAction && activeAction !== 'water' ? 0.55 : 1,
          border: isWaterSynergyActive ? `1px solid ${selectedGuardian.synergyColor}` : undefined,
          borderTop: isWaterSynergyActive ? `2px solid ${selectedGuardian.synergyColor}` : undefined,
          boxShadow: activeAction === 'water'
            ? '0 0 18px rgba(108, 177, 231, 0.82), 0 0 28px rgba(108, 177, 231, 0.32)'
            : isWaterSynergyActive
            ? `0 0 14px ${selectedGuardian.synergyColor}66, 0 8px 18px rgba(0,0,0,0.22)`
            : '0 8px 18px rgba(0,0,0,0.22)',
          transform: activeAction === 'water' ? 'translateX(2px) scale(1.03)' : 'translateX(0) scale(1)',
        }}
        onClick={() => handleSunOrWaterAction('water')}
        disabled={!canUseNurtureAction}
      >
        <img className="ww-sapling-action-art" src="/assets/backgrounds/spirit-sapling/buttons/water-bucket-button.png" alt="Water bucket" style={styles.buttonArt} />
        <span className="ww-sapling-action-label" style={styles.actionLabel}>Water</span>
        <span className="ww-sapling-action-hint" style={styles.actionHint}>{isWaterSynergyActive ? '✦ Synergy active' : 'Rain blessing'}</span>
      </button>
      <button
        className="ww-sapling-action"
        type="button"
        style={{
          ...styles.iconButton,
          ...styles.sunButton,
          opacity: !canUseNurtureAction && activeAction !== 'sun' ? 0.55 : 1,
          border: isSunSynergyActive ? `1px solid ${selectedGuardian.synergyColor}` : undefined,
          borderTop: isSunSynergyActive ? `2px solid ${selectedGuardian.synergyColor}` : undefined,
          boxShadow: activeAction === 'sun'
            ? '0 0 18px rgba(255, 208, 99, 0.86), 0 0 28px rgba(255, 208, 99, 0.36)'
            : isSunSynergyActive
            ? `0 0 14px ${selectedGuardian.synergyColor}66, 0 8px 18px rgba(0,0,0,0.22)`
            : '0 8px 18px rgba(0,0,0,0.22)',
          transform: activeAction === 'sun' ? 'translateX(2px) scale(1.03)' : 'translateX(0) scale(1)',
        }}
        onClick={() => handleSunOrWaterAction('sun')}
        disabled={!canUseNurtureAction}
      >
        <img className="ww-sapling-action-art" src="/assets/backgrounds/spirit-sapling/buttons/sun-light-button.png" alt="Sun light" style={styles.buttonArt} />
        <span className="ww-sapling-action-label" style={styles.actionLabel}>Sun</span>
        <span className="ww-sapling-action-hint" style={styles.actionHint}>{isSunSynergyActive ? '✦ Synergy active' : 'Warm leaves'}</span>
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
        <div className="ww-sapling-selection-wrap" style={styles.selectionWrap}>
          <div className="ww-sapling-selection-card" style={styles.selectionCard}>
            <h3 style={styles.selectionTitle}>Choose Your Guardian</h3>
            <p style={styles.selectionSubtitle}>Pick the spirit companion that will guide your sapling.</p>

            <div className="ww-sapling-guardian-grid" style={{
              ...styles.guardianGrid,
              gridTemplateColumns: availableGuardians.length > 4 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
            }}>
              {availableGuardians.map((guardian) => {
                const selected = guardian.id === selectedGuardianId;
                const isUnlockable = UNLOCKABLE_GUARDIAN_DEFS.some(u => u.id === guardian.id);
                return (
                  <button
                    key={guardian.id}
                    type="button"
                    onClick={() => setSelectedGuardianId(guardian.id)}
                    style={{
                      ...styles.guardianChoice,
                      border: selected
                        ? `3px solid ${guardian.synergyColor}`
                        : isUnlockable
                        ? `2px solid ${guardian.synergyColor}55`
                        : '2px solid rgba(255,255,255,0.4)',
                      backgroundColor: selected ? 'rgba(110, 86, 66, 0.48)' : 'rgba(34, 48, 33, 0.35)',
                      boxShadow: selected ? `0 0 18px ${guardian.synergyColor}44` : 'none',
                    }}
                  >
                    <img src={guardian.image} alt={guardian.name} style={{ ...styles.guardianChoiceImage, filter: guardian.imageFilter }} />
                    <span style={styles.guardianChoiceLabel}>{guardian.name}</span>
                    {isUnlockable && (
                      <span style={{ ...styles.guardianChoiceLabel, fontSize: 10, color: guardian.synergyColor, fontWeight: 400, letterSpacing: 0.3 }}>
                        ✦ Unlocked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {LOCKED_GUARDIANS.some(g => !saplingProgress.unlockedGuardians.includes(g.id)) && (
            <div style={styles.lockedSection}>
              <p style={styles.lockedSectionLabel}>Locked Guardians</p>
              <div className="ww-sapling-locked-grid" style={styles.lockedGrid}>
                {LOCKED_GUARDIANS.filter(locked => !saplingProgress.unlockedGuardians.includes(locked.id)).map((locked) => {
                  const progress = locked.unlockProgress(saplingProgress);
                  const pct = Math.min(100, Math.round((progress / locked.unlockTotal) * 100));
                  return (
                    <div key={locked.id} style={styles.lockedCard}>
                      <div style={styles.lockedImageWrap}>
                        <img
                          src={locked.placeholderImage}
                          alt={locked.name}
                          style={{ ...styles.lockedCardImage, filter: 'grayscale(0.85) brightness(0.45) blur(1px)' }}
                        />
                        <span style={styles.lockIcon}>🔒</span>
                      </div>
                      <span style={styles.lockedName}>{locked.name}</span>
                      <span style={styles.lockedLore}>{locked.lore}</span>
                      <div style={styles.progressBarWrap}>
                        <div style={{ ...styles.progressBarFill, width: `${pct}%` }} />
                      </div>
                      <span style={styles.lockedUnlockLabel}>{locked.unlockLabel} ({progress}/{locked.unlockTotal})</span>
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            <div className="ww-sapling-selection-actions" style={styles.selectionActions}>
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

  if (screen === 'harvest' && harvestedGuardian) {
    return (
      <GameShell
        title="Spirit Sapling"
        onExit={onExit}
        background="linear-gradient(rgba(10,24,16,0.16),rgba(10,24,16,0.16)), url('/assets/backgrounds/spirit-sapling/gentle-harvest-clearing.png') center/cover no-repeat"
        accentColor="#F0EAD2"
      >
        <GentleHarvestGame
          guardianName={harvestedGuardian.name}
          guardianImage={harvestedGuardian.image}
          guardianImageFilter={harvestedGuardian.imageFilter}
          fruitKind={harvestedGuardian.fruitKind}
          fruitName={harvestedGuardian.harvestName}
          basketImage={basketButtonImage}
          onComplete={handleHarvestComplete}
        />
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
                {harvestResult && (
                  <>
                    <div style={styles.scoreRow}>
                      <span style={styles.scoreDetail}>Fruit gathered ×{harvestResult.collected}</span>
                      <span style={styles.scoreDetail}>+{harvestResult.collected * 10}</span>
                    </div>
                    {harvestResult.patienceBonus > 0 && (
                      <div style={styles.scoreRow}>
                        <span style={styles.scoreDetail}>Gentle hands bonus</span>
                        <span style={styles.scoreDetail}>+{harvestResult.patienceBonus}</span>
                      </div>
                    )}
                  </>
                )}
                {harvestHarmonyBonus && (
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
                {needMatchCount > 0 && (
                  <div style={styles.scoreRow}>
                    <span style={styles.scoreDetail}>Need synergy 🌿 ×{needMatchCount}</span>
                    <span style={styles.scoreDetail}>+{needMatchCount * 15}</span>
                  </div>
                )}
                {synergyBoostCount > 0 && (
                  <div style={styles.scoreRow}>
                    <span style={{ ...styles.scoreDetail, color: harvestedGuardian?.synergyColor ?? '#F2CC8F' }}>
                      Guardian synergy ✦ ×{synergyBoostCount}
                    </span>
                    <span style={{ ...styles.scoreDetail, color: harvestedGuardian?.synergyColor ?? '#F2CC8F' }}>
                      +{synergyBoostCount * 10}
                    </span>
                  </div>
                )}
                {eventsSurvived > 0 && (
                  <div style={styles.scoreRow}>
                    <span style={styles.scoreDetail}>Events survived ⚡ ×{eventsSurvived}</span>
                    <span style={styles.scoreDetail}>+{eventsSurvived * 50}</span>
                  </div>
                )}
                {corruptionScore > 0 && (
                  <div style={styles.scoreRow}>
                    <span style={{ ...styles.scoreDetail, color: CORRUPTION_TEXT_COLOR[Math.max(1, corruptionStage)] }}>
                      {corruptionStage >= 1 ? `${CORRUPTION_LABEL_TEXT[corruptionStage]} grove` : 'Grove corruption'}
                    </span>
                    <span style={{ ...styles.scoreDetail, color: CORRUPTION_TEXT_COLOR[Math.max(1, corruptionStage)] }}>
                      −{Math.floor(corruptionScore * 0.5)}
                    </span>
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
              <img src={harvestedGuardian.image} alt={harvestedGuardian.name} style={{ ...styles.celebrationGuardian, filter: harvestedGuardian.imageFilter ?? 'drop-shadow(0 16px 20px rgba(0,0,0,0.34))' }} />
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
      <div className="ww-sapling-game-layout" style={styles.gameLayout}>
        <div className="ww-sapling-game-panel" style={styles.saplingPanel}>
          <div className="ww-sapling-hud" style={styles.saplingHud}>
            <div className="ww-sapling-stage-pill" style={styles.stagePill}>
              Stage {stageIndex + 1} / {growthStages.length}
            </div>

            {!atFinalStage && !hasCollectedFruit ? (
              <div className="ww-sapling-need" style={{
                ...styles.needIndicator,
                borderColor: needFlash
                  ? 'rgba(120,220,100,0.72)'
                  : isWilting
                  ? 'rgba(235,100,60,0.72)'
                  : NEED_CONFIG[dailyNeed].border,
                boxShadow: needFlash
                  ? '0 0 14px rgba(120,220,100,0.5)'
                  : isWilting
                  ? '0 0 14px rgba(235,100,60,0.4)'
                  : `0 0 8px ${NEED_CONFIG[dailyNeed].glow}`,
                animation: needFlash
                  ? 'ww-need-flash 1.2s ease-out'
                  : isWilting
                  ? 'ww-wilt-pulse 1.2s ease-in-out infinite'
                  : 'none',
              }}>
                <span style={{
                  color: needFlash ? '#90EE90' : isWilting ? '#EB6440' : NEED_CONFIG[dailyNeed].color,
                  fontFamily: bodyFontFamily,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                }}>
                  {needFlash
                    ? 'Need met! ✓'
                    : isWilting
                    ? `${NEED_CONFIG[dailyNeed].wiltLabel} — ${regressionSeconds}s`
                    : `${NEED_CONFIG[dailyNeed].label} · ${regressionSeconds}s`}
                </span>
              </div>
            ) : <div />}

            <div className="ww-sapling-energy" style={styles.energyPanel}>
              <div style={styles.energyOrbRow}>
                {Array.from({ length: DAILY_ENERGY_TOTAL }, (_, i) => {
                  const filled = i < dailyEnergy;
                  const isLow = dailyEnergy <= 3 && dailyEnergy > 0;
                  return (
                    <div key={i} style={{
                      ...styles.energyOrb,
                      background: filled
                        ? isLow
                          ? 'radial-gradient(circle at 35% 35%, #FFD0A0, #E06020)'
                          : 'radial-gradient(circle at 35% 35%, #D8F0B8, #70C040)'
                        : 'rgba(30,30,30,0.55)',
                      boxShadow: filled
                        ? isLow
                          ? '0 0 5px rgba(220,100,30,0.6)'
                          : '0 0 5px rgba(110,200,60,0.55)'
                        : 'none',
                      opacity: filled ? 1 : 0.28,
                      animation: filled && isLow ? 'ww-wilt-pulse 1.4s ease-in-out infinite' : 'none',
                    }} />
                  );
                })}
              </div>
              <div style={styles.energyTextWrap}>
                <p style={{
                  ...styles.energyLabel,
                  color: energyDepleted ? '#D06040' : dailyEnergy <= 3 ? '#E09050' : '#D8EFC4',
                }}>
                  Spirit Energy {dailyEnergy}/{DAILY_ENERGY_TOTAL}
                </p>
                <p className="ww-sapling-energy-hint" style={styles.energyHint}>
                  {energyDepleted
                    ? 'Quiet visits remain available'
                    : dailyEnergy <= 3
                    ? 'Running low — use wisely'
                    : 'Daily allowance'}
                </p>
              </div>
            </div>

            <aside className="ww-sapling-guardian" style={styles.guardianRail}>
              <div
                style={{
                  ...styles.guardianRailButton,
                  border: `2px solid ${selectedGuardian.synergyColor}aa`,
                  background: 'rgba(100, 72, 38, 0.62)',
                  boxShadow: `0 0 18px ${selectedGuardian.synergyColor}33, 0 4px 14px rgba(0,0,0,0.35)`,
                  cursor: 'default',
                }}
                aria-label={`${selectedGuardian.name}, your bound guardian for this sapling`}
              >
                <img src={selectedGuardian.image} alt={selectedGuardian.name} style={{ ...styles.guardianRailImage, filter: selectedGuardian.imageFilter }} />
                <div style={styles.guardianRailMeta}>
                  <span style={styles.guardianRailName}>{selectedGuardian.name}</span>
                  <span style={{ ...styles.guardianSynergyBadge, color: selectedGuardian.synergyColor, borderColor: `${selectedGuardian.synergyColor}88` }}>
                    bound guide
                  </span>
                </div>
              </div>
            </aside>
          </div>

          <div className="ww-sapling-frame" style={{
            ...styles.saplingFrame,
            border: isWilting
              ? '1px solid rgba(235,100,60,0.58)'
              : `1px solid ${CORRUPTION_BORDER[corruptionStage]}`,
            boxShadow: isWilting
              ? 'inset 0 2px 24px rgba(0,0,0,0.32), 0 0 28px rgba(235,100,60,0.22)'
              : `inset 0 2px 24px rgba(0,0,0,0.28), 0 0 22px ${CORRUPTION_GLOW[corruptionStage]}`,
            transition: 'border-color 0.8s ease, box-shadow 0.8s ease',
          }}>
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
              style={{
                ...(isCurrentStageLoaded ? styles.saplingImageCurrent : styles.saplingImageCurrentHidden),
                filter: corruptionStage >= 3
                  ? `saturate(${Math.max(0.35, 1 - (corruptionScore - 60) / 90)}) brightness(${Math.max(0.68, 1 - (corruptionScore - 60) / 130)})`
                  : undefined,
                transition: 'filter 1.8s ease',
              }}
              onLoad={() => {
                setGrowthImageReady((current) => (current[currentStageSrc] ? current : { ...current, [currentStageSrc]: true }));
              }}
            />
            {/* Corruption darkness — grows with grove corruption score */}
            {corruptionScore > 10 ? (
              <div style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 3,
                background: `rgba(8, 3, 3, ${Math.min(0.45, corruptionScore / 220)})`,
                transition: 'background 2s ease',
                mixBlendMode: 'multiply' as React.CSSProperties['mixBlendMode'],
              }} />
            ) : null}
            {/* Dark corner tendrils — stage 3+ */}
            {corruptionStage >= 3 ? (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
                background: `radial-gradient(ellipse at 0% 100%, rgba(30,0,15,${Math.min(0.58, 0.28 + (corruptionScore - 60) / 150)}) 0%, transparent 52%), radial-gradient(ellipse at 100% 100%, rgba(30,0,15,${Math.min(0.58, 0.28 + (corruptionScore - 60) / 150)}) 0%, transparent 52%), radial-gradient(ellipse at 50% 0%, rgba(20,0,10,${Math.min(0.35, (corruptionScore - 60) / 200)}) 0%, transparent 45%)`,
                transition: 'all 2s ease',
              }} />
            ) : null}
            {/* Floating dark spores — stage 2+ */}
            {corruptionStage >= 2 ? (
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, overflow: 'hidden' }}>
                {SPORE_POSITIONS.slice(0, corruptionStage === 2 ? 5 : corruptionStage === 3 ? 8 : 10).map((sp, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    bottom: `${8 + i * 6}%`,
                    left: `${sp.left}%`,
                    width: sp.size,
                    height: Math.ceil(sp.size * 0.62),
                    borderRadius: '50%',
                    background: 'rgba(25, 4, 20, 0.78)',
                    ['--spore-opacity' as string]: sporeOpacity,
                    animation: `ww-spore-float ${sp.dur}s ease-out ${sp.delay}s infinite`,
                  }} />
                ))}
              </div>
            ) : null}
            {/* Corruption stage label — stage 1+ */}
            {corruptionStage >= 1 && !atFinalStage && !hasCollectedFruit ? (
              <div style={{
                position: 'absolute', bottom: 14, left: 14, zIndex: 7,
                padding: '4px 11px', borderRadius: 999,
                background: 'rgba(18, 3, 3, 0.84)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${CORRUPTION_BORDER[corruptionStage]}`,
                color: CORRUPTION_TEXT_COLOR[corruptionStage],
                fontFamily: bodyFontFamily,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.9,
                textTransform: 'uppercase' as React.CSSProperties['textTransform'],
                animation: corruptionStage >= 3 ? 'ww-corruption-pulse 2.2s ease-in-out infinite' : 'none',
              }}>
                ☠ {CORRUPTION_LABEL_TEXT[corruptionStage]}
              </div>
            ) : null}
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
            {activeEffect === 'water' ? (
              <>
                <div key={`rain-drops-${effectKey}`} style={styles.rainDropletsOverlay} />
                <img key={`rain-l-${effectKey}`} src="/assets/animation/rain-1.gif" alt="" aria-hidden="true" style={styles.rainCloudLeft} />
                <img key={`rain-r-${effectKey}`} src="/assets/animation/rain-2.gif" alt="" aria-hidden="true" style={styles.rainCloudRight} />
              </>
            ) : null}
            {activeEffect === 'sun' ? (
              <img key={`sun-sweep-${effectKey}`} src="/assets/backgrounds/spirit-sapling/buttons/sun-light-button.png" alt="" aria-hidden="true" style={styles.sunSweepImg} />
            ) : null}
            {/* Random event overlay */}
            {activeEvent ? (
              <>
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
                  background: EVENT_CONFIG[activeEvent.type].bgColor,
                  transition: 'background 0.6s ease',
                }} />
                <div style={{
                  ...styles.eventBanner,
                  borderColor: EVENT_CONFIG[activeEvent.type].borderColor,
                  boxShadow: `0 12px 36px rgba(0,0,0,0.52), 0 0 24px ${EVENT_CONFIG[activeEvent.type].borderColor}`,
                }}>
                  <div style={styles.eventBannerTop}>
                    <span style={{ ...styles.eventLabel, color: EVENT_CONFIG[activeEvent.type].textColor }}>
                      {EVENT_CONFIG[activeEvent.type].icon} {EVENT_CONFIG[activeEvent.type].label}
                    </span>
                    <span style={{
                      ...styles.eventTimer,
                      color: activeEvent.secondsLeft <= 8 ? '#FF6040' : EVENT_CONFIG[activeEvent.type].textColor,
                    }}>
                      {activeEvent.secondsLeft}s
                    </span>
                  </div>
                  <p style={styles.eventDescription}>{EVENT_CONFIG[activeEvent.type].description}</p>
                  {EVENT_CONFIG[activeEvent.type].counterHint ? (
                    <p style={{ ...styles.eventHint, color: EVENT_CONFIG[activeEvent.type].textColor }}>
                      ➤ {EVENT_CONFIG[activeEvent.type].counterHint}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
            {/* Event resolution flash */}
            {eventFlash ? (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 16,
                background: eventFlash === 'success'
                  ? 'rgba(50,180,80,0.22)'
                  : 'rgba(200,50,30,0.22)',
                animation: 'ww-event-flash 2s ease-out forwards',
              }} />
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
          </div>

          <div className="ww-sapling-controls" style={styles.controlsTray}>
            {!canCollectFruit ? actionButtons : null}
            {canCollectFruit ? (
              <div className="ww-sapling-harvest-row" style={styles.harvestRow}>
                <button
                  type="button"
                  className="ww-sapling-harvest-button"
                  style={{
                    ...styles.collectButton,
                    boxShadow: activeAction === 'harvest'
                      ? '0 0 22px rgba(242, 204, 143, 0.9), 0 0 40px rgba(242, 204, 143, 0.38)'
                      : '0 8px 24px rgba(0,0,0,0.32)',
                    transform: activeAction === 'harvest' ? 'translateY(-3px) scale(1.04)' : 'translateY(0) scale(1)',
                  }}
                  onClick={handleCollectFruit}
                >
                  <img src={basketButtonImage} alt="Collect fruit basket" style={styles.collectButtonArt} />
                  <span style={styles.collectLabel}>Begin Gentle Harvest</span>
                </button>
              </div>
            ) : null}
          </div>

          <p className="ww-sapling-status" style={{
            ...styles.statusText,
            color: corruptionStage >= 3 ? CORRUPTION_TEXT_COLOR[corruptionStage] : 'rgba(240,234,210,0.62)',
            transition: 'color 1.2s ease',
          }}>
            {canCollectFruit
              ? `Your ${selectedGuardian.sacredTreeName.toLowerCase()} is ready. Select the basket to gather the ${selectedGuardian.harvestName}.`
              : atFinalStage
              ? `${selectedGuardian.name} has guided the sapling into its sacred tree form.`
              : corruptionStage >= 3
              ? 'The grove is corrupted. Nurture urgently before it is too late.'
              : corruptionStage >= 2
              ? 'Blight spreads through the grove. Counter it with care.'
              : careMessage}
          </p>
        </div>
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
    maxWidth: 1480,
    margin: '0 auto',
    width: '100%',
    flex: 1,
    minHeight: 0,
    padding: '10px 18px 14px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  saplingPanel: {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 22,
    background: 'linear-gradient(180deg, rgba(22, 36, 18, 0.52) 0%, rgba(10, 20, 10, 0.58) 100%)',
    border: '1px solid rgba(130, 190, 100, 0.2)',
    padding: '14px 14px 10px',
    boxShadow: '0 22px 56px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.07)',
    display: 'flex',
    flexDirection: 'column' as React.CSSProperties['flexDirection'],
    gap: 8,
  },
  saplingHud: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(150px, 1fr) minmax(220px, auto) minmax(180px, auto)',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  saplingFrame: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    background: 'linear-gradient(180deg, rgba(8,16,10,0.38) 0%, rgba(4,10,6,0.54) 100%)',
    width: 'min(100%, 110vh, 1320px)',
    minHeight: 0,
    maxHeight: 'none',
    aspectRatio: '16 / 9',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(100,160,80,0.16)',
    boxShadow: 'inset 0 2px 24px rgba(0,0,0,0.28)',
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
  rainDropletsOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(/assets/animation/rain-droplets.png)',
    backgroundSize: '42%',
    backgroundRepeat: 'repeat',
    pointerEvents: 'none',
    zIndex: 4,
    mixBlendMode: 'overlay' as React.CSSProperties['mixBlendMode'],
    animation: 'ww-rain-droplets-fade 4.5s ease-in-out forwards',
  },
  rainCloudLeft: {
    position: 'absolute',
    top: '6%',
    left: 0,
    width: 195,
    height: 'auto',
    pointerEvents: 'none',
    zIndex: 5,
    animation: 'ww-rain-sweep-l 3.8s ease-in-out forwards',
  },
  rainCloudRight: {
    position: 'absolute',
    top: '26%',
    right: 0,
    width: 170,
    height: 'auto',
    pointerEvents: 'none',
    zIndex: 5,
    animation: 'ww-rain-sweep-r 4.2s ease-in-out 0.4s forwards',
  },
  sunSweepImg: {
    position: 'absolute',
    top: '10%',
    left: 0,
    width: 160,
    height: 'auto',
    pointerEvents: 'none',
    zIndex: 10,
    filter: 'drop-shadow(0 0 28px rgba(255,200,60,0.9)) drop-shadow(0 0 55px rgba(255,150,20,0.55))',
    animation: 'ww-sun-sweep 3.5s ease-in-out forwards',
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
  eventBanner: {
    position: 'absolute',
    left: '50%',
    bottom: 100,
    transform: 'translateX(-50%)',
    zIndex: 9,
    width: 'min(58%, 320px)',
    borderRadius: 16,
    padding: '13px 18px 11px',
    background: 'rgba(8, 6, 16, 0.90)',
    backdropFilter: 'blur(14px)',
    border: '1px solid',
    animation: 'ww-event-appear 0.45s cubic-bezier(0.2,1.2,0.25,1)',
    textAlign: 'center' as React.CSSProperties['textAlign'],
    pointerEvents: 'none',
  },
  eventBannerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventLabel: {
    fontFamily: titleFontFamily,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  eventTimer: {
    fontFamily: numberFontFamily,
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
    transition: 'color 0.3s ease',
  },
  eventDescription: {
    margin: '0 0 6px',
    color: 'rgba(240,230,210,0.82)',
    fontFamily: uiFontFamily,
    fontSize: 12,
    lineHeight: 1.45,
    letterSpacing: 0.2,
  },
  eventHint: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  needIndicator: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: '5px 16px',
    borderRadius: 999,
    backdropFilter: 'blur(8px)',
    background: 'rgba(6, 14, 6, 0.80)',
    border: '1px solid',
    whiteSpace: 'nowrap' as React.CSSProperties['whiteSpace'],
    transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
  },
  stagePill: {
    position: 'relative',
    padding: '5px 13px',
    borderRadius: 999,
    background: 'rgba(8, 18, 8, 0.76)',
    border: '1px solid rgba(160,215,120,0.32)',
    color: '#B8DCA0',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.9,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
    backdropFilter: 'blur(8px)',
    whiteSpace: 'nowrap',
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
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    width: '100%',
    gap: 10,
  },
  controlsTray: {
    width: '100%',
  },
  harvestRow: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'auto',
  },
  energyPanel: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row' as React.CSSProperties['flexDirection'],
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    padding: '8px 12px 9px',
    borderRadius: 12,
    border: '1px solid rgba(180,220,140,0.22)',
    background: 'rgba(8, 16, 8, 0.72)',
    backdropFilter: 'blur(10px)',
  },
  energyOrbRow: {
    display: 'flex',
    flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
    gap: 4,
    maxWidth: 80,
  },
  energyOrb: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.12)',
    flexShrink: 0,
    transition: 'background 0.4s ease, box-shadow 0.4s ease, opacity 0.4s ease',
  },
  energyTextWrap: {
    minWidth: 0,
    textAlign: 'right' as React.CSSProperties['textAlign'],
  },
  energyLabel: {
    margin: 0,
    color: '#D8EFC4',
    fontFamily: headingFontFamily,
    fontSize: 16,
    lineHeight: 1,
    letterSpacing: 0.2,
  },
  energyHint: {
    margin: '3px 0 0',
    color: 'rgba(220,235,200,0.6)',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    letterSpacing: 0.2,
    lineHeight: 1.3,
  },
  iconButton: {
    border: '1px solid rgba(180,220,150,0.26)',
    borderTop: '2px solid rgba(180,220,150,0.48)',
    background: 'linear-gradient(170deg, rgba(26,50,22,0.93), rgba(12,28,14,0.97))',
    borderRadius: 14,
    padding: '9px 12px 9px 9px',
    width: '100%',
    minWidth: 0,
    minHeight: 82,
    boxSizing: 'border-box',
    transition: 'transform 160ms ease, box-shadow 160ms ease, opacity 180ms ease',
    cursor: 'pointer',
    display: 'grid',
    gridTemplateColumns: '58px minmax(0, 1fr)',
    gridTemplateRows: 'auto auto',
    justifyItems: 'start',
    alignItems: 'center',
    columnGap: 9,
    rowGap: 3,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 22px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  talkSaplingButton: {
    borderTop: '2px solid rgba(140,215,120,0.62)',
    background: 'linear-gradient(170deg, rgba(28,62,24,0.93), rgba(14,38,16,0.97))',
  },
  buttonEmoji: {
    fontSize: 28,
    lineHeight: 1,
    display: 'block',
  },
  talkButton: {
    borderTop: '2px solid rgba(235,188,88,0.62)',
    background: 'linear-gradient(170deg, rgba(48,66,20,0.93), rgba(26,40,12,0.97))',
  },
  waterButton: {
    borderTop: '2px solid rgba(100,200,235,0.62)',
    background: 'linear-gradient(170deg, rgba(16,50,68,0.93), rgba(8,28,44,0.97))',
  },
  sunButton: {
    borderTop: '2px solid rgba(255,212,68,0.62)',
    background: 'linear-gradient(170deg, rgba(54,62,16,0.93), rgba(30,40,8,0.97))',
  },
  buttonArt: {
    width: 58,
    height: 58,
    gridRow: '1 / 3',
    objectFit: 'contain' as React.CSSProperties['objectFit'],
    display: 'block',
    filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.38))',
  },
  actionLabel: {
    color: '#EEE8D4',
    fontFamily: headingFontFamily,
    fontSize: 15,
    lineHeight: 1,
    textAlign: 'left' as React.CSSProperties['textAlign'],
    letterSpacing: 0.3,
  },
  actionHint: {
    color: 'rgba(230,220,196,0.55)',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    lineHeight: 1.1,
    letterSpacing: 0.15,
    textAlign: 'left' as React.CSSProperties['textAlign'],
  },
  collectButton: {
    border: '1px solid rgba(242,204,143,0.45)',
    borderTop: '2px solid rgba(242,204,143,0.7)',
    background: 'linear-gradient(160deg, rgba(52,70,28,0.92), rgba(28,40,14,0.96))',
    borderRadius: 18,
    padding: '8px 18px 8px 10px',
    width: 'min(100%, 320px)',
    minHeight: 76,
    transition: 'transform 180ms ease, box-shadow 180ms ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row' as React.CSSProperties['flexDirection'],
    alignItems: 'center',
    gap: 8,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
  },
  collectButtonArt: {
    width: 64,
    height: 64,
    objectFit: 'contain' as React.CSSProperties['objectFit'],
    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
  },
  collectLabel: {
    color: '#F5E8C0',
    fontFamily: headingFontFamily,
    fontSize: 17,
    lineHeight: 1,
    textAlign: 'center' as React.CSSProperties['textAlign'],
    letterSpacing: 0.3,
  },
  collectHint: {
    color: 'rgba(245,239,224,0.65)',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    lineHeight: 1.2,
    textAlign: 'center' as React.CSSProperties['textAlign'],
  },
  statusText: {
    margin: '2px 0 0',
    color: 'rgba(240,234,210,0.62)',
    fontFamily: bodyFontFamily,
    fontSize: 13,
    lineHeight: 1.4,
    letterSpacing: 0.2,
    textAlign: 'center' as React.CSSProperties['textAlign'],
  },
  guardianRail: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    minWidth: 0,
  },
  guardianRailButton: {
    borderRadius: 14,
    padding: '6px 10px 6px 6px',
    cursor: 'pointer',
    width: '100%',
    minWidth: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row' as React.CSSProperties['flexDirection'],
    alignItems: 'center',
    gap: 4,
    boxSizing: 'border-box' as React.CSSProperties['boxSizing'],
    transition: 'transform 150ms ease, box-shadow 150ms ease',
    backdropFilter: 'blur(10px)',
  },
  guardianRailName: {
    color: 'rgba(240,228,200,0.72)',
    fontFamily: bodyFontFamily,
    fontSize: 10,
    letterSpacing: 0.6,
    textAlign: 'left' as React.CSSProperties['textAlign'],
    lineHeight: 1,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
  },
  guardianRailImage: {
    width: 52,
    height: 52,
    aspectRatio: '1 / 1',
    objectFit: 'contain',
    display: 'block',
    margin: 0,
    flexShrink: 0,
  },
  guardianRailMeta: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 5,
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
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
    padding: '14px 28px',
    minWidth: 200,
    cursor: 'pointer',
  },
  celebrationSecondaryAction: {
    border: 'none',
    borderRadius: 12,
    background: 'rgba(233, 227, 201, 0.95)',
    color: '#5D3F2B',
    fontFamily: bodyFontFamily,
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1,
    padding: '14px 28px',
    minWidth: 200,
    cursor: 'pointer',
  },

  guardianSynergyBadge: {
    fontSize: 10,
    fontWeight: 700,
    fontFamily: uiFontFamily,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
    padding: '2px 7px',
    borderRadius: 999,
    border: '1px solid',
    background: 'rgba(0,0,0,0.42)',
    lineHeight: 1,
    whiteSpace: 'nowrap' as React.CSSProperties['whiteSpace'],
  },
  lockedSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  lockedSectionLabel: {
    margin: '0 0 10px',
    color: 'rgba(240,234,210,0.45)',
    fontFamily: uiFontFamily,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as React.CSSProperties['textTransform'],
    textAlign: 'center' as React.CSSProperties['textAlign'],
  },
  lockedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  lockedCard: {
    borderRadius: 12,
    padding: '10px 10px 12px',
    background: 'rgba(16, 12, 8, 0.55)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column' as React.CSSProperties['flexDirection'],
    alignItems: 'center',
    gap: 6,
  },
  lockedImageWrap: {
    position: 'relative' as React.CSSProperties['position'],
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: 80,
  },
  lockedCardImage: {
    width: 80,
    height: 80,
    objectFit: 'contain' as React.CSSProperties['objectFit'],
    borderRadius: 8,
    transition: 'filter 0.4s ease',
  },
  lockIcon: {
    position: 'absolute' as React.CSSProperties['position'],
    fontSize: 22,
    lineHeight: 1,
  },
  unlockBadge: {
    position: 'absolute' as React.CSSProperties['position'],
    bottom: -4,
    fontSize: 10,
    fontWeight: 700,
    color: '#F2CC8F',
    fontFamily: uiFontFamily,
    background: 'rgba(0,0,0,0.72)',
    padding: '2px 6px',
    borderRadius: 999,
    border: '1px solid rgba(242,204,143,0.5)',
    whiteSpace: 'nowrap' as React.CSSProperties['whiteSpace'],
  },
  lockedName: {
    fontFamily: titleFontFamily,
    color: 'rgba(240,234,210,0.75)',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center' as React.CSSProperties['textAlign'],
    lineHeight: 1.1,
  },
  lockedLore: {
    fontFamily: uiFontFamily,
    color: 'rgba(240,234,210,0.45)',
    fontSize: 11,
    lineHeight: 1.4,
    textAlign: 'center' as React.CSSProperties['textAlign'],
  },
  progressBarWrap: {
    width: '100%',
    height: 5,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.1)',
    overflow: 'hidden' as React.CSSProperties['overflow'],
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg, #8CD778, #F2CC8F)',
    transition: 'width 0.6s ease',
  },
  lockedUnlockLabel: {
    fontFamily: uiFontFamily,
    color: 'rgba(240,234,210,0.38)',
    fontSize: 10,
    textAlign: 'center' as React.CSSProperties['textAlign'],
    lineHeight: 1.3,
    letterSpacing: 0.2,
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
