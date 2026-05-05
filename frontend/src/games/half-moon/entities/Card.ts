import Phaser from 'phaser'
import type { Phase } from '../data/halfMoonConfig'
import { PHASE_NAMES } from '../data/halfMoonConfig'

export const CARD_W  = 72
export const CARD_H  = 100
export const CARD_R  = 10   // border radius

// Navy / gold palette
export const CARD_BG_PLAYER = 0x0A1628
export const CARD_BG_AI     = 0x1A0A28
export const CARD_BG_EMPTY  = 0x111C30
export const CARD_BORDER     = 0xC8A84B
export const CARD_BORDER_GLOW = 0xFFDD77

// Phase → hex color for the moon icon
const PHASE_COLORS: Record<Phase, number> = {
  1: 0x334455,  // New Moon      — dark
  2: 0x8899BB,  // Waxing Cres   — slate blue
  3: 0xBBCCDD,  // First Quarter — light blue
  4: 0xDDEEFF,  // Waxing Gibb   — pale white-blue
  5: 0xFFF8C0,  // Full Moon     — bright gold
  6: 0xDDE8C0,  // Waning Gibb   — sage
  7: 0xBBBBAA,  // Last Quarter  — gray
  8: 0x778899,  // Waning Cres   — blue-gray
}

export class Card {
  public phase: Phase
  public spaceId: number
  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private bg: Phaser.GameObjects.Graphics
  private moonGfx: Phaser.GameObjects.Graphics
  private labelText: Phaser.GameObjects.Text
  private numText: Phaser.GameObjects.Text
  private isHighlighted = false
  private isSelected    = false

  constructor(scene: Phaser.Scene, phase: Phase, spaceId: number, x: number, y: number) {
    this.scene   = scene
    this.phase   = phase
    this.spaceId = spaceId

    this.bg      = scene.add.graphics()
    this.moonGfx = scene.add.graphics()

    this.numText = scene.add.text(0, -CARD_H / 2 + 10, `${phase}`, {
      fontSize: '11px', color: '#C8A84B', fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 0)

    this.labelText = scene.add.text(0, CARD_H / 2 - 22, PHASE_NAMES[phase], {
      fontSize: '7px', color: '#AABBCC', fontFamily: 'Georgia, serif',
      wordWrap: { width: CARD_W - 10 }, align: 'center',
    }).setOrigin(0.5, 0)

    this.container = scene.add.container(x, y, [this.bg, this.moonGfx, this.numText, this.labelText])
    this.container.setSize(CARD_W, CARD_H)

    this.drawCard(CARD_BG_EMPTY, false)
  }

  private drawCard(bgColor: number, glowing: boolean) {
    this.bg.clear()
    // Card background
    this.bg.fillStyle(bgColor, 1)
    this.bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R)
    // Border
    const borderColor = glowing ? CARD_BORDER_GLOW : CARD_BORDER
    const borderAlpha  = glowing ? 1.0 : 0.65
    this.bg.lineStyle(glowing ? 2 : 1.5, borderColor, borderAlpha)
    this.bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R)
    // Corner ornaments
    this.bg.fillStyle(borderColor, glowing ? 0.8 : 0.4)
    const co = 8
    this.bg.fillCircle(-CARD_W / 2 + co, -CARD_H / 2 + co, 2)
    this.bg.fillCircle( CARD_W / 2 - co, -CARD_H / 2 + co, 2)
    this.bg.fillCircle(-CARD_W / 2 + co,  CARD_H / 2 - co, 2)
    this.bg.fillCircle( CARD_W / 2 - co,  CARD_H / 2 - co, 2)

