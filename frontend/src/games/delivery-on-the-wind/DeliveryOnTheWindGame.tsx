import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createDeliveryGame } from './systems/createDeliveryGame'
import type { DeliveryGameAPI, HUDState, InspectData } from './systems/createDeliveryGame'
import { DELIVERY_TYPES } from './data/deliveryConfig'
import { bodyFontFamily, headingFontFamily } from '../../theme/typography'

type Props = { onExit: () => void }

type EndResult = {
  outcome: 'win' | 'lose'
  deliveries: number
  timeRemaining: number
}

const STEPS = [
  { num: '1', text: 'Walk to a glowing package and step on it to pick it up.' },
  { num: '2', text: 'Use the Inspect Package button to see the sign on the package.' },
  { num: '3', text: 'Find the matching house — walk close to it and use Inspect House.' },
  { num: '4', text: 'Step onto the correct house to deliver. The village will cheer!' },
  { num: '5', text: 'Wrong house: a 5 s time penalty — but you keep the package.' },
  { num: '6', text: 'Carry one package at a time. Deliver it before picking up another.' },
  { num: '7', text: 'Use the Arrow Keys to move. No diagonal movement.' },
]

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function DeliveryOnTheWindGame({ onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<DeliveryGameAPI | null>(null)

  const [showRules, setShowRules] = useState(true)
  const [result, setResult]       = useState<EndResult | null>(null)
  const [sessionId, setSessionId] = useState(0)
  const [hud, setHud]             = useState<HUDState | null>(null)
  const [inspecting, setInspecting] = useState<InspectData | null>(null)

  useEffect(() => {
    if (showRules || result !== null || !containerRef.current) return

    apiRef.current = createDeliveryGame(containerRef.current, {
      onGameEnd: (outcome, deliveries, timeRemaining) => {
        apiRef.current?.destroy()
        apiRef.current = null
        setResult({ outcome, deliveries, timeRemaining })
      },
      onHUDUpdate: (state) => setHud(state),
      onInspectPackage: (data) => setInspecting(data),
      onInspectHouse:   (data) => setInspecting(data),
    })

    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
  }, [showRules, result, sessionId])

  const closeInspect = useCallback(() => {
    setInspecting(null)
    apiRef.current?.resumeFromInspection()
  }, [])

  const restart = () => {
    setResult(null)
    setHud(null)
    setInspecting(null)
    setSessionId(v => v + 1)
  }

  // ── Top bar ──────────────────────────────────────────────────────────────────
  const TopBar = () => (
    <div style={s.topBar}>
      <button style={s.backBtn} onClick={onExit}>← Back to Grove</button>
      <h2 style={s.heading}>Delivery on the Wind</h2>
      <div style={{ width: 140 }} />
    </div>
  )

  // ── Rules screen ──────────────────────────────────────────────────────────────
  if (showRules) {
    return (
      <div style={s.page}>
        <TopBar />
        <div style={s.centreWrap}>
          <div style={s.rulesCard}>
            <div style={s.rulesHeader}>
              <h3 style={s.rulesTitle}>Help Kiki deliver all 4 packages!</h3>
              <p style={s.rulesSub}>You have <strong>2 minutes</strong>. Match each package to its house using the signs.</p>
            </div>

            <ul style={s.stepList}>
              {STEPS.map(step => (
                <li key={step.num} style={s.stepRow}>
                  <span style={s.stepNum}>{step.num}</span>
                  <span style={s.stepText}>{step.text}</span>
                </li>
              ))}
            </ul>

            <div style={s.legend}>
              <p style={s.legendTitle}>Package types:</p>
              <div style={s.legendGrid}>
                {DELIVERY_TYPES.map(d => (
                  <div key={d.type} style={s.legendItem}>
                    <div style={s.legendImgWrap}>
                      <img
                        src={`/assets/backgrounds/delivery-on-the-wind/package-${d.imageIndex}.png`}
                        alt={d.label}
                        style={s.legendImg}
                      />
                    </div>
                    <span style={{ ...s.legendLabel, color: d.colorHex }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button style={s.startBtn} onClick={() => setShowRules(false)}>
              Begin Delivery
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── End screen ────────────────────────────────────────────────────────────────
  if (result !== null) {
    const won = result.outcome === 'win'
    return (
      <div style={s.page}>
        <TopBar />
        <div style={s.centreWrap}>
          <div style={{ ...s.endCard, borderColor: won ? 'rgba(173,193,120,0.5)' : 'rgba(200,80,80,0.4)' }}>
            <div style={s.endIcon}>{won ? '★' : '!'}</div>
            <h3 style={{ ...s.endTitle, color: won ? '#3A6A12' : '#8B2500' }}>
              {won ? 'All Delivered!' : "Time's Up!"}
            </h3>
            {won ? (
              <p style={s.endSub}>Kiki delivered every package — the grove is grateful!</p>
            ) : (
              <p style={s.endSub}>{result.deliveries} of 4 packages delivered.</p>
            )}
            {won && (
              <div style={s.timeRemainingBadge}>
                <span style={s.timeRemainingLabel}>Time remaining</span>
                <span style={s.timeRemainingValue}>{formatTime(result.timeRemaining)}</span>
              </div>
            )}
            {!won && (
              <p style={{ ...s.endSub, fontSize: 14, opacity: 0.7 }}>
                {result.deliveries === 0
                  ? 'The packages are waiting — give it another go!'
                  : 'So close! Try again and deliver them all.'}
              </p>
            )}
            <div style={s.endActions}>
              <button style={s.primaryBtn} onClick={restart}>Play Again</button>
              <button style={s.secondaryBtn} onClick={onExit}>Back to Grove</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Game screen ───────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <TopBar />
      <div style={s.gameArea}>
        {/* Phaser canvas container */}
        <div key={sessionId} ref={containerRef} style={s.gameWrap} />

        {/* React HUD overlay — inspect buttons */}
        {hud && (
          <div style={s.hudOverlay}>
            {hud.heldType && hud.heldImageIndex !== null && (
              <button
                style={s.inspectBtn}
                onClick={() => apiRef.current?.inspectHeldPackage()}
              >
                <img
                  src={`/assets/backgrounds/delivery-on-the-wind/package-${hud.heldImageIndex}.png`}
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
          </div>
        )}
      </div>

      {/* Inspection overlay modal */}
      {inspecting && (
        <InspectModal data={inspecting} onClose={closeInspect} />
      )}
    </div>
  )
}

// ── Inspect Modal ─────────────────────────────────────────────────────────────

function InspectModal({ data, onClose }: { data: InspectData; onClose: () => void }) {
  const isPackage = data.kind === 'package'
  const imgSrc = isPackage
    ? `/assets/backgrounds/delivery-on-the-wind/package-${data.imageIndex}.png`
    : `/assets/backgrounds/delivery-on-the-wind/house-${data.imageIndex}.png`

  return (
    <div style={m.backdrop} onClick={onClose}>
      <div style={m.card} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={m.header}>
          <h3 style={m.title}>
            {isPackage ? 'Package Inspection' : 'House Inspection'}
          </h3>
          <button style={m.closeBtn} onClick={onClose}>Close</button>
        </div>

        {/* Magnifier frame + image */}
        <div style={m.magnifierWrap}>
          <div style={{ ...m.magnifierRing, borderColor: data.colorHex }}>
            <img src={imgSrc} alt={data.label} style={m.magnifierImg} />
          </div>
          {/* Handle */}
          <div style={{ ...m.handle, background: data.colorHex }} />
        </div>

        {/* Label */}
        <div style={m.labelRow}>
          <span style={{ ...m.typeDot, background: data.colorHex }} />
          <span style={{ ...m.labelText, color: data.colorHex }}>{data.label}</span>
        </div>

        {/* Hint (packages only) */}
        {isPackage && (
          <p style={m.hint}>{data.hint}</p>
        )}

        <button style={m.continueBtn} onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BG = `linear-gradient(rgba(10,18,8,0.3),rgba(10,18,8,0.3)), url('/assets/backgrounds/delivery-on-the-wind/game-bg.png') center/cover no-repeat`

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: BG,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    fontFamily: bodyFontFamily,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 22px',
    background: 'rgba(10,18,8,0.65)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(173,193,120,0.2)',
    flexShrink: 0,
  },
  backBtn: {
    width: 140,
    padding: '8px 14px',
    borderRadius: 9,
    border: '1px solid rgba(240,234,210,0.3)',
    background: 'rgba(240,234,210,0.1)',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    cursor: 'pointer',
  },
  heading: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 26,
    color: '#F0EAD2',
    textShadow: '0 2px 10px rgba(0,0,0,0.6)',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gameWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // HUD overlay anchored to the game area
  hudOverlay: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    alignItems: 'flex-end',
    pointerEvents: 'auto',
    zIndex: 10,
  },
  inspectBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 16px',
    borderRadius: 12,
    border: '1.5px solid rgba(240,234,210,0.45)',
    background: 'rgba(10,18,8,0.82)',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
  },
  inspectHouseBtn: {
    borderColor: 'rgba(200,160,80,0.5)',
    color: '#F0D890',
  },
  inspectBtnImg: {
    width: 28,
    height: 28,
    objectFit: 'contain',
    borderRadius: 4,
  },
  centreWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },

  // ── Rules ──
  rulesCard: {
    background: 'rgba(246,241,222,0.97)',
    backdropFilter: 'blur(18px)',
    borderRadius: 22,
    border: '1px solid rgba(108,88,76,0.22)',
    boxShadow: '0 24px 56px rgba(0,0,0,0.4)',
    padding: '32px 38px',
    maxWidth: 560,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  rulesHeader: { display: 'flex', flexDirection: 'column', gap: 4 },
  rulesTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 28,
    color: '#4A3020',
    textAlign: 'center',
  },
  rulesSub: {
    margin: 0,
    fontSize: 15,
    color: '#7A5F4E',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  stepList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  stepRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '8px 12px',
    borderRadius: 10,
    background: 'rgba(108,88,76,0.07)',
    border: '1px solid rgba(108,88,76,0.08)',
  },
  stepNum: {
    fontSize: 12,
    fontWeight: 700,
    color: '#8B6A50',
    width: 18,
    textAlign: 'right',
    flexShrink: 0,
    paddingTop: 1,
  },
  stepText: { fontSize: 14, color: '#5A3E28', lineHeight: 1.5 },

  legend: {
    borderTop: '1px solid rgba(108,88,76,0.18)',
    paddingTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  legendTitle: {
    margin: 0,
    fontSize: 11,
    fontWeight: 700,
    color: '#8B6A50',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 10 },
  legendImgWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    background: 'rgba(108,88,76,0.08)',
    border: '1px solid rgba(108,88,76,0.14)',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendImg: { width: 34, height: 34, objectFit: 'contain' },
  legendLabel: { fontSize: 13, fontWeight: 600 },

  startBtn: {
    padding: '14px 0',
    borderRadius: 13,
    border: 'none',
    background: 'linear-gradient(135deg, #5A9030, #3E6820)',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 19,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
    boxShadow: '0 8px 24px rgba(58,88,32,0.45)',
  },

  // ── End ──
  endCard: {
    background: 'rgba(246,241,222,0.97)',
    backdropFilter: 'blur(18px)',
    borderRadius: 22,
    border: '2px solid',
    boxShadow: '0 24px 56px rgba(0,0,0,0.4)',
    padding: '40px 44px',
    maxWidth: 460,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    textAlign: 'center',
  },
  endIcon: {
    fontSize: 52,
    fontFamily: headingFontFamily,
    color: '#C8860A',
    lineHeight: 1,
  },
  endTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 36,
    lineHeight: 1.1,
  },
  endSub: {
    margin: 0,
    fontSize: 16,
    color: '#7A5F4E',
    lineHeight: 1.55,
  },
  timeRemainingBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    background: 'rgba(90,144,48,0.12)',
    border: '1px solid rgba(90,144,48,0.35)',
    borderRadius: 12,
    padding: '10px 24px',
  },
  timeRemainingLabel: { fontSize: 12, color: '#5A9030', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' },
  timeRemainingValue: { fontSize: 28, color: '#3A6820', fontFamily: headingFontFamily, lineHeight: 1 },
  endActions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtn: {
    padding: '12px 30px',
    borderRadius: 11,
    border: 'none',
    background: 'linear-gradient(135deg, #5A9030, #3E6820)',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 5px 16px rgba(58,88,32,0.38)',
  },
  secondaryBtn: {
    padding: '12px 30px',
    borderRadius: 11,
    border: '1px solid rgba(108,88,76,0.38)',
    background: 'transparent',
    color: '#6C584C',
    fontFamily: bodyFontFamily,
    fontSize: 16,
    cursor: 'pointer',
  },
}

// ── Modal styles ──────────────────────────────────────────────────────────────

const m: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
  },
  card: {
    background: 'rgba(248,243,225,0.98)',
    borderRadius: 22,
    border: '1px solid rgba(108,88,76,0.2)',
    boxShadow: '0 28px 60px rgba(0,0,0,0.55)',
    padding: '28px 32px 32px',
    maxWidth: 380,
    width: '92%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
    fontFamily: bodyFontFamily,
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 22,
    color: '#3A2810',
  },
  closeBtn: {
    padding: '5px 14px',
    borderRadius: 8,
    border: '1px solid rgba(108,88,76,0.3)',
    background: 'rgba(108,88,76,0.07)',
    color: '#6C584C',
    fontFamily: bodyFontFamily,
    fontSize: 13,
    cursor: 'pointer',
  },
  magnifierWrap: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  magnifierRing: {
    width: 200,
    height: 200,
    borderRadius: '50%',
    overflow: 'hidden',
    border: '5px solid',           // color set inline from data.colorHex
    boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 0 24px rgba(0,0,0,0.06)',
    background: 'rgba(240,230,210,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  magnifierImg: {
    width: 178,
    height: 178,
    objectFit: 'contain',
  },
  handle: {
    width: 10,
    height: 54,
    borderRadius: 5,
    transform: 'rotate(35deg) translateX(50px) translateY(-14px)',
    transformOrigin: 'top center',
    marginTop: -8,
    alignSelf: 'flex-end',
    marginRight: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  typeDot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    flexShrink: 0,
  },
  labelText: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  hint: {
    margin: 0,
    fontSize: 14,
    color: '#5A4030',
    textAlign: 'center',
    lineHeight: 1.55,
    padding: '10px 14px',
    background: 'rgba(90,144,48,0.08)',
    border: '1px solid rgba(90,144,48,0.22)',
    borderRadius: 10,
    fontStyle: 'italic',
    width: '100%',
    boxSizing: 'border-box',
  },
  continueBtn: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #5A9030, #3E6820)',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(58,88,32,0.38)',
  },
}
