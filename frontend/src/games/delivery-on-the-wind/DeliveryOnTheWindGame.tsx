import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createDeliveryGame } from './systems/createDeliveryGame'
import type { DeliveryGameAPI, HUDState, InspectData, NpcTalkData } from './systems/createDeliveryGame'
import { DELIVERY_TYPES } from './data/deliveryConfig'
import { MAP_REGISTRY } from './data/mapRegistry'
import { uiFontFamily, titleFontFamily, numberFontFamily } from '../../theme/typography'
import { submitSession } from '../../lib/api'
import GameShell from '../../components/game/GameShell'
import { useGameMusic } from '../../hooks/useGameMusic'

type Props = { onExit: () => void }

type Screen = 'map-select' | 'rules' | 'intro' | 'game' | 'results'

type EndResult = {
  outcome: 'win' | 'lose'
  deliveries: number
  timeRemaining: number
}

const SHELL_BG = `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url('/assets/backgrounds/delivery-on-the-wind/game-bg.png') center/cover no-repeat`
const INTRO_VIDEO = '/assets/animation/delivery-animation.mp4'
const ZOOM_LEVELS = [0.75, 1, 1.25, 1.5] as const

const STEPS = [
  { heading: 'Objective', items: ['Help Kiki deliver all 4 packages to the correct houses within 2 minutes.'] },
  {
    heading: 'Controls',
    items: [
      'Arrow Keys to fly Kiki.',
      'Step onto a glowing package to pick it up.',
      'Fly near a house and press Inspect House to see its sign.',
      'Reach the matching house’s glowing delivery ring to deliver.',
    ],
  },
  {
    heading: 'Scoring',
    items: [
      'Deliver all 4 packages before time runs out to win.',
      'Your fastest completion time is saved to the leaderboard.',
    ],
  },
  {
    heading: 'Penalties & Tips',
    items: [
      'Delivering to the wrong house costs 5 seconds.',
      'You can only carry one package at a time.',
      'Kiki can fly over water, but must go around trees, buildings, cliffs, and large obstacles.',
      'Use Inspect Package and Inspect House to match the signs — they must match exactly.',
    ],
  },
]

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getKikiOpinion(result: EndResult) {
  if (result.outcome === 'win') {
    if (result.timeRemaining >= 45) {
      return "The wind was perfectly on our side today. Every package found its doorstep, and I still had time to wave at the flowers."
    }
    if (result.timeRemaining >= 20) {
      return "A good delivery day. A few turns were tighter than I like, but every parcel made it home warm."
    }
    return "That was close enough to make my broom creak. Still, all four deliveries arrived, and that's what matters."
  }

  if (result.deliveries === 0) {
    return "Today got away from me before the first package found its door. Next time I'll read the house signs sooner and trust the main paths."
  }
  if (result.deliveries < 3) {
    return "I found part of the route, but the grove still had a few tricks left. Next time I should use the open water and turn earlier around the trees."
  }
  return "So close. Three deliveries is a strong run, but the last doorstep needs a cleaner route and a little less hesitation."
}

