function sfxEnabled(): boolean {
  try { return JSON.parse(localStorage.getItem('ww_settings') ?? '{}').sound !== false } catch { return true }
}
function musicEnabled(): boolean {
  try { return JSON.parse(localStorage.getItem('ww_settings') ?? '{}').music !== false } catch { return true }
}

class AudioManager {
  private pool = new Map<string, HTMLAudioElement[]>()
  private musicEl: HTMLAudioElement | null = null
  private currentTrack = ''

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
    el.volume = Math.min(1, Math.max(0, volume))
    el.currentTime = 0
    el.play().catch(() => {})
  }

  playMusic(name: string, volume = 0.35) {
    if (!musicEnabled()) return
    if (this.currentTrack === name && this.musicEl && !this.musicEl.paused) return
    this.stopMusic()
    this.currentTrack = name
    const el = new Audio(`/assets/audio/music/${name}.mp3`)
    el.loop = true
    el.volume = volume
    el.play().catch(() => {})
    this.musicEl = el
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
    if (!musicEnabled()) this.stopMusic()
    // SFX check is inline per-play, so nothing extra needed
  }
}

export const audioManager = new AudioManager()