    this.drawMoon()
  }

  private drawMoon() {
    this.moonGfx.clear()
    const cx = 0, cy = -4
    const r  = 22
    const col = PHASE_COLORS[this.phase]

    // Draw moon phase using canvas texture compositing
    const texKey = `moon-phase-${this.phase}`
    if (!this.scene.textures.exists(texKey)) {
      const size = 64
      const canvas = this.scene.textures.createCanvas(texKey, size, size)!
      const ctx = canvas.getContext() as CanvasRenderingContext2D
      const cr  = size / 2

      ctx.clearRect(0, 0, size, size)
      ctx.fillStyle = `#${col.toString(16).padStart(6, '0')}`
      ctx.beginPath()
      ctx.arc(cr, cr, cr - 4, 0, Math.PI * 2)
      ctx.fill()

      if (this.phase !== 5) {
        // Cut away appropriate portion based on phase
        const cutOffset = this.getCutOffset()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.beginPath()
        ctx.arc(cr + cutOffset, cr, cr - 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalCompositeOperation = 'source-over'
      }

      canvas.refresh()
    }

    // Place the texture on top of the glow
    // Use scene.add.image inside the container is tricky; use Graphics arc instead
    // Approximate using filled arcs
    const col32 = col
    this.moonGfx.fillStyle(col32, 0.15)
    this.moonGfx.fillCircle(cx, cy, r + 6)  // glow halo

    this.moonGfx.fillStyle(col32, 1)
    this.moonGfx.fillCircle(cx, cy, r)

    // Dark cut for phase shape
    if (this.phase !== 5) {
      const cutX = cx + this.getCutOffsetPx(r)
      this.moonGfx.fillStyle(0x0A1628, 1)
      this.moonGfx.fillCircle(cutX, cy, r)
    }
  }

  private getCutOffset(): number {
    // Returns fraction of radius for canvas texture (–1.5 to 1.5)
    const cuts: Record<Phase, number> = {
      1: 0,      // new: full cut → black disk (phase 1 stays fully dark)
      2: 1.3,    // waxing crescent: right side cut
      3: 0.15,   // first quarter: slight cut
      4: -0.9,   // waxing gibbous: left cut
      5: 0,      // full: no cut
      6: 0.9,    // waning gibbous: right cut
      7: -0.15,  // last quarter: slight right cut
      8: -1.3,   // waning crescent: left side cut
    }
    return cuts[this.phase]
  }

  private getCutOffsetPx(r: number): number {
    const cuts: Record<Phase, number> = {
      1: 0, 2: r * 0.9, 3: r * 0.1, 4: -r * 0.7,
      5: 0, 6: r * 0.7, 7: -r * 0.1, 8: -r * 0.9,
    }
    return cuts[this.phase]
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setOwner(owner: 'player' | 'ai' | null) {
    const bg = owner === 'player' ? CARD_BG_PLAYER : owner === 'ai' ? CARD_BG_AI : CARD_BG_EMPTY
    this.drawCard(bg, this.isHighlighted)
  }

  setHighlight(on: boolean) {
    this.isHighlighted = on
    const bg = this.isSelected ? CARD_BG_PLAYER : CARD_BG_EMPTY
    this.drawCard(bg, on)
    if (on) {
      this.scene.tweens.add({
        targets: this.container, y: this.container.y - 6,
        duration: 180, ease: 'Back.Out',
      })
    }
  }

  setSelected(on: boolean) {
    this.isSelected = on
    this.drawCard(on ? 0x1C2E50 : CARD_BG_EMPTY, on)
    this.container.setScale(on ? 1.1 : 1)
  }

  pulseDelivery(owner: 'player' | 'ai') {
    const tintColor = owner === 'player' ? 0x88AAFF : 0xFF88BB
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.25, scaleY: 1.25,
      duration: 180, yoyo: true,
      ease: 'Back.Out',
    })
    // Flash the glow
    const flash = this.scene.add.graphics()
    flash.fillStyle(tintColor, 0.4)
    flash.fillRoundedRect(
      this.container.x - CARD_W / 2 - 4,
      this.container.y - CARD_H / 2 - 4,
      CARD_W + 8, CARD_H + 8, CARD_R + 2,
    )
    flash.setDepth(this.container.depth + 1)
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration: 500,
      onComplete: () => flash.destroy(),
    })
  }

  setPosition(x: number, y: number) { this.container.setPosition(x, y) }
  setDepth(d: number)  { this.container.setDepth(d) }
  setAlpha(a: number)  { this.container.setAlpha(a) }
  setScale(s: number)  { this.container.setScale(s) }
  setInteractive(cb: () => void) {
    this.container.setInteractive()
    this.container.on('pointerdown', cb)
    this.container.on('pointerover',  () => this.setHighlight(true))
    this.container.on('pointerout',   () => this.setHighlight(false))
  }

  // Drag-and-drop: no hover lift; optional isDragging guard prevents scale glitch
  setDragInteractive(onDragStart: () => void, isDraggingFn?: () => boolean) {
    this.container.setInteractive()
    this.container.on('pointerdown', onDragStart)
    this.container.on('pointerover', () => { if (!isDraggingFn?.()) this.container.setScale(1.06) })
    this.container.on('pointerout',  () => { if (!isDraggingFn?.()) this.container.setScale(1) })
  }

  // Tween-friendly property accessors
  get x()  { return this.container.x }
  set x(v: number) { this.container.x = v }
  get y()  { return this.container.y }
  set y(v: number) { this.container.y = v }
  get alpha()  { return this.container.alpha }
  set alpha(v: number) { this.container.alpha = v }
  get scaleX() { return this.container.scaleX }
  set scaleX(v: number) { this.container.scaleX = v }
  get scaleY() { return this.container.scaleY }
  set scaleY(v: number) { this.container.scaleY = v }

  destroy() { this.container.destroy() }
}
