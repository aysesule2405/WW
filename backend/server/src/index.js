import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'

const app = express()
app.use(cors())
app.use(express.json())

const guardianVoices = {
  deer: process.env.ELEVENLABS_VOICE_ID_DEER || '',
  fox: process.env.ELEVENLABS_VOICE_ID_FOX || '',
  kodama: process.env.ELEVENLABS_VOICE_ID_KODAMA || '',
  mononoke: process.env.ELEVENLABS_VOICE_ID_MONONOKE || '',
}

const clamp01 = (value, fallback) => {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) return fallback
  return Math.max(0, Math.min(1, parsed))
}

const parseBoolean = (value, fallback) => {
  if (value === 'true') return true
  if (value === 'false') return false
  return fallback
}

const guardianVoiceSettings = {
  deer: {
    // Softer Deer: steady, warm, minimally stylized.
    stability: clamp01(process.env.ELEVENLABS_DEER_STABILITY, 0.86),
    similarity_boost: clamp01(process.env.ELEVENLABS_DEER_SIMILARITY, 0.58),
    style: clamp01(process.env.ELEVENLABS_DEER_STYLE, 0.08),
    use_speaker_boost: parseBoolean(process.env.ELEVENLABS_DEER_SPEAKER_BOOST, false),
  },
  fox: {
    // Trickster Fox: playful and expressive.
    stability: clamp01(process.env.ELEVENLABS_FOX_STABILITY, 0.28),
    similarity_boost: clamp01(process.env.ELEVENLABS_FOX_SIMILARITY, 0.92),
    style: clamp01(process.env.ELEVENLABS_FOX_STYLE, 0.82),
    use_speaker_boost: parseBoolean(process.env.ELEVENLABS_FOX_SPEAKER_BOOST, true),
  },
  kodama: {
    // Whispery Kodama: airy, fragile, spirit-like tone.
    stability: clamp01(process.env.ELEVENLABS_KODAMA_STABILITY, 0.18),
    similarity_boost: clamp01(process.env.ELEVENLABS_KODAMA_SIMILARITY, 0.63),
    style: clamp01(process.env.ELEVENLABS_KODAMA_STYLE, 0.38),
    use_speaker_boost: parseBoolean(process.env.ELEVENLABS_KODAMA_SPEAKER_BOOST, false),
  },
  mononoke: {
    // Dramatic Mononoke: bold and theatrical.
    stability: clamp01(process.env.ELEVENLABS_MONONOKE_STABILITY, 0.22),
    similarity_boost: clamp01(process.env.ELEVENLABS_MONONOKE_SIMILARITY, 0.97),
    style: clamp01(process.env.ELEVENLABS_MONONOKE_STYLE, 0.95),
    use_speaker_boost: parseBoolean(process.env.ELEVENLABS_MONONOKE_SPEAKER_BOOST, true),
  },
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Example API endpoint
app.get('/api/greeting', (req, res) => {
  res.json({ message: 'Hello from server' })
})

app.post('/api/tts/guardian', async (req, res) => {
  try {
    const { guardianId, text } = req.body || {}

    if (!guardianId || !text) {
      return res.status(400).json({ error: 'guardianId and text are required.' })
    }

    if (typeof text !== 'string' || text.trim().length < 1 || text.length > 240) {
      return res.status(400).json({ error: 'text must be a non-empty string under 240 chars.' })
    }

    const voiceId = guardianVoices[guardianId]
    if (!voiceId) {
      return res.status(400).json({ error: `No voice configured for guardian: ${guardianId}` })
    }

    const voiceSettings = guardianVoiceSettings[guardianId] || {
      stability: 0.55,
      similarity_boost: 0.75,
      style: 0.35,
      use_speaker_boost: true,
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY is not configured on the server.' })
    }

    const elevenResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
        voice_settings: voiceSettings,
      }),
    })

    if (!elevenResponse.ok) {
      const details = await elevenResponse.text()
      return res.status(502).json({ error: 'ElevenLabs request failed.', details })
    }

    const audioBuffer = Buffer.from(await elevenResponse.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Cache-Control', 'no-store')
    return res.send(audioBuffer)
  } catch (error) {
    console.error('TTS error:', error)
    return res.status(500).json({ error: 'Failed to generate guardian speech.' })
  }
})

const startPort = process.env.PORT ? Number(process.env.PORT) : 4001

// Try to listen on a port, incrementing if the port is in use.
const tryListen = (portToTry, maxPort = portToTry + 10) => {
  const server = app.listen(portToTry, () => {
    console.log(`Server listening on http://localhost:${portToTry}`)
  })

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      server.close()
      const nextPort = portToTry + 1
      if (nextPort <= maxPort) {
        // eslint-disable-next-line no-console
        console.warn(`Port ${portToTry} in use, trying ${nextPort}...`)
        tryListen(nextPort, maxPort)
      } else {
        // eslint-disable-next-line no-console
        console.error(`No available ports between ${portToTry} and ${maxPort}`)
        process.exit(1)
      }
    } else {
      // eslint-disable-next-line no-console
      console.error('Server error:', err)
      process.exit(1)
    }
  })
}

tryListen(startPort)
