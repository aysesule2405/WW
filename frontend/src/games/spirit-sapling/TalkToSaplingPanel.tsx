import React, { useEffect, useRef, useState } from 'react'
import { uiFontFamily, titleFontFamily } from '../../theme/typography'
import { apiUrl, getToken } from '../../lib/api'

type RecordState = 'idle' | 'recording'
type HistoryItem = { role: 'player' | 'sapling'; text: string }
type SaplingSentiment = 'positive' | 'negative' | 'neutral'

type ChatMessage = {
  id: number
  speaker: 'sapling' | 'player'
  text: string
  growthBoost?: number
  sentiment?: SaplingSentiment
  energyDeltaSeconds?: number
}

type Props = {
  guardianName: string
  onClose: () => void
  onEnergyEvaluated: (result: {
    sentiment: SaplingSentiment
    energyDeltaSeconds: number
    growthBoost: number
  }) => void
}

declare global {
  type SpeechRecognitionResultLike = {
    readonly isFinal: boolean
    readonly 0: { readonly transcript: string }
  }
  type SpeechRecognitionEventLike = Event & {
    readonly resultIndex: number
    readonly results: {
      readonly length: number
      readonly [index: number]: SpeechRecognitionResultLike
    }
  }
  type SpeechRecognitionErrorEventLike = Event & { readonly error: string }
  interface SpeechRecognitionLike extends EventTarget {
    lang: string; continuous: boolean; interimResults: boolean
    onstart: (() => void) | null
    onresult: ((event: SpeechRecognitionEventLike) => void) | null
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
    onend: (() => void) | null
    start: () => void; stop: () => void
  }
  type SpeechRecognitionConstructor = new () => SpeechRecognitionLike
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor | undefined
    webkitSpeechRecognition: SpeechRecognitionConstructor | undefined
  }
}

const hasSpeechRecognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition != null || window.webkitSpeechRecognition != null)

const OPENING_MESSAGES: Record<string, string> = {
  deer:       'I feel the earth breathing slowly beneath me... What is on your heart today?',
  fox:        "Oh! You came to visit me! The sunlight feels warmer when you're near. What shall we talk about?",
  kodama:     'The old woods told me you were coming. I have been waiting quietly. Tell me everything.',
  mononoke:   'You approach without fear. I like that. Speak freely — what does the wild in you want to say?',
  wanderer:   'You found me in this grove. Interesting. I travel far and rarely stay — but I will listen. What calls to you?',
  'silent one': '…the silence between us holds more than words. But if you must speak, I will hold it gently.',
}

async function sendChat(
  message: string,
  history: HistoryItem[],
  guardianId: string,
): Promise<{
  reply: string
  sentiment: SaplingSentiment
  energyDeltaSeconds: number
  growthBoost: number
}> {
  const token = getToken()
  const res = await fetch(apiUrl('/spirit-sapling/chat'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history, guardianId }),
  })
  if (!res.ok) throw new Error(`Server error ${res.status}`)
  return res.json()
}

