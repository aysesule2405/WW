import { Readable } from 'stream'

type GuardianId = 'deer' | 'fox' | 'kodama' | 'mononoke'

interface VoiceSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
}

const clamp01 = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? fallback : Math.max(0, Math.min(1, parsed))
}

const parseBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const voiceIdFor = (guardianId: GuardianId): string => {
  const envKey = `ELEVENLABS_VOICE_ID_${guardianId.toUpperCase()}`
  return process.env[envKey] || ''
}

const DEFAULT_VOICE_SETTINGS: Record<GuardianId, VoiceSettings> = {
  deer:     { stability: 0.86, similarity_boost: 0.58, style: 0.08, use_speaker_boost: false },
  fox:      { stability: 0.28, similarity_boost: 0.92, style: 0.82, use_speaker_boost: true },
  kodama:   { stability: 0.18, similarity_boost: 0.63, style: 0.38, use_speaker_boost: false },
  mononoke: { stability: 0.22, similarity_boost: 0.97, style: 0.95, use_speaker_boost: true },
}

const voiceSettingsFor = (guardianId: GuardianId): VoiceSettings => {
  const prefix = `ELEVENLABS_${guardianId.toUpperCase()}`
  const defaults = DEFAULT_VOICE_SETTINGS[guardianId]
  return {
    stability: clamp01(process.env[`${prefix}_STABILITY`], defaults.stability),
    similarity_boost: clamp01(process.env[`${prefix}_SIMILARITY`], defaults.similarity_boost),
    style: clamp01(process.env[`${prefix}_STYLE`], defaults.style),
    use_speaker_boost: parseBool(process.env[`${prefix}_SPEAKER_BOOST`], defaults.use_speaker_boost),
  }
}

export default {
  synthesizeGuardian: async ({
    guardianId,
    text,
  }: {
    userId: string
    guardianId: string
    text: string
  }) => {
    if (!['deer', 'fox', 'kodama', 'mononoke'].includes(guardianId)) {
      throw new Error(`Unknown guardian: ${guardianId}`)
    }
    const gid = guardianId as GuardianId

    if (typeof text !== 'string' || text.trim().length < 1 || text.length > 240) {
      throw new Error('text must be a non-empty string under 240 characters')
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured')
    }

    const voiceId = voiceIdFor(gid)
    if (!voiceId) {
      throw new Error(`No ElevenLabs voice ID configured for guardian: ${guardianId}`)
    }
    const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2'
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[TTS] guardian=${gid} voice=*${voiceId.slice(-4)} model=${modelId}`)
    }

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: voiceSettingsFor(gid),
        }),
      }
    )

    if (!elevenRes.ok) {
      const details = await elevenRes.text()
      throw new Error(`ElevenLabs error ${elevenRes.status}: ${details}`)
    }

    const audioBuffer = Buffer.from(await elevenRes.arrayBuffer())
    const stream = Readable.from(audioBuffer)

    return {
      stream,
      contentType: 'audio/mpeg',
      voiceId,
      modelId,
    }
  },
}
