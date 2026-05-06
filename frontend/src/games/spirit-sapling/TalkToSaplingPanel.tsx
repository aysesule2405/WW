import React, { useEffect, useRef, useState } from 'react'
import { uiFontFamily, titleFontFamily } from '../../theme/typography'
import { apiUrl, getToken } from '../../lib/api'

type Mode = 'text' | 'voice'
type RecordState = 'idle' | 'recording' | 'transcribing'

type KindnessResult = {
  approved: boolean
  reason: string
  growthBoost: number
}

type ChatMessage = {
  id: number
  speaker: 'sapling' | 'player'
  text: string
  approved?: boolean
}

type Props = {
  guardianName: string
  onClose: () => void
  onApproved: (growthBoost: number) => void
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

  type SpeechRecognitionErrorEventLike = Event & {
    readonly error: string
  }

  interface SpeechRecognitionLike extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    onstart: (() => void) | null
    onresult: ((event: SpeechRecognitionEventLike) => void) | null
    onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
    onend: (() => void) | null
    start: () => void
    stop: () => void
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

async function checkKindness(message: string): Promise<KindnessResult> {
  const token = getToken()
  const res = await fetch(apiUrl('/spirit-sapling/kindness-check'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
  })
  if (!res.ok) throw new Error(`Server error ${res.status}`)
  return res.json()
}

export default function TalkToSaplingPanel({ guardianName, onClose, onApproved }: Props) {
  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('')
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [micError, setMicError] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      speaker: 'sapling',
      text: 'I feel the grove around me. Kind, hopeful words help my energy return faster.',
    },
  ])
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const nextMessageIdRef = useRef(2)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  const currentMessage = mode === 'text' ? text.trim() : transcript.trim()
  const canSubmit = currentMessage.length > 2 && !loading

  const addMessage = (message: Omit<ChatMessage, 'id'>) => {
    const id = nextMessageIdRef.current
    nextMessageIdRef.current += 1
    setMessages((current) => [...current, { ...message, id }])
  }

  const startRecording = () => {
    setMicError('')
    setTranscript('')
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) {
      setMicError('Speech recognition is not available in this browser.')
      return
    }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = true

    rec.onstart = () => setRecordState('recording')
    rec.onresult = (e: SpeechRecognitionEventLike) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) setTranscript((prev) => prev + t)
        else interim = t
      }
      if (interim) setTranscript((prev) => prev + interim)
    }
    rec.onerror = (e: SpeechRecognitionErrorEventLike) => {
      if (e.error === 'not-allowed') setMicError('Microphone permission denied. Please allow access and try again.')
      else setMicError(`Recording error: ${e.error}`)
      setRecordState('idle')
    }
    rec.onend = () => setRecordState('idle')

    recognitionRef.current = rec
    rec.start()
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setRecordState('idle')
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    const submitted = currentMessage
    addMessage({ speaker: 'player', text: submitted })
    setText('')
    setTranscript('')
    setLoading(true)
    try {
      const res = await checkKindness(submitted)
      if (res.approved) {
        onApproved(res.growthBoost)
        addMessage({
          speaker: 'sapling',
          approved: true,
          text: res.reason || 'That felt gentle and true. My energy is returning faster.',
        })
      } else {
        addMessage({
          speaker: 'sapling',
          approved: false,
          text: res.reason || 'I need words that feel kinder and more hopeful before I can open up.',
        })
      }
    } catch {
      addMessage({
        speaker: 'sapling',
        approved: false,
        text: 'The grove could not hear clearly. Try again with one gentle sentence.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.panel}>
        <button style={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>

        <h3 style={s.heading}>Talk to Your Sapling</h3>
        <p style={s.sub}>
          Convince the sapling with kind words. Gemini listens for warmth, hope, and care.
        </p>

        <div style={s.chatBox}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...s.messageRow,
                justifyContent: message.speaker === 'player' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  ...s.messageBubble,
                  ...(message.speaker === 'player' ? s.playerBubble : s.saplingBubble),
                  ...(message.approved === true ? s.approvedBubble : {}),
                  ...(message.approved === false ? s.retryBubble : {}),
                }}
              >
                <span style={s.messageSpeaker}>
                  {message.speaker === 'player' ? 'You' : 'Sapling'}
                </span>
                <span>{message.text}</span>
              </div>
            </div>
          ))}
          {loading && (
            <div style={s.messageRow}>
              <div style={{ ...s.messageBubble, ...s.saplingBubble }}>
                <span style={s.messageSpeaker}>Sapling</span>
                <span>Listening through the leaves...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Mode tabs */}
        <div style={s.tabRow}>
          <button
            style={{ ...s.tab, ...(mode === 'text' ? s.tabActive : {}) }}
            onClick={() => setMode('text')}
          >
            ✏️ Write
          </button>
          <button
            style={{ ...s.tab, ...(mode === 'voice' ? s.tabActive : {}), ...(!hasSpeechRecognition ? s.tabDisabled : {}) }}
            onClick={() => { if (hasSpeechRecognition) setMode('voice') }}
            title={!hasSpeechRecognition ? 'Speech recognition not available in this browser' : undefined}
          >
            🎙️ Record
          </button>
        </div>

        {/* Text mode */}
        {mode === 'text' && (
          <textarea
            style={s.textarea}
            placeholder="Write something kind to your sapling..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={240}
            disabled={loading}
          />
        )}

        {/* Voice mode */}
        {mode === 'voice' && (
          <div style={s.voiceArea}>
            {!hasSpeechRecognition ? (
              <p style={s.micUnsupported}>
                Speech recognition is not supported in this browser. Please use the Write tab instead.
              </p>
            ) : (
              <>
                <div style={s.recordControls}>
                  {recordState === 'idle' ? (
                    <button style={s.recordBtn} onClick={startRecording}>
                      🎙️ Start Recording
                    </button>
                  ) : (
                    <button style={{ ...s.recordBtn, ...s.recordBtnStop }} onClick={stopRecording}>
                      ⏹ Stop Recording
                    </button>
                  )}
                  {recordState === 'recording' && (
                    <span style={s.recordingDot}>● Recording…</span>
                  )}
                </div>
                {micError && <p style={s.micError}>{micError}</p>}
                {transcript && (
                  <div style={s.transcriptBox}>
                    <p style={s.transcriptLabel}>Transcript:</p>
                    <p style={s.transcriptText}>{transcript}</p>
                    <button style={s.clearBtn} onClick={() => setTranscript('')}>Clear</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <button
          style={{ ...s.submitBtn, opacity: canSubmit ? 1 : 0.5 }}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {loading ? 'Asking Gemini...' : `Send to ${guardianName}'s sapling`}
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 16,
  },
  panel: {
    position: 'relative',
    width: 'min(560px, 100%)',
    maxHeight: 'min(760px, calc(100vh - 32px))',
    background: 'rgba(22, 14, 8, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 20,
    border: '1px solid rgba(242,204,143,0.3)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.7)',
    padding: '28px 26px 24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  closeBtn: {
    position: 'absolute',
    top: 12, right: 14,
    background: 'transparent',
    border: '1px solid rgba(100,200,100,0.3)',
    color: 'rgba(240,234,210,0.55)',
    fontSize: 18,
    cursor: 'pointer',
    padding: 4,
    lineHeight: 1,
  },
  heading: {
    margin: 0,
    fontFamily: titleFontFamily,
    fontSize: 24,
    color: '#FFF6DF',
    textAlign: 'center',
  },
  sub: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 13,
    color: '#d9c9a3',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  chatBox: {
    minHeight: 210,
    maxHeight: 280,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    border: '1px solid rgba(159, 196, 128, 0.22)',
    background: 'linear-gradient(180deg, rgba(21, 43, 24, 0.78), rgba(12, 25, 15, 0.82))',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '82%',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '9px 11px',
    borderRadius: 13,
    fontFamily: uiFontFamily,
    fontSize: 13,
    lineHeight: 1.4,
    color: '#F0EAD2',
  },
  saplingBubble: {
    background: 'rgba(62, 91, 49, 0.72)',
    border: '1px solid rgba(184, 218, 154, 0.22)',
    borderTopLeftRadius: 4,
  },
  playerBubble: {
    background: 'rgba(99, 74, 42, 0.78)',
    border: '1px solid rgba(242, 204, 143, 0.24)',
    borderTopRightRadius: 4,
  },
  approvedBubble: {
    boxShadow: '0 0 0 1px rgba(158, 222, 128, 0.32), 0 0 18px rgba(103, 185, 91, 0.22)',
  },
  retryBubble: {
    background: 'rgba(80, 74, 38, 0.78)',
  },
  messageSpeaker: {
    fontFamily: titleFontFamily,
    fontSize: 13,
    color: '#F2CC8F',
    lineHeight: 1,
  },
  tabRow: {
    display: 'flex',
    gap: 8,
  },
  tab: {
    flex: 1,
    padding: '8px 0',
    borderRadius: 9,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.05)',
    color: '#c4bd8e',
    fontFamily: uiFontFamily,
    fontSize: 14,
    cursor: 'pointer',
  },
  tabActive: {
    background: 'rgba(242,204,143,0.18)',
    border: '1px solid rgba(242,204,143,0.4)',
    color: '#f2cc8f',
  },
  tabDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  textarea: {
    width: '100%',
    borderRadius: 10,
    border: '1px solid rgba(242,204,143,0.25)',
    background: 'rgba(255,255,255,0.06)',
    color: '#F0EAD2',
    fontFamily: uiFontFamily,
    fontSize: 14,
    padding: '10px 12px',
    resize: 'none',
    boxSizing: 'border-box',
    outline: 'none',
    lineHeight: 1.5,
  },
  voiceArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  micUnsupported: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 13,
    color: '#c4a96e',
    textAlign: 'center',
    padding: '12px 0',
  },
  recordControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  recordBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    background: 'rgba(100,200,100,0.2)',
    color: '#b8f0b8',
    fontFamily: uiFontFamily,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as React.CSSProperties,
  recordBtnStop: {
    background: 'rgba(200,80,80,0.2)',
    color: '#f0b0b0',
    border: '1px solid rgba(200,80,80,0.35)',
  } as React.CSSProperties,
  recordingDot: {
    fontFamily: uiFontFamily,
    fontSize: 13,
    color: '#f87171',
    animation: 'pulse 1s ease-in-out infinite',
  },
  micError: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 12,
    color: '#f4a261',
  },
  transcriptBox: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  transcriptLabel: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 11,
    color: '#c4bd8e',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  transcriptText: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 14,
    color: '#F0EAD2',
    lineHeight: 1.5,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    color: '#c4bd8e',
    fontFamily: uiFontFamily,
    fontSize: 12,
    cursor: 'pointer',
    padding: '3px 10px',
  },
  resultBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: '12px 14px',
  },
  resultApproved: {
    background: 'rgba(100,200,100,0.12)',
    border: '1px solid rgba(100,200,100,0.3)',
  },
  resultRejected: {
    background: 'rgba(200,200,100,0.1)',
    border: '1px solid rgba(200,200,100,0.25)',
  },
  resultIcon: { fontSize: 20, lineHeight: 1, flexShrink: 0 },
  resultText: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 13,
    color: '#e8dcc4',
    lineHeight: 1.5,
  },
  submitBtn: {
    width: '100%',
    padding: '12px 0',
    borderRadius: 11,
    border: 'none',
    background: 'linear-gradient(135deg, #8B6B3A, #5A3E20)',
    color: '#FFF6DF',
    fontFamily: uiFontFamily,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 180ms ease',
  },
}