export default function TalkToSaplingPanel({ guardianName, onClose, onEnergyEvaluated }: Props) {
  const guardianId = guardianName.toLowerCase()
  const openingText = OPENING_MESSAGES[guardianId] ?? OPENING_MESSAGES.deer

  const [text, setText] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [micError, setMicError] = useState('')
  const [sessionGrowth, setSessionGrowth] = useState(0)

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, speaker: 'sapling', text: openingText },
  ])

  const historyRef = useRef<HistoryItem[]>([])
  const nextIdRef = useRef(2)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => () => { recognitionRef.current?.stop() }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  const addMessage = (msg: Omit<ChatMessage, 'id'>) => {
    const id = nextIdRef.current++
    setMessages(prev => [...prev, { ...msg, id }])
  }

  const currentText = voiceMode ? transcript.trim() : text.trim()
  const canSend = currentText.length > 1 && !loading

  const startRecording = () => {
    setMicError('')
    setTranscript('')
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) { setMicError('Speech recognition not available in this browser.'); return }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = true
    rec.onstart = () => setRecordState('recording')
    rec.onresult = (e: SpeechRecognitionEventLike) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) setTranscript(p => p + t)
        else interim = t
      }
      if (interim) setTranscript(p => p + interim)
    }
    rec.onerror = (e: SpeechRecognitionErrorEventLike) => {
      setMicError(e.error === 'not-allowed'
        ? 'Microphone permission denied.'
        : `Recording error: ${e.error}`)
      setRecordState('idle')
    }
    rec.onend = () => setRecordState('idle')
    recognitionRef.current = rec
    rec.start()
  }

  const stopRecording = () => { recognitionRef.current?.stop(); setRecordState('idle') }

  const handleSend = async () => {
    if (!canSend) return
    const submitted = currentText
    setText('')
    setTranscript('')

    addMessage({ speaker: 'player', text: submitted })
    setLoading(true)

    const prevHistory = [...historyRef.current]

    try {
      const res = await sendChat(submitted, prevHistory, guardianId)

      historyRef.current = [
        ...prevHistory,
        { role: 'player', text: submitted },
        { role: 'sapling', text: res.reply },
      ]

      addMessage({
        speaker: 'sapling',
        text: res.reply,
        growthBoost: res.growthBoost,
        sentiment: res.sentiment,
        energyDeltaSeconds: res.energyDeltaSeconds,
      })

      onEnergyEvaluated({
        sentiment: res.sentiment,
        energyDeltaSeconds: res.energyDeltaSeconds,
        growthBoost: res.growthBoost,
      })

      if (res.growthBoost > 0) {
        setSessionGrowth(g => g + res.growthBoost)
      }
    } catch {
      addMessage({ speaker: 'sapling', text: 'The grove could not hear clearly just now. Try again?' })
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSend) handleSend()
    }
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.panel}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <span style={s.saplingIcon}>🌱</span>
            <div>
              <h3 style={s.heading}>Talk to Your Sapling</h3>
              <p style={s.sub}>
                {guardianName} guardian · {historyRef.current.length === 0
                  ? 'Start the conversation'
                  : `${Math.ceil(historyRef.current.length / 2)} exchange${Math.ceil(historyRef.current.length / 2) !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div style={s.headerRight}>
            {sessionGrowth > 0 && (
              <div style={s.growthBadge}>
                <span style={s.growthLeaf}>🌿</span>
                <span style={s.growthNum}>+{sessionGrowth}</span>
              </div>
            )}
            <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Chat window */}
        <div style={s.chatBox}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                ...s.messageRow,
                justifyContent: msg.speaker === 'player' ? 'flex-end' : 'flex-start',
              }}
            >
              {msg.speaker === 'sapling' && (
                <div style={s.avatarDot} title="Sapling">🌱</div>
              )}
              <div style={{
                ...s.bubble,
                ...(msg.speaker === 'player' ? s.playerBubble : s.saplingBubble),
              }}>
                {msg.text}
                {msg.speaker === 'sapling' && (msg.growthBoost ?? 0) > 0 && (
                  <span style={s.boostPip} title={`+${msg.growthBoost} growth`}>
                    {'✦'.repeat(msg.growthBoost ?? 1)}
                  </span>
                )}
                {msg.speaker === 'sapling' && msg.sentiment && (
                  <span
                    style={{
                      ...s.energyTag,
                      ...(msg.sentiment === 'positive'
                        ? s.energyTagPositive
                        : msg.sentiment === 'negative'
                          ? s.energyTagNegative
                          : s.energyTagNeutral),
                    }}
                  >
                    {energyTagText(msg.sentiment, msg.energyDeltaSeconds ?? 0)}
                  </span>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...s.messageRow, justifyContent: 'flex-start' }}>
              <div style={s.avatarDot}>🌱</div>
              <div style={{ ...s.bubble, ...s.saplingBubble, ...s.loadingBubble }}>
                <span style={s.dot} />
                <span style={{ ...s.dot, animationDelay: '0.2s' }} />
                <span style={{ ...s.dot, animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div style={s.inputArea}>
          {/* Mode toggle */}
          {hasSpeechRecognition && (
            <div style={s.modeToggle}>
              <button
                style={{ ...s.modeBtn, ...(voiceMode ? {} : s.modeBtnActive) }}
                onClick={() => setVoiceMode(false)}
              >✏️</button>
              <button
                style={{ ...s.modeBtn, ...(voiceMode ? s.modeBtnActive : {}) }}
                onClick={() => setVoiceMode(true)}
              >🎙️</button>
            </div>
          )}

          <div style={s.inputRow}>
            {!voiceMode ? (
              <textarea
                ref={textareaRef}
                style={s.textarea}
                placeholder="Say something to your sapling... (Enter to send)"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                maxLength={300}
                disabled={loading}
                autoFocus
              />
            ) : (
              <div style={s.voiceBox}>
                {recordState === 'idle' ? (
                  <button style={s.recordBtn} onClick={startRecording}>
                    🎙️ Start Recording
                  </button>
                ) : (
                  <button style={{ ...s.recordBtn, ...s.recordStop }} onClick={stopRecording}>
                    ⏹ Stop
                  </button>
                )}
                {recordState === 'recording' && <span style={s.recDot}>● Recording…</span>}
                {transcript && <p style={s.transcriptPreview}>{transcript}</p>}
                {micError && <p style={s.micErr}>{micError}</p>}
              </div>
            )}

            <button
              style={{ ...s.sendBtn, opacity: canSend ? 1 : 0.45 }}
              onClick={handleSend}
              disabled={!canSend}
              title="Send (Enter)"
            >
              {loading ? '…' : '↑'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function energyTagText(sentiment: SaplingSentiment, _delta: number): string {
  if (sentiment === 'positive') return '✦ orb restored'
  if (sentiment === 'negative') return 'grove darkened'
  return 'unchanged'
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
  },
  panel: {
    position: 'relative',
    width: 'min(580px, 100%)',
    maxHeight: 'min(720px, calc(100vh - 32px))',
    background: 'rgba(18, 12, 6, 0.97)',
    backdropFilter: 'blur(20px)',
    borderRadius: 22,
    border: '1px solid rgba(159, 196, 128, 0.25)',
    boxShadow: '0 32px 64px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.04)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  /* Header */
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px 14px',
    borderBottom: '1px solid rgba(159, 196, 128, 0.15)',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  saplingIcon: { fontSize: 28, lineHeight: 1, filter: 'drop-shadow(0 0 8px rgba(100,200,80,0.5))' },
  heading: {
    margin: 0,
    fontFamily: titleFontFamily,
    fontSize: 20,
    color: '#FFF6DF',
    lineHeight: 1.1,
  },
  sub: {
    margin: '2px 0 0',
    fontFamily: uiFontFamily,
    fontSize: 12,
    color: '#8ba878',
    lineHeight: 1,
  },
  growthBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(100,200,80,0.12)',
    border: '1px solid rgba(100,200,80,0.3)',
    borderRadius: 999,
    padding: '4px 10px',
  },
  growthLeaf: { fontSize: 14, lineHeight: 1 },
  growthNum: {
    fontFamily: titleFontFamily,
    fontSize: 14,
    color: '#a8e080',
    lineHeight: 1,
  },
  closeBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    color: 'rgba(240,234,210,0.45)',
    fontSize: 16,
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: 1,
  },

  /* Chat */
  chatBox: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '16px 18px',
    minHeight: 200,
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatarDot: {
    fontSize: 18,
    lineHeight: 1,
    flexShrink: 0,
    marginBottom: 2,
    filter: 'drop-shadow(0 0 6px rgba(100,200,80,0.4))',
  },
  bubble: {
    maxWidth: '78%',
    padding: '9px 13px',
    borderRadius: 16,
    fontFamily: uiFontFamily,
    fontSize: 14,
    lineHeight: 1.5,
    color: '#F0EAD2',
    position: 'relative',
  },
  saplingBubble: {
    background: 'rgba(50, 78, 38, 0.75)',
    border: '1px solid rgba(159, 196, 128, 0.2)',
    borderBottomLeftRadius: 4,
  },
  playerBubble: {
    background: 'rgba(108, 74, 36, 0.8)',
    border: '1px solid rgba(242, 204, 143, 0.2)',
    borderBottomRightRadius: 4,
  },
  loadingBubble: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '12px 16px',
  },
  dot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#8ba878',
    animation: 'sapling-dot-bounce 1.1s ease-in-out infinite',
    animationDelay: '0s',
  },
  boostPip: {
    position: 'absolute',
    top: -8,
    right: 6,
    fontSize: 10,
    color: '#a8e080',
    letterSpacing: 1,
    textShadow: '0 0 8px rgba(100,200,80,0.6)',
  },
  energyTag: {
    display: 'block',
    width: 'fit-content',
    marginTop: 7,
    padding: '2px 8px',
    borderRadius: 999,
    fontFamily: uiFontFamily,
    fontSize: 11,
    fontWeight: 700,
  },
  energyTagPositive: {
    color: '#dff7b8',
    background: 'rgba(102, 190, 84, 0.18)',
    border: '1px solid rgba(102, 190, 84, 0.32)',
  },
  energyTagNegative: {
    color: '#ffd2c7',
    background: 'rgba(217, 95, 73, 0.16)',
    border: '1px solid rgba(217, 95, 73, 0.3)',
  },
  energyTagNeutral: {
    color: '#d9c9a3',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
  },

  /* Input */
  inputArea: {
    padding: '12px 16px 16px',
    borderTop: '1px solid rgba(159, 196, 128, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flexShrink: 0,
  },
  modeToggle: {
    display: 'flex',
    gap: 4,
    alignSelf: 'flex-start',
  },
  modeBtn: {
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'rgba(240,234,210,0.4)',
    fontSize: 15,
    cursor: 'pointer',
  },
  modeBtnActive: {
    background: 'rgba(159,196,128,0.15)',
    border: '1px solid rgba(159,196,128,0.35)',
    color: '#c8e8a8',
  },
  inputRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-end',
  },
  textarea: {
    flex: 1,
    borderRadius: 12,
    border: '1px solid rgba(159,196,128,0.25)',
    background: 'rgba(255,255,255,0.05)',
    color: '#F0EAD2',
    fontFamily: uiFontFamily,
    fontSize: 14,
    padding: '10px 13px',
    resize: 'none',
    boxSizing: 'border-box',
    outline: 'none',
    lineHeight: 1.5,
  } as React.CSSProperties,
  sendBtn: {
    flexShrink: 0,
    width: 42,
    height: 42,
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #6a9e40, #3d6020)',
    color: '#e8f8d0',
    fontSize: 20,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 160ms ease',
  } as React.CSSProperties,
  voiceBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap' as React.CSSProperties['flexWrap'],
  },
  recordBtn: {
    padding: '9px 16px',
    borderRadius: 10,
    border: '1px solid rgba(100,200,100,0.3)',
    background: 'rgba(100,200,100,0.12)',
    color: '#b8f0b8',
    fontFamily: uiFontFamily,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  recordStop: {
    background: 'rgba(200,80,80,0.15)',
    border: '1px solid rgba(200,80,80,0.3)',
    color: '#f0b0b0',
  } as React.CSSProperties,
  recDot: {
    fontFamily: uiFontFamily,
    fontSize: 13,
    color: '#f87171',
    animation: 'pulse 1s ease-in-out infinite',
  },
  transcriptPreview: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 13,
    color: '#d9c9a3',
    lineHeight: 1.4,
    flex: 1,
  },
  micErr: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 12,
    color: '#f4a261',
  },
}
