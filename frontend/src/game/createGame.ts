import Phaser from "phaser";
import { bodyFontFamily, numberFontFamily } from '../theme/typography';
import { audioManager } from '../lib/AudioManager';

// ── Audio ─────────────────────────────────────────────────────────────────────

const SFX = {
  pop:      '/assets/audio/sfx/spirit-drift/pop.mp3',
  gold:     '/assets/audio/sfx/spirit-drift/gold.mp3',
  combo:    '/assets/audio/sfx/spirit-drift/combo.mp3',
  miss:     '/assets/audio/sfx/spirit-drift/miss.mp3',
  curse:    '/assets/audio/sfx/spirit-drift/curse.mp3',
  surge:    '/assets/audio/sfx/spirit-drift/surge.mp3',
  gameover: '/assets/audio/sfx/spirit-drift/gameover.mp3',
} as const

// ── Types ─────────────────────────────────────────────────────────────────────

type GameAPI     = { start: () => void; stop: () => void; destroy: () => void }
type RunResult   = {
  score:          number
  raresCaught:    number
  fleetingCaught: number
  cursedCaught:   number
  maxComboStreak: number
  timingBonuses:  number
}
type GameOptions = { onGameEnd?: (result: RunResult) => void; realmId?: string }
type SpiritKind  = 'common' | 'silver' | 'gold' | 'fleeting' | 'cursed'

interface SpiritSpec {
  key:       string
  points:    number
  scale:     number
  kind:      SpiritKind
  speedMult: number    // 1.0 = normal, >1 = faster
}

interface Phase {
  name:         string
  label:        string
  until:        number  // timeLeftMs threshold for this phase to be active
  spawnMs:      number  // base spawn interval
  moveBase:     number  // base cross-screen duration (ms)
  jitter:       number  // random jitter added to spawn interval
  cursedRate:   number
  silverRate:   number
  fleetingRate: number
  goldRate:     number
}

// ── Realm asset maps ──────────────────────────────────────────────────────────

const VALID_REALMS = new Set(['wind', 'forest', 'lake', 'mountain'])

const REALM_BG: Record<string, string> = {
  wind:     '/assets/backgrounds/spirit-drift/Spirit%20Drift%20Wind%20Realm%20Background.png',
  forest:   '/assets/backgrounds/spirit-drift/Spirit%20Drift%20Forest%20Realm%20Background.png',
  lake:     '/assets/backgrounds/spirit-drift/Spirit%20Drift%20Lake%20Realm%20Background.png',
  mountain: '/assets/backgrounds/spirit-drift/Spirit%20Drift%20Mountain%20Realm%20Background.png',
}

const GLOW_COLORS: Record<SpiritKind, number> = {
  common:   0xffffff,  // white
  silver:   0xaad8ff,  // light blue
  gold:     0xffe070,  // gold
  fleeting: 0x90ee90,  // light green
  cursed:   0x3d1a80,  // dark indigo
}

// ── Scene ─────────────────────────────────────────────────────────────────────

class CatchWindSpritesScene extends Phaser.Scene {
  private readonly onGameEnd?: (result: RunResult) => void
  private readonly realmId:    string

  // ── State ──────────────────────────────────────────────────────────────────
  private running       = false
  private timeLeftMs    = 60_000
  private targetScore   = 0
  private displayedScore = 0

  // ── Combo / multiplier ─────────────────────────────────────────────────────
  private comboCount   = 0
  private multiplier   = 1
  private comboDecayTimer?: Phaser.Time.TimerEvent

  // Combo thresholds: reach this count → step up multiplier
  private readonly COMBO_STEPS = [4, 9, 16]   // ×2 at 4, ×3 at 9, ×4 at 16

  // ── Phase system ──────────────────────────────────────────────────────────
  private readonly phases: Phase[] = [
    {
      name: 'The Awakening', label: '❧ PHASE I',
      until: 40_000,
      spawnMs: 1900, moveBase: 7400, jitter: 320,
      cursedRate: 0.04, silverRate: 0.05, fleetingRate: 0.00, goldRate: 0.03,
    },
    {
      name: 'The Drift', label: '❧ PHASE II',
      until: 15_000,
      spawnMs: 1150, moveBase: 5400, jitter: 200,
      cursedRate: 0.08, silverRate: 0.07, fleetingRate: 0.06, goldRate: 0.04,
    },
    {
      name: 'The Storm', label: '❧ PHASE III',
      until: 0,
      spawnMs:  680, moveBase: 3900, jitter: 110,
      cursedRate: 0.13, silverRate: 0.06, fleetingRate: 0.10, goldRate: 0.04,
    },
  ]
  private currentPhase = this.phases[0]
  private currentSpawnMs  = 1900
  private currentMoveBase = 7400
  private finalRushStarted = false
  private inSurge = false

