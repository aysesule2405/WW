import { useEffect, useRef, useState } from 'react'
import { createDeliveryGame } from '../game/delivery/createDeliveryGame'
import { DELIVERY_TYPES } from '../game/delivery/types'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'

type Props = {
  onExit: () => void
}

type EndResult = { outcome: 'win' | 'lose'; deliveries: number }

const RULES = [
  { icon: '🗺️', text: 'Walk to each glowing package and step on it to pick it up.' },
  { icon: '🏠', text: 'Each house has a coloured symbol matching a package — deliver to the right one.' },
  { icon: '✅', text: 'Correct delivery: the house cheers and your count goes up.' },
  { icon: '❌', text: 'Wrong house: 5 seconds penalty and the package stays with you.' },
  { icon: '⏱',  text: 'You have 2 minutes to deliver all 4 packages.' },
  { icon: '🌬️', text: 'Use Arrow Keys to move. One package at a time.' },
]

export default function DeliveryGame({ onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const apiRef = useRef<ReturnType<typeof createDeliveryGame> | null>(null)
  const [showRules, setShowRules] = useState(true)
  const [result, setResult] = useState<EndResult | null>(null)
  const [sessionId, setSessionId] = useState(0)

  useEffect(() => {
    if (showRules || result !== null || !containerRef.current) return

    apiRef.current = createDeliveryGame(containerRef.current, {
      onGameEnd: (outcome, deliveries) => {
        apiRef.current?.destroy()
        apiRef.current = null
        setResult({ outcome, deliveries })
      },
    })

    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
  }, [showRules, result, sessionId])

  // ── Rules ──────────────────────────────────────────────────────────────────
  if (showRules) {
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <button style={s.backBtn} onClick={onExit}>← Back to Grove</button>
          <h2 style={s.heading}>Delivery on the Wind</h2>
          <div style={{ width: 130 }} />
        </div>

        <div style={s.rulesWrap}>
          <div style={s.rulesCard}>
            <h3 style={s.rulesTitle}>How to Play</h3>
            <p style={s.rulesSub}>
              Help <strong>Kiki</strong> deliver all 4 packages before time runs out!
            </p>

            <ul style={s.rulesList}>
              {RULES.map((r, i) => (
                <li key={i} style={s.ruleRow}>
                  <span style={s.ruleIcon}>{r.icon}</span>
                  <span style={s.ruleText}>{r.text}</span>
                </li>
              ))}
            </ul>

            <div style={s.packageLegend}>
              {DELIVERY_TYPES.map((d) => (
                <div key={d.type} style={s.legendItem}>
                  <span
                    style={{
                      ...s.legendDot,
                      background: d.colorHex,
                      boxShadow: `0 0 8px ${d.colorHex}88`,
                    }}
                  >
                    {d.letter}
                  </span>
                  <span style={s.legendLabel}>{d.label}</span>
                </div>
              ))}
            </div>

            <button style={s.beginBtn} onClick={() => setShowRules(false)}>
              Begin Delivery  →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── End screen ─────────────────────────────────────────────────────────────
  if (result !== null) {
    const won = result.outcome === 'win'
    return (
      <div style={s.page}>
        <div style={s.topBar}>
          <button style={s.backBtn} onClick={onExit}>← Back to Grove</button>
          <h2 style={s.heading}>Delivery on the Wind</h2>
          <div style={{ width: 130 }} />
        </div>

        <div style={s.endWrap}>
          <div
            style={{
              ...s.endCard,
              borderColor: won ? 'rgba(173,193,120,0.45)' : 'rgba(200,100,100,0.4)',
            }}
          >
            <div style={{ ...s.endEmoji }}>{won ? '✨' : '⏰'}</div>
            <h3
              style={{
                ...s.endTitle,
                color: won ? '#4A7C20' : '#8B2500',
              }}
            >
              {won ? 'All Delivered!' : 'Time is up!'}
            </h3>
            <p style={s.endSub}>
              {won
                ? 'Kiki delivered every package — the grove is grateful! 🌸'
                : `${result.deliveries} of 4 packages delivered.`}
            </p>

            <div style={s.endActions}>
              <button
                style={s.primaryBtn}
                onClick={() => {
                  setResult(null)
                  setSessionId((v) => v + 1)
                }}
              >
                Play Again
              </button>
              <button style={s.secondaryBtn} onClick={onExit}>
                Back to Grove
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Game canvas ─────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onExit}>← Back to Grove</button>
        <h2 style={s.heading}>Delivery on the Wind</h2>
        <div style={{ width: 130 }} />
      </div>
      <div key={sessionId} ref={containerRef} style={s.gameWrap} />
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: `linear-gradient(rgba(10,18,8,0.28),rgba(10,18,8,0.28)),
      url('/assets/backgrounds/delivery-on-the-wind/game-bg.png') center/cover no-repeat`,
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    fontFamily: bodyFontFamily,
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    background: 'rgba(10,18,8,0.6)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(173,193,120,0.2)',
    flexShrink: 0,
  },
  backBtn: {
    width: 130,
    padding: '7px 14px',
    borderRadius: 8,
    border: '1px solid rgba(240,234,210,0.3)',
    background: 'rgba(240,234,210,0.08)',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    cursor: 'pointer',
  },
  heading: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 24,
    color: '#F0EAD2',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
  },
  gameWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // ── Rules ──
  rulesWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  rulesCard: {
    background: 'rgba(246,241,222,0.96)',
    backdropFilter: 'blur(16px)',
    borderRadius: 20,
    border: '1px solid rgba(108,88,76,0.25)',
    boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
    padding: '32px 36px',
    maxWidth: 520,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  rulesTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 30,
    color: '#5A3E28',
    textAlign: 'center',
  },
  rulesSub: {
    margin: 0,
    fontSize: 15,
    color: '#7A5F4E',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  rulesList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  ruleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '8px 12px',
    borderRadius: 10,
    background: 'rgba(108,88,76,0.07)',
  },
  ruleIcon: { fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 2 },
  ruleText: { fontSize: 14, color: '#5A3E28', lineHeight: 1.5 },

  packageLegend: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    padding: '10px 4px',
    borderTop: '1px solid rgba(108,88,76,0.15)',
    borderBottom: '1px solid rgba(108,88,76,0.15)',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 28,
    height: 28,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: 13,
    color: '#6C584C',
    fontWeight: 600,
  },

  beginBtn: {
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #5A9030, #3E6820)',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 18,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
    boxShadow: '0 6px 20px rgba(58,88,32,0.4)',
  },

  // ── End ──
  endWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  endCard: {
    background: 'rgba(246,241,222,0.96)',
    backdropFilter: 'blur(16px)',
    borderRadius: 20,
    border: '1px solid',
    boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
    padding: '36px 40px',
    maxWidth: 440,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    textAlign: 'center',
  },
  endEmoji: { fontSize: 52, lineHeight: 1 },
  endTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 34,
    lineHeight: 1.1,
  },
  endSub: {
    margin: 0,
    fontSize: 16,
    color: '#7A5F4E',
    lineHeight: 1.55,
  },
  endActions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtn: {
    padding: '11px 28px',
    borderRadius: 10,
    border: 'none',
    background: '#5A9030',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(58,88,32,0.35)',
  },
  secondaryBtn: {
    padding: '11px 28px',
    borderRadius: 10,
    border: '1px solid rgba(108,88,76,0.35)',
    background: 'transparent',
    color: '#6C584C',
    fontFamily: bodyFontFamily,
    fontSize: 16,
    cursor: 'pointer',
  },
}