export default function DeliveryOnTheWindGame({ onExit }: Props) {
  useGameMusic('delivery')

  const containerRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<DeliveryGameAPI | null>(null)

  const [screen, setScreen]           = useState<Screen>('map-select')
  const [selectedMapId, setSelectedMapId] = useState('meadow')
  const [hoveredMapId, setHoveredMapId]   = useState<string | null>(null)
  const [result, setResult]           = useState<EndResult | null>(null)
  const [sessionId, setSessionId]     = useState(0)
  const [hud, setHud]                 = useState<HUDState | null>(null)
  const [inspecting, setInspecting]   = useState<InspectData | null>(null)
  const [talkingNpc, setTalkingNpc]   = useState<NpcTalkData | null>(null)
  const [zoom, setZoom]               = useState(1)

  const selectedMap = MAP_REGISTRY.find(m => m.id === selectedMapId) ?? MAP_REGISTRY[0]
  const bg = selectedMap.bg

  useEffect(() => {
    if (screen !== 'game' || !containerRef.current) return

    apiRef.current = createDeliveryGame(containerRef.current, {
      onGameEnd: async (outcome, deliveries, timeRemaining) => {
        apiRef.current?.destroy()
        apiRef.current = null
        const won = outcome === 'win'
        const routeDurationSeconds = Math.round(selectedMap.gameDurationMs / 1000)
        const completionTimeSeconds = won ? routeDurationSeconds - timeRemaining : null
        await submitSession('delivery-on-the-wind', {
          completed: won,
          won,
          deliveriesCompleted: deliveries,
          mapId: selectedMap.id,
          completionTimeSeconds,
          completionTime: completionTimeSeconds,
          shortestTime: completionTimeSeconds,
        })
        setResult({ outcome, deliveries, timeRemaining })
        setScreen('results')
      },
      onHUDUpdate:      (state) => setHud(state),
      onInspectPackage: (data) => setInspecting(data),
      onInspectHouse:   (data) => setInspecting(data),
      onTalkNpc:        (data) => setTalkingNpc(data),
    }, selectedMapId)

    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
  }, [screen, sessionId, selectedMapId, selectedMap.gameDurationMs, selectedMap.id])

  const closeInspect = useCallback(() => {
    setInspecting(null)
    setTalkingNpc(null)
    apiRef.current?.resumeFromInspection()
  }, [])

  const restart = () => {
    setResult(null)
    setHud(null)
    setInspecting(null)
    setTalkingNpc(null)
    setZoom(1)
    setSessionId(v => v + 1)
    setScreen('intro')
  }

  const startGame = () => {
    setZoom(1)
    setScreen('game')
  }

  const changeZoom = (direction: -1 | 1) => {
    setZoom(current => {
      const currentIndex = ZOOM_LEVELS.findIndex(level => level === current)
      const nextIndex = Math.max(0, Math.min(currentIndex + direction, ZOOM_LEVELS.length - 1))
      const next = ZOOM_LEVELS[nextIndex]
      apiRef.current?.setZoom(next)
      return next
    })
  }

  // ── Map selection screen ──────────────────────────────────────────────────
  if (screen === 'map-select') {
    return (
      <GameShell title="Delivery on the Wind" onExit={onExit} background={SHELL_BG} accentColor="#e9dfc2">
        <div className="ww-game-scroll" style={s.scrollArea}>
          <div className="ww-game-info-card" style={s.mapSelectCard}>
            <div style={s.rulesHeader}>
              <h3 style={s.rulesTitle}>Choose Your Route</h3>
              <p style={s.rulesSub}>Select a delivery map to begin. More routes are on the way.</p>
            </div>

            <div className="ww-delivery-map-grid" style={s.mapGrid}>
              {MAP_REGISTRY.map(map => {
                const hovered = hoveredMapId === map.id
                return (
                  <button
                    key={map.id}
                    style={{
                      ...s.mapCard,
                      background: map.cardGradient,
                      border: `1.5px solid ${hovered && map.available ? map.accentColor : 'rgba(255,255,255,0.10)'}`,
                      opacity: map.available ? 1 : 0.55,
                      transform: hovered && map.available ? 'translateY(-3px)' : 'none',
                      cursor: map.available ? 'pointer' : 'not-allowed',
                      boxShadow: hovered && map.available ? `0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px ${map.accentColor}40` : '0 4px 16px rgba(0,0,0,0.4)',
                    }}
                    onClick={() => {
                      if (!map.available) return
                      setSelectedMapId(map.id)
                      setScreen('rules')
                    }}
                    onMouseEnter={() => setHoveredMapId(map.id)}
                    onMouseLeave={() => setHoveredMapId(null)}
                  >
                    <div style={{ ...s.mapAccentBar, background: map.accentColor }} />
                    <div style={s.mapCardBody}>
                      <span style={s.mapEmoji}>{map.emoji}</span>
                      <div style={s.mapCardText}>
                        <span style={{ ...s.mapCardName, color: map.accentColor }}>{map.name}</span>
                        <span style={s.mapCardDesc}>{map.description}</span>
                      </div>
                      {map.available
                        ? <span style={{ ...s.mapChip, borderColor: map.accentColor, color: map.accentColor }}>Play →</span>
                        : <span style={s.comingSoonChip}>Soon</span>
                      }
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </GameShell>
    )
  }

  // ── Rules screen ──────────────────────────────────────────────────────────
  if (screen === 'rules') {
    const durationMin = Math.floor(selectedMap.gameDurationMs / 60_000)
    return (
      <GameShell title="Delivery on the Wind" onExit={onExit} background={bg} accentColor="#e9dfc2">
        <div className="ww-game-scroll" style={s.scrollArea}>
          <div className="ww-game-info-card" style={s.rulesCard}>
            <div style={s.rulesHeader}>
              <h3 style={s.rulesTitle}>Help Kiki Deliver!</h3>
              <p style={s.rulesSub}>Match each package to its house using the signs. You have {durationMin} minutes.</p>
            </div>

            <div style={s.rulesSections}>
              {STEPS.map((sec) => (
                <div key={sec.heading} style={s.rulesBlock}>
                  <p style={s.rulesBlockTitle}>{sec.heading}</p>
                  <ul style={s.rulesList}>
                    {sec.items.map((item, i) => (
                      <li key={i} style={s.rulesItem}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={s.legend}>
              <p style={s.legendTitle}>Package types</p>
              <div className="ww-delivery-legend-grid" style={s.legendGrid}>
                {DELIVERY_TYPES.map(d => (
                  <div key={d.type} style={s.legendItem}>
                    <div style={s.legendImgWrap}>
                      <img
                        src={`/assets/backgrounds/delivery-on-the-wind/package-${d.imageIndex}-pixel.png`}
                        alt={d.label}
                        style={s.legendImg}
                      />
                    </div>
                    <span style={{ ...s.legendLabel, color: d.colorHex }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.rulesBtnRow}>
              <button style={s.ghostBtn} onClick={() => setScreen('map-select')}>← Change Route</button>
              <button style={{ ...s.startBtn, flex: 2 }} onClick={() => setScreen('intro')}>
                Begin Delivery
              </button>
            </div>
          </div>
        </div>
      </GameShell>
    )
  }

  // ── Intro animation ──────────────────────────────────────────────────────
  if (screen === 'intro') {
    return (
      <GameShell title="Delivery on the Wind" onExit={onExit} background={bg} accentColor="#e9dfc2">
        <div className="ww-game-scroll" style={s.introArea}>
          <div className="ww-game-info-card ww-delivery-intro-card" style={s.introCard}>
            <video
              src={INTRO_VIDEO}
              style={s.introVideo}
              autoPlay
              muted
              playsInline
              onEnded={startGame}
            />
            <div style={s.introCopy}>
              <p style={s.introKicker}>The wind is rising</p>
              <h3 style={s.introTitle}>Kiki takes flight</h3>
              <p style={s.introSub}>Watch the delivery path open, then guide every package home.</p>
            </div>
            <div style={s.introActions}>
              <button style={s.primaryBtn} onClick={startGame}>Start Delivery</button>
              <button style={s.ghostBtn} onClick={startGame}>Skip Intro</button>
            </div>
          </div>
        </div>
      </GameShell>
    )
  }

  // ── End screen ────────────────────────────────────────────────────────────
  if (screen === 'results' && result !== null) {
    const won = result.outcome === 'win'
    const completionTime = won ? Math.round(selectedMap.gameDurationMs / 1000) - result.timeRemaining : null
    const kikiOpinion = getKikiOpinion(result)

    return (
      <GameShell title="Delivery on the Wind" onExit={onExit} background={bg} accentColor="#e9dfc2">
        <div className="ww-game-scroll" style={s.scrollArea}>
          <div className="ww-game-info-card" style={{ ...s.resultsCard, borderColor: won ? 'rgba(154,162,83,0.45)' : 'rgba(203,91,64,0.4)' }}>
            <div style={{ ...s.resultIcon, color: won ? '#c6cf79' : '#cb5b40' }}>
              {won ? '★' : '!'}
            </div>
            <h3 style={{ ...s.resultTitle, color: won ? '#c6cf79' : '#cb5b40' }}>
              {won ? 'All Delivered!' : "Time's Up!"}
            </h3>

            <div style={s.deliverySummary}>
              <span style={s.summaryLabel}>Packages Delivered</span>
              <span style={{ ...s.summaryValue, color: won ? '#c6cf79' : '#ffb39f' }}>
                {result.deliveries} / 4
              </span>
            </div>

            {won ? (
              <>
                <p style={s.resultSub}>Kiki delivered every package — the grove is grateful!</p>
                <div style={s.statGrid}>
                  {completionTime !== null && (
                    <div style={s.statBox}>
                      <span style={s.statLabel}>Completion Time</span>
                      <span style={{ ...s.statVal, color: '#c6cf79' }}>{formatTime(completionTime)}</span>
                    </div>
                  )}
                  {result.timeRemaining > 0 && (
                    <div style={s.statBox}>
                      <span style={s.statLabel}>Time Remaining</span>
                      <span style={s.statVal}>{formatTime(result.timeRemaining)}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <p style={s.resultSub}>{result.deliveries} of 4 packages delivered.</p>
                <p style={{ ...s.resultSub, fontSize: 14, opacity: 0.7 }}>
                  {result.deliveries === 0
                    ? 'The packages are waiting — give it another go!'
                    : 'So close! Try again and deliver them all.'}
                </p>
              </>
            )}

            <div style={s.kikiReport}>
              <img
                src="/assets/backgrounds/delivery-on-the-wind/kiki-pixel.png"
                alt="Kiki"
                style={s.kikiPortrait}
              />
              <div style={s.kikiCopy}>
                <span style={s.kikiLabel}>Kiki's Delivery Note</span>
                <p style={s.kikiQuote}>{kikiOpinion}</p>
              </div>
            </div>

            <div style={s.resultActions}>
              <button style={s.primaryBtn} onClick={restart}>Play Again</button>
              <button style={{ ...s.ghostBtn, flex: 'unset' as const }} onClick={() => { setResult(null); setScreen('map-select') }}>Change Route</button>
              <button style={s.ghostBtn} onClick={onExit}>← Grove</button>
            </div>
          </div>
        </div>
      </GameShell>
    )
  }

  // ── Game screen ───────────────────────────────────────────────────────────
  return (
    <GameShell title="Delivery on the Wind" onExit={onExit} background={bg} accentColor="#e9dfc2">
      <div className="ww-phaser-game-area" style={s.gameArea}>
        <p className="ww-game-orientation-hint">Rotate your phone for a larger play area.</p>
        <div className="ww-phaser-game-wrap ww-delivery-game-wrap" key={sessionId} ref={containerRef} style={s.gameWrap}>
          {hud && (
            <div className="ww-delivery-hud" style={s.hudOverlay}>
              {hud.heldType && hud.heldImageIndex !== null && (
                <button style={s.inspectBtn} onClick={() => apiRef.current?.inspectHeldPackage()}>
                  <img
                    src={`/assets/backgrounds/delivery-on-the-wind/package-${hud.heldImageIndex}-pixel.png`}
                    alt=""
                    style={s.inspectBtnImg}
                  />
                  Inspect Package
                </button>
              )}
              {hud.nearHouseType && hud.nearHouseImageIndex !== null && (
                <button
                  style={{ ...s.inspectBtn, ...s.inspectHouseBtn }}
                  onClick={() => apiRef.current?.inspectNearHouse()}
                >
                  <img
                    src={`/assets/backgrounds/delivery-on-the-wind/house-${hud.nearHouseImageIndex}.png`}
                    alt=""
                    style={s.inspectBtnImg}
                  />
                  Inspect House
                </button>
              )}
              {hud.nearNpcId && hud.nearNpcAssetKey && (
                <button
                  style={{ ...s.inspectBtn, ...s.talkNpcBtn }}
                  onClick={() => apiRef.current?.talkNearNpc()}
                >
                  <img
                    src={`/assets/npcs/${hud.nearNpcAssetKey}-pixel.png`}
                    alt=""
                    style={s.inspectBtnImg}
                  />
                  Talk to {hud.nearNpcName}
                </button>
              )}
            </div>
          )}
          <div className="ww-delivery-zoom" style={s.zoomControls} role="group" aria-label="Map zoom controls">
            <button
              type="button"
              aria-label="Zoom out"
              title="Zoom out"
              disabled={zoom === ZOOM_LEVELS[0]}
              style={{ ...s.zoomBtn, ...(zoom === ZOOM_LEVELS[0] ? s.zoomBtnDisabled : {}) }}
              onClick={() => changeZoom(-1)}
            >
              −
            </button>
            <output style={s.zoomValue} aria-live="polite">{Math.round(zoom * 100)}%</output>
            <button
              type="button"
              aria-label="Zoom in"
              title="Zoom in"
              disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              style={{ ...s.zoomBtn, ...(zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1] ? s.zoomBtnDisabled : {}) }}
              onClick={() => changeZoom(1)}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {inspecting && <InspectModal data={inspecting} onClose={closeInspect} />}
      {talkingNpc && <NpcTalkModal data={talkingNpc} onClose={closeInspect} />}
    </GameShell>
  )
}

// ── Inspect Modal ─────────────────────────────────────────────────────────────

function InspectModal({ data, onClose }: { data: InspectData; onClose: () => void }) {
  const isPackage = data.kind === 'package'
  const imgSrc = isPackage
    ? `/assets/backgrounds/delivery-on-the-wind/package-${data.imageIndex}-pixel.png`
    : `/assets/backgrounds/delivery-on-the-wind/house-${data.imageIndex}.png`

  return (
    <div className="ww-game-modal-backdrop" style={m.backdrop} onClick={onClose}>
      <div className="ww-game-modal-card" style={m.card} onClick={e => e.stopPropagation()}>
        <div style={m.header}>
          <h3 style={m.title}>{isPackage ? 'Package Inspection' : 'House Inspection'}</h3>
          <button style={m.closeBtn} onClick={onClose}>Close</button>
        </div>
        <div style={m.magnifierWrap}>
          <div className="ww-delivery-magnifier" style={{ ...m.magnifierRing, borderColor: data.colorHex }}>
            <img src={imgSrc} alt={data.label} style={m.magnifierImg} />
          </div>
          <div style={{ ...m.handle, background: data.colorHex }} />
        </div>
        <div style={m.labelRow}>
          <span style={{ ...m.typeDot, background: data.colorHex }} />
          <span style={{ ...m.labelText, color: data.colorHex }}>{data.label}</span>
        </div>
        {isPackage && <p style={m.hint}>{data.hint}</p>}
        <button style={m.continueBtn} onClick={onClose}>Continue</button>
      </div>
    </div>
  )
}

function NpcTalkModal({ data, onClose }: { data: NpcTalkData; onClose: () => void }) {
  return (
    <div className="ww-game-modal-backdrop" style={m.backdrop} onClick={onClose}>
      <div className="ww-game-modal-card" style={m.card} onClick={e => e.stopPropagation()}>
        <div style={m.header}>
          <h3 style={m.title}>{data.name}</h3>
          <button style={m.closeBtn} onClick={onClose}>Close</button>
        </div>
        <div style={m.npcPortraitWrap}>
          <img src={`/assets/npcs/${data.assetKey}-pixel.png`} alt={data.name} style={m.npcPortrait} />
        </div>
        <p style={m.npcRole}>{data.role}</p>
        {data.heldLabel && (
          <div style={m.npcPackageRow}>
            <span style={{ ...m.typeDot, background: data.heldColorHex ?? '#e9dfc2' }} />
            <span>{data.heldLabel}</span>
          </div>
        )}
        <p style={m.npcLine}>{data.line}</p>
        <button style={m.continueBtn} onClick={onClose}>Back to Delivery</button>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  scrollArea: {
    flex: 1, overflowY: 'auto',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    padding: '28px 20px 36px', boxSizing: 'border-box',
  },

  /* Map select */
  mapSelectCard: {
    width: 'min(680px, 100%)',
    background: 'rgba(10,18,8,0.84)',
    backdropFilter: 'blur(16px)',
    borderRadius: 22,
    border: '1px solid rgba(154,162,83,0.24)',
    boxShadow: '0 24px 56px rgba(0,0,0,0.50)',
    padding: '32px 36px 28px',
    boxSizing: 'border-box' as const,
    display: 'flex', flexDirection: 'column' as const, gap: 24,
  },
  mapGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  mapCard: {
    position: 'relative' as const,
    borderRadius: 16,
    overflow: 'hidden',
    padding: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    textAlign: 'left' as const,
    transition: 'transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease',
  },
  mapAccentBar: {
    height: 4,
    width: '100%',
  },
  mapCardBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
    padding: '14px 16px 16px',
  },
  mapEmoji: {
    fontSize: 28,
    lineHeight: 1,
  },
  mapCardText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 3,
    flex: 1,
  },
  mapCardName: {
    fontSize: 15,
    fontWeight: 700,
    fontFamily: uiFontFamily,
    lineHeight: 1.2,
  },
  mapCardDesc: {
    fontSize: 12,
    color: '#b0a890',
    fontFamily: uiFontFamily,
    lineHeight: 1.4,
  },
  mapChip: {
    display: 'inline-block',
    marginTop: 6,
    alignSelf: 'flex-start',
    padding: '3px 10px',
    borderRadius: 20,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: uiFontFamily,
    letterSpacing: 0.4,
  },
  comingSoonChip: {
    display: 'inline-block',
    marginTop: 6,
    alignSelf: 'flex-start',
    padding: '3px 10px',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.18)',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: uiFontFamily,
    letterSpacing: 0.4,
  },
  rulesBtnRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'stretch',
  },

  /* Rules */
  rulesCard: {
    width: 'min(620px, 100%)',
    background: 'rgba(10,18,8,0.84)',
    backdropFilter: 'blur(16px)',
    borderRadius: 22,
    border: '1px solid rgba(154,162,83,0.24)',
    boxShadow: '0 24px 56px rgba(0,0,0,0.50)',
    padding: '32px 36px 28px',
    boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  rulesHeader:     { display: 'flex', flexDirection: 'column', gap: 6 },
  rulesTitle:      { margin: 0, fontFamily: titleFontFamily, fontSize: 28, color: '#fff7e0', textAlign: 'center' },
  rulesSub:        { margin: 0, fontFamily: uiFontFamily, fontSize: 15, color: '#d4c69e', textAlign: 'center', lineHeight: 1.5 },
  rulesSections:   { display: 'flex', flexDirection: 'column', gap: 14 },
  rulesBlock:      { display: 'flex', flexDirection: 'column', gap: 5 },
  rulesBlockTitle: { margin: 0, fontFamily: uiFontFamily, fontWeight: 700, fontSize: 12, color: '#9aa253', textTransform: 'uppercase', letterSpacing: 0.6 },
  rulesList:       { margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 },
  rulesItem:       { fontFamily: uiFontFamily, fontSize: 14, color: '#e9dfc2', lineHeight: 1.5 },

  legend:      { borderTop: '1px solid rgba(154,162,83,0.18)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  legendTitle: { margin: 0, fontSize: 12, fontWeight: 700, color: '#9aa253', textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: uiFontFamily },
  legendGrid:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  legendItem:  { display: 'flex', alignItems: 'center', gap: 10 },
  legendImgWrap: {
    width: 40, height: 40, borderRadius: 8,
    background: 'rgba(154,162,83,0.10)', border: '1px solid rgba(154,162,83,0.18)',
    overflow: 'hidden', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  legendImg:   { width: 34, height: 34, objectFit: 'contain' },
  legendLabel: { fontSize: 13, fontWeight: 600, fontFamily: uiFontFamily },

  startBtn: {
    width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #5A9030, #3E6820)',
    color: '#F0EAD2', fontFamily: uiFontFamily, fontSize: 17, fontWeight: 700,
    cursor: 'pointer', letterSpacing: 0.3, boxShadow: '0 8px 24px rgba(58,88,32,0.45)',
  },

  /* Intro */
  introArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 20px',
    boxSizing: 'border-box',
  },
  introCard: {
    width: 'min(860px, 100%)',
    borderRadius: 22,
    overflow: 'hidden',
    background: 'rgba(10,18,8,0.88)',
    border: '1px solid rgba(233,223,194,0.2)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.58)',
    display: 'flex',
    flexDirection: 'column',
  },
  introVideo: {
    width: '100%',
    aspectRatio: '16 / 9',
    objectFit: 'cover',
    background: '#0a1208',
    display: 'block',
  },
  introCopy: {
    padding: '22px 28px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    textAlign: 'center',
  },
  introKicker: {
    margin: 0,
    color: '#9aa253',
    fontFamily: uiFontFamily,
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  introTitle: {
    margin: 0,
    color: '#fff7e0',
    fontFamily: titleFontFamily,
    fontSize: 34,
    lineHeight: 1.05,
  },
  introSub: {
    margin: 0,
    color: '#d4c69e',
    fontFamily: uiFontFamily,
    fontSize: 15,
    lineHeight: 1.45,
  },
  introActions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: '18px 28px 28px',
  },

  /* Results */
  resultsCard: {
    width: 'min(480px, 100%)',
    background: 'rgba(10,18,8,0.88)',
    backdropFilter: 'blur(16px)',
    borderRadius: 22, border: '2px solid',
    boxShadow: '0 24px 56px rgba(0,0,0,0.55)',
    padding: '36px 40px 32px', boxSizing: 'border-box',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    textAlign: 'center',
  },
  resultIcon:    { fontSize: 52, fontFamily: titleFontFamily, lineHeight: 1 },
  resultTitle:   { margin: 0, fontFamily: titleFontFamily, fontSize: 34, lineHeight: 1.1 },
  resultSub:     { margin: 0, fontSize: 15, color: '#d4c69e', lineHeight: 1.55, fontFamily: uiFontFamily },
  deliverySummary: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '12px 16px',
    borderRadius: 12,
    background: 'rgba(233,223,194,0.08)',
    border: '1px solid rgba(233,223,194,0.18)',
    boxSizing: 'border-box',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#d4c69e',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontFamily: uiFontFamily,
  },
  summaryValue: {
    fontSize: 30,
    lineHeight: 1,
    fontFamily: numberFontFamily,
  },
  statGrid:      { display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  statBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    background: 'rgba(154,162,83,0.12)', border: '1px solid rgba(154,162,83,0.28)',
    borderRadius: 12, padding: '10px 20px',
  },
  statLabel: { fontSize: 11, color: '#9aa253', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: uiFontFamily },
  statVal:   { fontSize: 26, fontFamily: numberFontFamily, color: '#fff7e0', lineHeight: 1 },
  kikiReport: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '54px 1fr',
    gap: 12,
    alignItems: 'center',
    padding: '14px',
    borderRadius: 14,
    background: 'rgba(10,18,8,0.42)',
    border: '1px solid rgba(154,162,83,0.22)',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  kikiPortrait: {
    width: 54,
    height: 54,
    objectFit: 'contain',
    borderRadius: 10,
    background: 'rgba(233,223,194,0.08)',
  },
  kikiCopy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    minWidth: 0,
  },
  kikiLabel: {
    fontSize: 11,
    color: '#9aa253',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontFamily: uiFontFamily,
  },
  kikiQuote: {
    margin: 0,
    color: '#fff7e0',
    fontSize: 14,
    lineHeight: 1.45,
    fontFamily: uiFontFamily,
  },

  resultActions: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%', marginTop: 4 },
  primaryBtn: {
    flex: 1, minWidth: 110, padding: '12px 0', borderRadius: 11, border: 'none',
    background: 'linear-gradient(135deg, #5A9030, #3E6820)',
    color: '#F0EAD2', fontFamily: uiFontFamily, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 5px 16px rgba(58,88,32,0.38)',
  },
  ghostBtn: {
    flex: 1, minWidth: 80, padding: '12px 0', borderRadius: 11,
    border: '1px solid rgba(212,198,158,0.28)', background: 'transparent',
    color: '#d4c69e', fontFamily: uiFontFamily, fontSize: 15, cursor: 'pointer',
  },

  /* Game */
  gameArea: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '10px', boxSizing: 'border-box',
  },
  gameWrap: {
    position: 'relative',
    width: 'min(100%, calc((100vh - 80px) * (16/9)))',
    aspectRatio: '16 / 9',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
    border: '1px solid rgba(154,162,83,0.22)',
  },
  hudOverlay: {
    position: 'absolute', bottom: 18, right: 18,
    display: 'flex', flexDirection: 'column', gap: 8,
    alignItems: 'flex-end', pointerEvents: 'auto', zIndex: 10,
  },
  inspectBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '9px 16px', borderRadius: 12,
    border: '1.5px solid rgba(240,234,210,0.45)',
    background: 'rgba(10,18,8,0.82)', color: '#F0EAD2',
    fontFamily: uiFontFamily, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
  },
  inspectHouseBtn: { borderColor: 'rgba(200,160,80,0.5)', color: '#F0D890' },
  talkNpcBtn:      { borderColor: 'rgba(154,162,83,0.58)', color: '#DDE5B6' },
  inspectBtnImg:   { width: 28, height: 28, objectFit: 'contain', borderRadius: 4 },
  zoomControls: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    zIndex: 11,
    display: 'grid',
    gridTemplateColumns: '38px 58px 38px',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderRadius: 12,
    border: '1.5px solid rgba(240,234,210,0.46)',
    background: 'rgba(10,18,8,0.86)',
    boxShadow: '0 5px 18px rgba(0,0,0,0.46)',
    backdropFilter: 'blur(8px)',
  },
  zoomBtn: {
    minWidth: 38,
    minHeight: 38,
    padding: 0,
    border: 'none',
    background: 'rgba(233,223,194,0.10)',
    color: '#fff7e0',
    fontFamily: numberFontFamily,
    fontSize: 24,
    lineHeight: 1,
    cursor: 'pointer',
  },
  zoomBtnDisabled: {
    color: 'rgba(233,223,194,0.28)',
    cursor: 'not-allowed',
    background: 'rgba(233,223,194,0.035)',
  },
  zoomValue: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#dce7b8',
    fontFamily: numberFontFamily,
    fontSize: 13,
    borderLeft: '1px solid rgba(240,234,210,0.18)',
    borderRight: '1px solid rgba(240,234,210,0.18)',
  },
}

const m: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, backdropFilter: 'blur(4px)',
  },
  card: {
    background: 'rgba(248,243,225,0.98)', borderRadius: 22,
    border: '1px solid rgba(108,88,76,0.2)',
    boxShadow: '0 28px 60px rgba(0,0,0,0.55)',
    padding: '28px 32px 32px', maxWidth: 380, width: '92%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    fontFamily: uiFontFamily,
  },
  header:     { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title:      { margin: 0, fontFamily: titleFontFamily, fontSize: 22, color: '#3A2810' },
  closeBtn: {
    padding: '5px 14px', borderRadius: 8,
    border: '1px solid rgba(108,88,76,0.3)', background: 'rgba(108,88,76,0.07)',
    color: '#6C584C', fontFamily: uiFontFamily, fontSize: 13, cursor: 'pointer',
  },
  magnifierWrap:  { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  magnifierRing: {
    width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', border: '5px solid',
    boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 0 24px rgba(0,0,0,0.06)',
    background: 'rgba(240,230,210,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  magnifierImg: { width: 178, height: 178, objectFit: 'contain' },
  handle: {
    width: 10, height: 54, borderRadius: 5,
    transform: 'rotate(35deg) translateX(50px) translateY(-14px)',
    transformOrigin: 'top center', marginTop: -8, alignSelf: 'flex-end',
    marginRight: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
  },
  labelRow:  { display: 'flex', alignItems: 'center', gap: 10 },
  typeDot:   { width: 14, height: 14, borderRadius: '50%', flexShrink: 0 },
  labelText: { fontSize: 18, fontWeight: 700, letterSpacing: 0.2, fontFamily: uiFontFamily },
  npcPortraitWrap: {
    width: 154,
    height: 154,
    borderRadius: 18,
    background: 'rgba(90,144,48,0.08)',
    border: '1px solid rgba(90,144,48,0.22)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  npcPortrait: { width: 138, height: 138, objectFit: 'contain' },
  npcRole: {
    margin: '-4px 0 0',
    color: '#8A6A48',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: uiFontFamily,
  },
  npcPackageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#5A4030',
    fontSize: 14,
    fontWeight: 800,
    fontFamily: uiFontFamily,
  },
  npcLine: {
    margin: 0,
    fontSize: 15,
    color: '#3A2810',
    textAlign: 'center',
    lineHeight: 1.55,
    padding: '12px 14px',
    background: 'rgba(90,144,48,0.08)',
    border: '1px solid rgba(90,144,48,0.22)',
    borderRadius: 12,
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: uiFontFamily,
  },
  hint: {
    margin: 0, fontSize: 14, color: '#5A4030', textAlign: 'center',
    lineHeight: 1.55, padding: '10px 14px',
    background: 'rgba(90,144,48,0.08)', border: '1px solid rgba(90,144,48,0.22)',
    borderRadius: 10, fontStyle: 'italic', width: '100%', boxSizing: 'border-box',
    fontFamily: uiFontFamily,
  },
  continueBtn: {
    width: '100%', padding: '12px 0', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #5A9030, #3E6820)',
    color: '#F0EAD2', fontFamily: uiFontFamily, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 6px 18px rgba(58,88,32,0.38)',
  },
}