  // ── Per-run stats (for achievements) ─────────────────────────────────────
  private raresCaught    = 0
  private fleetingCaught = 0
  private cursedCaught   = 0
  private maxComboStreak = 0
  private timingBonuses  = 0

  // ── Active spirits (wave-motion tracking) ─────────────────────────────────
  private activeSpirits = new Set<Phaser.GameObjects.Image>()

  // ── HUD refs ──────────────────────────────────────────────────────────────
  private scoreText?:      Phaser.GameObjects.Text
  private timerText?:      Phaser.GameObjects.Text
  private multiplierText?: Phaser.GameObjects.Text
  private comboText?:      Phaser.GameObjects.Text
  private phaseLabelText?: Phaser.GameObjects.Text
  private glowRect?:       Phaser.GameObjects.Rectangle

  // ── Banner queue (prevents overlapping phase / milestone text) ───────────
  private bannerQueue: Array<{ text: string; color: string }> = []
  private bannerBusy  = false

  // ── Events ────────────────────────────────────────────────────────────────
  private spawnEvent?: Phaser.Time.TimerEvent
  private tickEvent?:  Phaser.Time.TimerEvent
  private surgeEvent?: Phaser.Time.TimerEvent

  // ── WebAudio for tonal pop ─────────────────────────────────────────────────
  private audioCtx?:   AudioContext
  private masterGain?: GainNode

  // ── Constructor ────────────────────────────────────────────────────────────

  constructor(options?: GameOptions) {
    super('catch-wind-sprites')
    this.onGameEnd = options?.onGameEnd
    this.realmId   = VALID_REALMS.has(options?.realmId ?? '') ? options!.realmId! : 'wind'
  }

  // ── Phaser lifecycle ──────────────────────────────────────────────────────

  preload() {
    const r = this.realmId
    this.load.image('spirit-1',    `/assets/sprites/${r}-spirit-1.png`)
    this.load.image('spirit-2',    `/assets/sprites/${r}-spirit-2.png`)
    this.load.image('spirit-3',    `/assets/sprites/${r}-spirit-3.png`)
    this.load.image('spirit-rare', `/assets/sprites/${r}-spirit-rare.png`)
    this.load.image('bg',          REALM_BG[r])
    audioManager.preload(Object.values(SFX), 4)
  }

  create() {
    const { width, height } = this.scale

    // Background
    const bg = this.add.image(width / 2, height / 2, 'bg')
    bg.setDepth(-1000).setScrollFactor(0)
    const scX = width / bg.width
    const scY = height / bg.height
    bg.setScale(Math.max(scX, scY))

    // Glow overlay (intensity tracks elapsed time)
    this.glowRect = this.add
      .rectangle(width / 2, height / 2, width + 200, height + 200, 0x4a1a7a, 0)
      .setDepth(-500)

    this.buildGlowTexture()
    this.buildHUD(width, height)
    this.initAudio()

    // Miss / empty-click penalty
    this.input.on(
      'pointerdown',
      (_p: Phaser.Input.Pointer, objs: Phaser.GameObjects.GameObject[]) => {
        if (!this.running) return
        if (objs.length === 0) {
          this.targetScore = Math.max(0, this.targetScore - 1)
          this.breakCombo()
          this.floatText('−1', _p.worldX, _p.worldY, '#ff7eb3')
          audioManager.play(SFX.miss, 0.45)
        }
      }
    )
  }

  // ── Update: score lerp + wave motion ──────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.running) return

    // Score roll-up
    if (this.displayedScore !== this.targetScore) {
      const diff = this.targetScore - this.displayedScore
      this.displayedScore += Math.sign(diff) * Math.max(1, Math.ceil(Math.abs(diff) * 0.20))
      if (Math.sign(this.targetScore - this.displayedScore) !== Math.sign(diff)) {
        this.displayedScore = this.targetScore
      }
      this.scoreText?.setText(`${this.displayedScore}`)
    }

