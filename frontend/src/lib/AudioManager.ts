function getSettings() {
  try { return JSON.parse(localStorage.getItem('ww_settings') ?? '{}') } catch { return {} }
}
function sfxEnabled(): boolean   { return getSettings().sound  !== false }
function musicEnabled(): boolean { return getSettings().music  !== false }
function sfxVolume(): number     { return Math.min(1, Math.max(0, getSettings().sfxVolume   ?? 0.8)) }
function musicVolume(): number   { return Math.min(1, Math.max(0, getSettings().musicVolume ?? 0.35)) }

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext
  }
}

class AudioManager {
  private pool = new Map<string, HTMLAudioElement[]>()
  private musicEl: HTMLAudioElement | null = null
  private currentTrack = ''
  private audioCtx: AudioContext | null = null

  preload(paths: string[], poolSize = 3) {
    for (const path of paths) {
      if (this.pool.has(path)) continue
      this.pool.set(path, Array.from({ length: poolSize }, () => {
        const a = new Audio(path)
        a.preload = 'auto'
        return a
      }))
    }
  }

  play(path: string, volume = 1) {
    if (!sfxEnabled()) return
    const pool = this.pool.get(path)
    let el: HTMLAudioElement
    if (pool) {
      el = pool.find(a => a.paused || a.ended) ?? pool[0]
    } else {
      el = new Audio(path)
    }
    el.volume = Math.min(1, Math.max(0, volume * sfxVolume()))
    el.currentTime = 0
    el.play().catch(() => {})
  }

  private context(): AudioContext | null {
    if (!sfxEnabled()) return null
    const AudioCtor = window.AudioContext ?? window.webkitAudioContext
    if (!AudioCtor) return null
    this.audioCtx ??= new AudioCtor()
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {})
    }
    return this.audioCtx
  }

  private tone({
    frequency,
    duration,
    type = 'sine',
    volume = 0.18,
    delay = 0,
  }: {
    frequency: number
    duration: number
    type?: OscillatorType
    volume?: number
    delay?: number
  }) {
    const ctx = this.context()
    if (!ctx) return
    const scaledVol = volume * sfxVolume()
    const start = ctx.currentTime + delay
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(scaledVol, start + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + duration + 0.04)
  }

  playWater(volume = 0.2) {
    this.tone({ frequency: 540, duration: 0.16, type: 'triangle', volume })
    this.tone({ frequency: 410, duration: 0.18, type: 'sine', volume: volume * 0.7, delay: 0.08 })
    this.tone({ frequency: 690, duration: 0.12, type: 'triangle', volume: volume * 0.45, delay: 0.16 })
  }

  playSun(volume = 0.16) {
    this.tone({ frequency: 620, duration: 0.22, type: 'sine', volume })
    this.tone({ frequency: 930, duration: 0.3, type: 'sine', volume: volume * 0.62, delay: 0.04 })
    this.tone({ frequency: 1240, duration: 0.24, type: 'triangle', volume: volume * 0.42, delay: 0.1 })
  }

  playSoftChime(volume = 0.12) {
    this.tone({ frequency: 784, duration: 0.18, type: 'sine', volume })
    this.tone({ frequency: 1046, duration: 0.22, type: 'sine', volume: volume * 0.75, delay: 0.09 })
  }

  playMusic(name: string) {
    if (!musicEnabled()) return
    if (this.currentTrack === name && this.musicEl && !this.musicEl.paused) return
    this.stopMusic()
    this.currentTrack = name
    const el = new Audio(`/assets/audio/music/${name}.mp3`)
    el.loop = true
    el.volume = musicVolume()
    el.play().catch(() => {})
    this.musicEl = el
  }

  setMusicVolume(v: number) {
    if (this.musicEl) {
      this.musicEl.volume = Math.min(1, Math.max(0, v))
    }
  }

  stopMusic(fadeDurationMs = 0) {
    const el = this.musicEl
    if (!el) return
    this.musicEl = null
    this.currentTrack = ''
    if (fadeDurationMs > 0) {
      const step = el.volume / (fadeDurationMs / 50)
      const id = setInterval(() => {
        if (el.volume > step) {
          el.volume = Math.max(0, el.volume - step)
        } else {
          el.pause()
          clearInterval(id)
        }
      }, 50)
    } else {
      el.pause()
    }
  }

  syncSettings() {
    if (!musicEnabled()) {
      this.stopMusic()
    } else if (this.musicEl) {
      this.musicEl.volume = musicVolume()
    }
  }
}

export const audioManager = new AudioManager()
