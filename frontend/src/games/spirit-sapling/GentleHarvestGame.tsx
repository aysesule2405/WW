import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { titleFontFamily, uiFontFamily } from '../../theme/typography'

type Props = {
  guardianName: string
  guardianImage: string
  guardianImageFilter?: string
  fruitKind: 'apple' | 'peach' | 'pear' | 'persimmon'
  fruitName: string
  basketImage: string
  onComplete: (result: HarvestResult) => void
}

export type HarvestResult = {
  collected: number
  hastyAttempts: number
  patienceBonus: number
}

type FruitState = 'ripening' | 'ready' | 'collected'

type HarvestFruit = {
  id: number
  src: string
  left: number
  top: number
  readyAfterMs: number
}

const POSITIONS = [
  { left: 13, top: 19 },
  { left: 29, top: 31 },
  { left: 45, top: 17 },
  { left: 62, top: 30 },
  { left: 78, top: 18 },
  { left: 21, top: 51 },
  { left: 52, top: 50 },
  { left: 73, top: 49 },
]

const READY_DELAYS = [900, 2500, 1500, 3400, 2100, 3900, 2900, 4500]
const TARGET_FRUIT = 6

export default function GentleHarvestGame({
  guardianName,
  guardianImage,
  guardianImageFilter,
  fruitKind,
  fruitName,
  basketImage,
  onComplete,
}: Props) {
  const finishTimerRef = useRef<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [collectedIds, setCollectedIds] = useState<number[]>([])
  const [hastyAttempts, setHastyAttempts] = useState(0)
  const [shakingFruit, setShakingFruit] = useState<number | null>(null)
  const [message, setMessage] = useState('Watch each fruit. Its glow and gentle lift mean it is ready.')
  const [isFinishing, setIsFinishing] = useState(false)

  const fruits = useMemo<HarvestFruit[]>(
    () => POSITIONS.map((position, index) => ({
      id: index,
      src: `/assets/backgrounds/spirit-sapling/fruits/${fruitKind}-${(index % 4) + 1}.png`,
      left: position.left,
      top: position.top,
      readyAfterMs: READY_DELAYS[index],
    })),
    [fruitKind],
  )

  useEffect(() => {
    const timer = window.setInterval(() => setElapsedMs((elapsed) => elapsed + 120), 120)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => () => {
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current)
  }, [])

  const stateFor = (fruit: HarvestFruit): FruitState => {
    if (collectedIds.includes(fruit.id)) return 'collected'
    return elapsedMs >= fruit.readyAfterMs ? 'ready' : 'ripening'
  }

  const collectFruit = (fruit: HarvestFruit) => {
    if (isFinishing || collectedIds.includes(fruit.id)) return

    if (stateFor(fruit) !== 'ready') {
      setHastyAttempts((count) => count + 1)
      setShakingFruit(fruit.id)
      setMessage('Not yet—the stem is still holding tight. Give this fruit another moment.')
      window.setTimeout(() => setShakingFruit((current) => current === fruit.id ? null : current), 520)
      return
    }

    const nextCollected = [...collectedIds, fruit.id]
    setCollectedIds(nextCollected)
    setMessage(nextCollected.length < TARGET_FRUIT
      ? `${guardianName} feels the branch relax. Keep listening for the next ripe fruit.`
      : 'The tree offers its harvest. The remaining fruit will become seeds for another season.')

    if (nextCollected.length >= TARGET_FRUIT) {
      setIsFinishing(true)
      const patienceBonus = Math.max(0, 30 - hastyAttempts * 5)
      finishTimerRef.current = window.setTimeout(() => {
        onComplete({
          collected: nextCollected.length,
          hastyAttempts,
          patienceBonus,
        })
      }, 1200)
    }
  }

  return (
    <div className="ww-harvest-page" style={styles.page}>
      <div style={styles.scrim} />
      <header className="ww-harvest-header" style={styles.header}>
        <div>
          <p style={styles.overline}>Final care ritual</p>
          <h2 style={styles.title}>The Gentle Harvest</h2>
          <p style={styles.instructions}>
            Gather {TARGET_FRUIT} ripe {fruitName}. Fruit is ready when it lifts, glows, and says “Ready.”
          </p>
        </div>
        <div className="ww-harvest-progress" style={styles.progressCard} aria-live="polite">
          <span style={styles.progressValue}>{collectedIds.length}/{TARGET_FRUIT}</span>
          <span style={styles.progressLabel}>gathered</span>
        </div>
      </header>

      <section className="ww-harvest-grove" style={styles.grove} aria-label={`Harvest ripe ${fruitName}`}>
        {fruits.map((fruit) => {
          const state = stateFor(fruit)
          if (state === 'collected') return null
          const ready = state === 'ready'
          return (
            <button
              key={fruit.id}
              className="ww-harvest-fruit"
              type="button"
              onClick={() => collectFruit(fruit)}
              aria-label={ready ? `Ripe ${fruitKind}, ready to gather` : `${fruitKind} still ripening`}
              style={{
                ...styles.fruitButton,
                left: `${fruit.left}%`,
                top: `${fruit.top}%`,
                animation: shakingFruit === fruit.id
                  ? 'ww-harvest-shake 520ms ease'
                  : ready
                    ? 'ww-harvest-ready 1.8s ease-in-out infinite'
                    : 'ww-harvest-ripen 2.8s ease-in-out infinite',
                filter: ready
                  ? 'saturate(1.12) drop-shadow(0 0 15px rgba(255,221,125,0.9))'
                  : 'saturate(0.62) brightness(0.76)',
              }}
            >
              <img src={fruit.src} alt="" aria-hidden="true" style={styles.fruitImage} />
              <span style={{
                ...styles.fruitStatus,
                color: ready ? '#FFF1B2' : 'rgba(240,234,210,0.78)',
                borderColor: ready ? 'rgba(255,225,135,0.72)' : 'rgba(240,234,210,0.2)',
              }}>
                {ready ? 'Ready' : 'Ripening'}
              </span>
            </button>
          )
        })}

        <div className="ww-harvest-message" style={styles.messageCard} aria-live="polite">
          <img
            src={guardianImage}
            alt=""
            aria-hidden="true"
            style={{ ...styles.guardian, filter: guardianImageFilter ?? styles.guardian.filter }}
          />
          <p style={styles.message}>{message}</p>
        </div>

        <div className="ww-harvest-basket" style={styles.basketWrap}>
          <img src={basketImage} alt={`Basket for ${fruitName}`} style={styles.basket} />
          <div style={styles.basketFruitRow} aria-hidden="true">
            {collectedIds.map((id) => (
              <img
                key={id}
                src={`/assets/backgrounds/spirit-sapling/fruits/${fruitKind}-${(id % 4) + 1}.png`}
                alt=""
                style={styles.basketFruit}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="ww-harvest-footer" style={styles.footer}>
        <span>Patience: {Math.max(0, 3 - hastyAttempts)} leaves</span>
        <span>{isFinishing ? 'The grove is blessing your harvest…' : 'There is no need to hurry.'}</span>
      </footer>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  page: {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    borderRadius: 22,
    border: '1px solid rgba(240,234,210,0.28)',
    background: "url('/assets/backgrounds/spirit-sapling/gentle-harvest-clearing.png') center/cover no-repeat",
    boxShadow: '0 24px 60px rgba(0,0,0,0.42)',
    color: '#F0EAD2',
  },
  scrim: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(12,28,20,0.30), rgba(10,24,16,0.08) 45%, rgba(8,18,12,0.55))',
    pointerEvents: 'none',
  },
  header: {
    position: 'relative',
    zIndex: 3,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 20,
    padding: '22px 26px 0',
  },
  overline: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#F4DFA5',
  },
  title: {
    margin: '2px 0 4px',
    fontFamily: titleFontFamily,
    fontSize: 'clamp(27px, 4vw, 44px)',
    lineHeight: 1,
    textShadow: '0 3px 16px rgba(0,0,0,0.45)',
  },
  instructions: {
    margin: 0,
    maxWidth: 620,
    fontFamily: uiFontFamily,
    fontSize: 13,
    lineHeight: 1.45,
    color: 'rgba(255,250,230,0.9)',
    textShadow: '0 2px 9px rgba(0,0,0,0.55)',
  },
  progressCard: {
    alignSelf: 'flex-start',
    minWidth: 84,
    padding: '9px 14px',
    borderRadius: 16,
    textAlign: 'center',
    background: 'rgba(18,42,27,0.76)',
    border: '1px solid rgba(244,223,165,0.5)',
    backdropFilter: 'blur(8px)',
  },
  progressValue: {
    display: 'block',
    fontFamily: uiFontFamily,
    fontSize: 24,
    fontWeight: 700,
    color: '#FFF1B2',
  },
  progressLabel: {
    display: 'block',
    marginTop: -3,
    fontFamily: uiFontFamily,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grove: {
    position: 'absolute',
    inset: '90px 0 42px',
  },
  fruitButton: {
    position: 'absolute',
    zIndex: 4,
    width: 'clamp(64px, 8vw, 104px)',
    height: 'clamp(64px, 8vw, 104px)',
    padding: 0,
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    transformOrigin: '50% 0%',
    transition: 'filter 450ms ease',
  },
  fruitImage: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  fruitStatus: {
    position: 'absolute',
    left: '50%',
    bottom: -8,
    transform: 'translateX(-50%)',
    padding: '2px 7px',
    borderRadius: 999,
    border: '1px solid',
    background: 'rgba(12,30,19,0.78)',
    fontFamily: uiFontFamily,
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    whiteSpace: 'nowrap',
  },
  messageCard: {
    position: 'absolute',
    zIndex: 6,
    left: 22,
    bottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    maxWidth: 'min(440px, 55%)',
    padding: '8px 14px 8px 8px',
    borderRadius: 18,
    background: 'rgba(15,34,22,0.82)',
    border: '1px solid rgba(240,223,170,0.38)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
  },
  guardian: {
    width: 54,
    height: 54,
    objectFit: 'contain',
    borderRadius: 12,
    filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.34))',
  },
  message: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 12,
    lineHeight: 1.35,
    color: '#F6EED8',
  },
  basketWrap: {
    position: 'absolute',
    zIndex: 5,
    right: '4%',
    bottom: -8,
    width: 'clamp(125px, 17vw, 210px)',
    height: 'clamp(125px, 17vw, 210px)',
  },
  basket: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    filter: 'drop-shadow(0 16px 18px rgba(0,0,0,0.38))',
  },
  basketFruitRow: {
    position: 'absolute',
    left: '16%',
    right: '12%',
    top: '27%',
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 0,
  },
  basketFruit: {
    width: '30%',
    margin: '-5% -3%',
    objectFit: 'contain',
    animation: 'celebration-basket-pop 450ms ease both',
  },
  footer: {
    position: 'absolute',
    zIndex: 7,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 14,
    padding: '9px 18px',
    background: 'rgba(10,26,17,0.82)',
    borderTop: '1px solid rgba(240,223,170,0.26)',
    fontFamily: uiFontFamily,
    fontSize: 11,
    color: 'rgba(246,238,216,0.9)',
  },
}