    // Wave-motion for every active spirit
    for (const spirit of this.activeSpirits) {
      if (!spirit.active) {
        ;(spirit.getData('glow') as Phaser.GameObjects.Image | null)?.destroy()
        this.activeSpirits.delete(spirit)
        continue
      }

      const elapsed: number = (spirit.getData('elapsed') as number) + delta
      spirit.setData('elapsed', elapsed)
      const duration: number = spirit.getData('duration') as number
      const t = elapsed / duration

      if (t >= 1) {
        this.activeSpirits.delete(spirit)
        ;(spirit.getData('glow') as Phaser.GameObjects.Image | null)?.destroy()
        spirit.destroy()
        continue
      }

      const startX: number = spirit.getData('startX') as number
      const endX:   number = spirit.getData('endX')   as number
      const startY: number = spirit.getData('startY') as number
      const endY:   number = spirit.getData('endY')   as number
      const amp1:   number = spirit.getData('amp1')   as number
      const freq1:  number = spirit.getData('freq1')  as number
      const ph1:    number = spirit.getData('ph1')    as number
      const amp2:   number = spirit.getData('amp2')   as number
      const freq2:  number = spirit.getData('freq2')  as number
      const ph2:    number = spirit.getData('ph2')    as number

      // X: linear traversal (keeps wave consistent)
      spirit.x = startX + (endX - startX) * t

      // Y: base drift + two sine harmonics
      const yBase = startY + (endY - startY) * t
      spirit.y = yBase
        + Math.sin(t * freq1 * Math.PI * 2 + ph1) * amp1
        + Math.sin(t * freq2 * Math.PI * 2 + ph2) * amp2

      // Keep glow locked behind the spirit
      const glow = spirit.getData('glow') as Phaser.GameObjects.Image | null
      if (glow?.active) {
        glow.x     = spirit.x
        glow.y     = spirit.y
        glow.alpha = spirit.alpha * 0.5
        glow.scale = spirit.scale * 3.4
      }
    }
  }

  // ── Glow texture ─────────────────────────────────────────────────────────

  private buildGlowTexture() {
    const size = 128
    const cx   = size / 2
    const g    = this.add.graphics()
    // Concentric circles outer→inner; cubic ease keeps the edge very transparent
    // and only brightens close to the spirit, giving a natural halo rather than a blob.
    const steps = 56
    for (let i = 0; i < steps; i++) {
      const t      = i / (steps - 1)          // 0 = outer rim, 1 = centre
      const radius = cx * (1 - t * 0.72)      // 64 px → ~18 px
      const alpha  = t * t * t * 0.48         // cubic — stays nearly transparent until close in
      g.fillStyle(0xffffff, alpha)
      g.fillCircle(cx, cx, radius)
    }
    g.generateTexture('spirit-glow', size, size)
    g.destroy()
  }

  // ── HUD ──────────────────────────────────────────────────────────────────

  private buildHUD(width: number, height: number) {
    // Score — large number top-left
    this.scoreText = this.add.text(24, 20, '0', {
      fontFamily: numberFontFamily,
      fontSize: '38px',
      color: '#e8f4ff',
    }).setStroke('#0d0b1e', 6).setDepth(50)

    // Multiplier badge (hidden until ×2+)
    this.multiplierText = this.add.text(24, 64, '', {
      fontFamily: bodyFontFamily,
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#aeddd9',
    }).setStroke('#0d0b1e', 5).setDepth(50).setAlpha(0)

    // Combo streak — top center
    this.comboText = this.add.text(width / 2, 20, '', {
      fontFamily: bodyFontFamily,
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#aeddd9',
    }).setOrigin(0.5, 0).setStroke('#0d0b1e', 4).setDepth(50).setAlpha(0)

    // Timer — top right
    this.timerText = this.add.text(width - 24, 20, '01:00', {
      fontFamily: numberFontFamily,
      fontSize: '32px',
      color: '#e8f4ff',
    }).setOrigin(1, 0).setStroke('#0d0b1e', 6).setDepth(50)

    // Phase label — bottom center
    this.phaseLabelText = this.add.text(width / 2, height - 22, '❧ PHASE I', {
      fontFamily: bodyFontFamily,
      fontSize: '13px',
      color: 'rgba(174,221,217,0.60)',
      letterSpacing: 2,
    }).setOrigin(0.5, 1).setDepth(50)
  }

  private updateMultiplierHUD() {
    if (!this.multiplierText) return
    if (this.multiplier > 1) {
      this.multiplierText.setText(`×${this.multiplier}  combo`)
      this.multiplierText.setAlpha(1)
      const col = this.multiplier >= 4 ? '#ffe070' : this.multiplier === 3 ? '#c4b5fd' : '#aeddd9'
      this.multiplierText.setColor(col)
      this.tweens.add({
        targets: this.multiplierText, scale: { from: 1.25, to: 1 }, duration: 220, ease: 'Back.Out',
      })
    } else {
      this.tweens.add({ targets: this.multiplierText, alpha: 0, duration: 400 })
    }
  }

  private updateComboHUD() {
    if (!this.comboText) return
    if (this.comboCount >= 3) {
      this.comboText.setText(`${this.comboCount} STREAK`)
      this.comboText.setAlpha(1)
      const col = this.comboCount >= 16 ? '#ffe070' : this.comboCount >= 9 ? '#c4b5fd' : '#aeddd9'
      this.comboText.setColor(col)
    } else {
      this.tweens.add({ targets: this.comboText, alpha: 0, duration: 300 })
    }
  }

  // ── Audio setup ────────────────────────────────────────────────────────────

  private initAudio() {
    const win = window as unknown as { AudioContext?: unknown; webkitAudioContext?: unknown }
    const Ctor = win.AudioContext ?? win.webkitAudioContext
    if (typeof Ctor !== 'function') return
    try {
      this.audioCtx = new (Ctor as unknown as { new(): AudioContext })()
      this.masterGain = this.audioCtx.createGain()
      this.masterGain.gain.value = 0.18
      this.masterGain.connect(this.audioCtx.destination)
    } catch { /* ok */ }
  }

  private playPop(multi: number) {
    if (!this.audioCtx || !this.masterGain) return
    const now   = this.audioCtx.currentTime
    const pitch = 880 * (1 + (multi - 1) * 0.15)

    const osc1 = this.audioCtx.createOscillator()
    const osc2 = this.audioCtx.createOscillator()
    const gain = this.audioCtx.createGain()

    osc1.type = 'sine';     osc1.frequency.value = pitch
    osc2.type = 'triangle'; osc2.frequency.value = pitch * 1.5

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(1, now + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)

    osc1.connect(gain); osc2.connect(gain); gain.connect(this.masterGain)
    osc1.start(now); osc2.start(now + 0.005)
    osc1.stop(now + 0.18); osc2.stop(now + 0.18)
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  startRun() { this.startGame() }
  stopRun()  { this.endGame(true) }

  // ── Game loop ──────────────────────────────────────────────────────────────

  private startGame() {
    if (this.running) return

    this.running         = true
    this.targetScore     = 0
    this.displayedScore  = 0
    this.timeLeftMs      = 60_000
    this.comboCount      = 0
    this.multiplier      = 1
    this.finalRushStarted = false
    this.inSurge         = false
    this.currentPhase    = this.phases[0]
    this.currentSpawnMs  = this.phases[0].spawnMs
    this.currentMoveBase = this.phases[0].moveBase
    this.activeSpirits.clear()
    this.raresCaught    = 0
    this.fleetingCaught = 0
    this.cursedCaught   = 0
    this.maxComboStreak = 0
    this.timingBonuses  = 0
    this.bannerQueue    = []
    this.bannerBusy     = false

    this.scoreText?.setText('0')
    this.timerText?.setText('01:00').setColor('#e8f4ff').setScale(1)
    this.multiplierText?.setAlpha(0)
    this.comboText?.setAlpha(0)
    this.phaseLabelText?.setText(this.phases[0].label)

    this.spawnEvent?.remove(false)
    this.tickEvent?.remove(false)
    this.surgeEvent?.remove(false)

    const scheduleSpawn = () => {
      this.spawnEvent?.remove(false)
      const delay = Math.max(400, this.currentSpawnMs + (Math.random() * 2 - 1) * this.currentPhase.jitter)
      this.spawnEvent = this.time.addEvent({
        delay,
        callback: () => { this.spawnSpirit(); scheduleSpawn() },
      })
    }

    scheduleSpawn()

    // Wind Surge every 20s
    this.surgeEvent = this.time.addEvent({
      delay: 20_000,
      loop: true,
      callback: () => this.triggerWindSurge(),
    })

    this.tickEvent = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => this.tick(scheduleSpawn),
    })
  }

  private tick(reschedule: () => void) {
    this.timeLeftMs -= 100
    if (this.timeLeftMs <= 0) { this.endGame(); return }

    // Timer display
    this.timerText?.setText(this.formatTime(this.timeLeftMs))

    if (this.timeLeftMs <= 10_000) {
      this.timerText?.setColor('#ff9eb5')
      if (!this.finalRushStarted) {
        this.finalRushStarted = true
        this.cameras.main.flash(500, 180, 80, 160, false)
        this.showBanner('FINAL RUSH!', '#ff9eb5')
        this.tweens.add({
          targets: this.timerText,
          scale: { from: 1, to: 1.18 }, yoyo: true, repeat: -1, duration: 420,
        })
      }
    } else if (this.timeLeftMs <= 30_000) {
      this.timerText?.setColor('#f6c860')
    }

    // Phase transition
    const next = this.phases.find(p => this.timeLeftMs > p.until)
    if (next && next !== this.currentPhase) {
      this.currentPhase = next
      this.phaseLabelText?.setText(next.label)
      this.showBanner(next.name, '#c4b5fd')
      const fromSpawn = this.currentSpawnMs
      const fromMove  = this.currentMoveBase
      this.tweens.addCounter({
        from: 0, to: 1, duration: 2000,
        onUpdate: (t) => {
          const p = t.getValue() ?? 0
          this.currentSpawnMs  = Phaser.Math.Linear(fromSpawn, next.spawnMs,  p)
          this.currentMoveBase = Phaser.Math.Linear(fromMove,  next.moveBase, p)
        },
        onComplete: () => reschedule(),
      })

      // Combo bonus on phase transition (reward streakers)
      if (this.comboCount >= 5) {
        const bonus = this.comboCount * 2
        this.targetScore += bonus
        this.floatText(`+${bonus} PHASE BONUS!`, this.scale.width / 2, 100, '#c4b5fd')
      }
    }

    // Glow ramps with time pressure
    if (this.glowRect) {
      const elapsed = 60_000 - this.timeLeftMs
      const alpha = 0.03 + Phaser.Math.Clamp(elapsed / 60_000, 0, 1) * 0.18
      this.glowRect.setFillStyle(0x4a1a7a, alpha)
    }
  }

  private endGame(manual = false) {
    if (!this.running) return
    this.running = false
    this.spawnEvent?.remove(false)
    this.tickEvent?.remove(false)
    this.surgeEvent?.remove(false)
    this.comboDecayTimer?.remove(false)
    if (!manual) audioManager.play(SFX.gameover, 0.75)

    // Destroy remaining spirits and their glows
    for (const spirit of this.activeSpirits) {
      ;(spirit.getData('glow') as Phaser.GameObjects.Image | null)?.destroy()
      spirit.destroy()
    }
    this.activeSpirits.clear()

    if (!manual && this.onGameEnd) {
      const result: RunResult = {
        score:          this.targetScore,
        raresCaught:    this.raresCaught,
        fleetingCaught: this.fleetingCaught,
        cursedCaught:   this.cursedCaught,
        maxComboStreak: this.maxComboStreak,
        timingBonuses:  this.timingBonuses,
      }
      this.time.delayedCall(700, () => this.onGameEnd?.(result))
    }
  }

  // ── Spirit spawning ────────────────────────────────────────────────────────

  private pickSpirit(): SpiritSpec {
    const phase = this.currentPhase
    const roll  = Math.random()
    let cursor  = 0

    if ((cursor += phase.goldRate) > roll)
      return { key: 'spirit-rare', points: 5, scale: 0.55, kind: 'gold', speedMult: 1.0 }

    if ((cursor += phase.cursedRate) > roll)
      return { key: 'spirit-1', points: -3, scale: 0.50, kind: 'cursed', speedMult: 0.85 }

    if ((cursor += phase.silverRate) > roll)
      return { key: 'spirit-2', points: 3, scale: 0.56, kind: 'silver', speedMult: 1.0 }

    if ((cursor += phase.fleetingRate) > roll)
      return { key: 'spirit-3', points: 3, scale: 0.46, kind: 'fleeting', speedMult: 1.75 }

    const commons = [
      { key: 'spirit-1', points: 1, scale: 0.56, kind: 'common' as SpiritKind, speedMult: 1.0 },
      { key: 'spirit-2', points: 1, scale: 0.56, kind: 'common' as SpiritKind, speedMult: 1.0 },
      { key: 'spirit-3', points: 1, scale: 0.56, kind: 'common' as SpiritKind, speedMult: 1.0 },
    ]
    return commons[Math.floor(Math.random() * commons.length)]
  }

  private spawnSpirit() {
    const { width, height } = this.scale
    const spec = this.pickSpirit()

    // Spawn edge: 44% left, 44% right, 12% top
    const edgeRoll = Math.random()
    let startX: number, startY: number, endX: number, endY: number, flipX: boolean

    if (edgeRoll < 0.44) {
      startX = -64; endX = width + 80
      startY = 110 + Math.random() * (height - 200)
      endY   = 110 + Math.random() * (height - 200)
      flipX  = false
    } else if (edgeRoll < 0.88) {
      startX = width + 64; endX = -80
      startY = 110 + Math.random() * (height - 200)
      endY   = 110 + Math.random() * (height - 200)
      flipX  = true
    } else {
      // From top — drift diagonally
      startX = 120 + Math.random() * (width - 240)
      startY = -64
      endX   = startX + (Math.random() - 0.5) * width * 0.6
      endY   = height + 80
      flipX  = Math.random() < 0.5
    }

    // Wave personality: each spirit gets its own harmonics
    const amp1  = 22 + Math.random() * 68            // 22–90 px primary wave height
    const freq1 = 0.55 + Math.random() * 2.2         // 0.55–2.75 cycles across screen
    const ph1   = Math.random() * Math.PI * 2
    const amp2  = 6 + Math.random() * 22             // subtle secondary
    const freq2 = freq1 * (1.8 + Math.random() * 1.4) // faster harmonic
    const ph2   = Math.random() * Math.PI * 2

    const duration = Math.max(2200,
      (this.currentMoveBase + Math.random() * 2400) / spec.speedMult,
    )

    const spirit = this.add
      .image(startX, startY, spec.key)
      .setScale(spec.scale)
      .setAlpha(0)
      .setFlipX(flipX)
      .setDepth(10)

    // Wave data
    spirit.setData('isSprite', true)
    spirit.setData('kind',     spec.kind)
    spirit.setData('points',   spec.points)
    spirit.setData('isCursed', spec.kind === 'cursed')
    spirit.setData('isGold',   spec.kind === 'gold')
    spirit.setData('startX',   startX)
    spirit.setData('endX',     endX)
    spirit.setData('startY',   startY)
    spirit.setData('endY',     endY)
    spirit.setData('amp1',     amp1)
    spirit.setData('freq1',    freq1)
    spirit.setData('ph1',      ph1)
    spirit.setData('amp2',     amp2)
    spirit.setData('freq2',    freq2)
    spirit.setData('ph2',      ph2)
    spirit.setData('duration', duration)
    spirit.setData('elapsed',  0)
    spirit.setData('spawnTime', this.time.now)

    spirit.setInteractive({ useHandCursor: true })
    this.activeSpirits.add(spirit)

    // Soft radial glow image placed behind the spirit (no tint on the spirit itself)
    const kindColor = GLOW_COLORS[spec.kind]
    const glow = this.add.image(startX, startY, 'spirit-glow')
      .setScale(spec.scale * 3.4)
      .setAlpha(0)
      .setDepth(9)
      .setTint(kindColor)
    spirit.setData('glow',      glow)
    spirit.setData('kindColor', kindColor)

    // Animation by kind (alpha / scale only — no tint)
    switch (spec.kind) {
      case 'cursed':
        this.tweens.add({
          targets: spirit, alpha: { from: 0.2, to: 0.85 },
          duration: 300, yoyo: true, repeat: -1, ease: 'Sine.InOut',
        })
        break

      case 'gold':
        this.tweens.add({ targets: spirit, alpha: 1, duration: 180 })
        this.tweens.add({
          targets: spirit, scale: spec.scale * 1.14, yoyo: true, repeat: -1,
          duration: 1500, ease: 'Sine.InOut',
        })
        break

      case 'silver':
        this.tweens.add({ targets: spirit, alpha: 0.94, duration: 200 })
        this.tweens.add({
          targets: spirit, scale: spec.scale * 1.08, yoyo: true, repeat: -1,
          duration: 1900, ease: 'Sine.InOut',
        })
        break

      case 'fleeting':
        this.tweens.add({ targets: spirit, alpha: 0.88, duration: 110 })
        this.tweens.add({
          targets: spirit, scale: spec.scale * 1.10, yoyo: true, repeat: -1,
          duration: 900, ease: 'Sine.InOut',
        })
        break

      default:
        this.tweens.add({ targets: spirit, alpha: 0.92, duration: 220 })
        this.tweens.add({
          targets: spirit, scale: spec.scale * 1.07, yoyo: true, repeat: -1,
          duration: 2300 + Math.random() * 600, ease: 'Sine.InOut',
        })
    }

    // If a surge is already running when this spirit spawns, tint its glow gold
    if (this.inSurge && spec.kind !== 'cursed') glow.setTint(0xffd700)

    spirit.on('pointerdown', () => this.handleClick(spirit))
  }

  // ── Click handling ────────────────────────────────────────────────────────

  private handleClick(spirit: Phaser.GameObjects.Image) {
    if (!this.running) return

    const kind    = spirit.getData('kind')    as SpiritKind
    const pts     = spirit.getData('points')  as number
    const elapsed = spirit.getData('elapsed') as number
    const duration = spirit.getData('duration') as number

    this.activeSpirits.delete(spirit)
    this.tweens.killTweensOf(spirit)

    if (kind === 'cursed') {
      this.cursedCaught++
      this.breakCombo()
      this.targetScore = Math.max(0, this.targetScore - 3)
      this.floatText('CURSED! −3', spirit.x, spirit.y, '#b07aff')
      this.cameras.main.shake(180, 0.007)
      audioManager.play(SFX.curse, 0.75)
      ;(spirit.getData('glow') as Phaser.GameObjects.Image | null)?.destroy()
      this.tweens.add({
        targets: spirit, scale: 0, alpha: 0, duration: 240, ease: 'Back.In',
        onComplete: () => spirit.destroy(),
      })
      return
    }

    // Advance combo
    this.comboCount++
    const step = this.COMBO_STEPS.findIndex(t => this.comboCount < t)
    this.multiplier = step === -1 ? 4 : step + 1   // step 0→1x, 1→2x, 2→3x, 3→4x

    // Per-run stat tracking
    if (kind === 'gold')     this.raresCaught++
    if (kind === 'fleeting') this.fleetingCaught++
    if (this.comboCount > this.maxComboStreak) this.maxComboStreak = this.comboCount

    // Timing bonus: catch in first 28% of journey = +1 (rewards quick reflexes)
    const timingBonus = elapsed / duration < 0.28 ? 1 : 0
    if (timingBonus) this.timingBonuses++

    const surgeBonus = this.inSurge ? 2 : 1
    const earned = pts * this.multiplier * surgeBonus + timingBonus
    this.targetScore += earned

    this.playPop(this.multiplier)
    audioManager.play(kind === 'gold' ? SFX.gold : SFX.pop, 0.6)
    this.resetComboDecay()
    this.updateMultiplierHUD()
    this.updateComboHUD()

    // Floating label
    const parts: string[] = [`+${earned}`]
    if (timingBonus) parts.push('QUICK!')
    if (this.multiplier > 1) parts.push(`${this.multiplier}×`)
    if (this.inSurge) parts.push('SURGE')
    const col = this.inSurge ? '#ffe070' : timingBonus ? '#90ee90' : this.multiplier >= 3 ? '#c4b5fd' : '#d4eaf5'
    this.floatText(parts.join(' '), spirit.x, spirit.y, col)

    // Combo milestone banners
    if (this.comboCount === 4)  this.showBanner('×2 MULTIPLIER', '#aeddd9')
    if (this.comboCount === 9)  this.showBanner('×3 MULTIPLIER', '#c4b5fd')
    if (this.comboCount === 16) this.showBanner('MAX POWER ×4',  '#ffe070')

    if (this.comboCount > 4 && this.comboCount % 7 === 0) {
      this.cameras.main.shake(120, 0.003)
      audioManager.play(SFX.combo, 0.65)
    }

    // Score text pop
    this.tweens.add({ targets: this.scoreText, scale: 1.18, yoyo: true, duration: 180, ease: 'Cubic.Out' })

    // Capture burst
    ;(spirit.getData('glow') as Phaser.GameObjects.Image | null)?.destroy()
    this.tweens.add({
      targets: spirit, scale: spirit.scale * 1.6, alpha: 0, duration: 220, ease: 'Back.Out',
      onComplete: () => spirit.destroy(),
    })
  }

  // ── Wind Surge ────────────────────────────────────────────────────────────

  private triggerWindSurge() {
    if (!this.running) return
    this.inSurge = true
    audioManager.play(SFX.surge, 0.8)
    this.cameras.main.flash(400, 160, 220, 255, false)
    this.showBanner('✦ WIND SURGE ✦', '#7dd3fc')

    for (const spirit of this.activeSpirits) {
      if (!spirit.getData('isCursed')) {
        ;(spirit.getData('glow') as Phaser.GameObjects.Image | null)?.setTint(0xffd700)
      }
    }

    this.time.delayedCall(3500, () => {
      this.inSurge = false
      for (const spirit of this.activeSpirits) {
        const gl = spirit.getData('glow')      as Phaser.GameObjects.Image | null
        const kc = spirit.getData('kindColor') as number | undefined
        if (gl && kc !== undefined) gl.setTint(kc)
      }
    })
  }

  // ── Combo management ───────────────────────────────────────────────────────

  private breakCombo() {
    this.comboCount = 0
    this.multiplier = 1
    this.comboDecayTimer?.remove(false)
    this.comboDecayTimer = undefined
    this.updateMultiplierHUD()
    this.updateComboHUD()
  }

  private resetComboDecay() {
    this.comboDecayTimer?.remove(false)
    this.comboDecayTimer = this.time.delayedCall(3000, () => this.breakCombo())
  }

  // ── Feedback helpers ──────────────────────────────────────────────────────

  private floatText(text: string, x: number, y: number, color = '#e8f4ff') {
    const t = this.add.text(x, y, text, {
      fontFamily: bodyFontFamily,
      fontSize: '24px',
      fontStyle: 'bold',
      color,
      stroke: '#0d0b1e',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200)

    this.tweens.add({
      targets: t, y: y - 80, alpha: 0, duration: 720, ease: 'Cubic.Out',
      onComplete: () => t.destroy(),
    })
  }

  private showBanner(text: string, color = '#ffffff') {
    this.bannerQueue.push({ text, color })
    if (!this.bannerBusy) this.flushBanner()
  }

  private flushBanner() {
    if (this.bannerQueue.length === 0) { this.bannerBusy = false; return }
    this.bannerBusy = true
    const { text, color } = this.bannerQueue.shift()!

    const { width, height } = this.scale
    const banner = this.add.text(width / 2, height * 0.14, text, {
      fontFamily: bodyFontFamily,
      fontSize: '36px',
      fontStyle: 'bold',
      color,
      stroke: '#0a0f1e',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(180).setAlpha(0).setScale(0.7)

    this.tweens.add({
      targets: banner, alpha: 1, scale: 1, duration: 340, ease: 'Back.Out',
      onComplete: () => {
        this.time.delayedCall(900, () => {
          this.tweens.add({
            targets: banner, alpha: 0, y: banner.y - 28, duration: 400,
            onComplete: () => { banner.destroy(); this.flushBanner() },
          })
        })
      },
    })
  }

  // ── Util ──────────────────────────────────────────────────────────────────

  private formatTime(ms: number) {
    const sec = Math.ceil(ms / 1000)
    const m   = Math.floor(sec / 60)
    const s   = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
}

// ── Factory ────────────────────────────────────────────────────────────────────

export function createGame(parent: HTMLDivElement, options?: GameOptions): GameAPI {
  const scene = new CatchWindSpritesScene(options)

  const game = new Phaser.Game({
    type:   Phaser.AUTO,
    parent,
    scale: {
      width:      1280,
      height:     720,
      mode:       Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    backgroundColor: '#0b1020',
    scene: [scene],
  })

  const ready = new Promise<void>((resolve) => {
    const attach = () => {
      try {
        if (scene.sys?.events && typeof scene.sys.events.once === 'function') {
          scene.sys.events.once('create', resolve)
          return
        }
      } catch { /* retry */ }
      setTimeout(attach, 16)
    }
    attach()
  })

  return {
    start:   () => ready.then(() => scene.startRun()).catch(console.error),
    stop:    () => scene.stopRun(),
    destroy: () => game.destroy(true),
  }
}
