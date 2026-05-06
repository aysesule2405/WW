import Phaser from 'phaser'
import type { Phase, Owner } from '../data/halfMoonConfig'
import {
  SELECTED_BG,
  cardBgForOwner, borderForOwner, pulseColorForOwner,
  PLAYER_SHINE, AI_SHADOW,
} from '../visuals/glowEffects'
import { cardFaceKey, cardFaceLoaded } from '../assets'

export const CARD_W = 80
export const CARD_H = 80
export const CARD_R = 10

// Phase → procedural moon color (fallback when no image asset is loaded)
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
  public phase:   Phase
  public spaceId: number

  private scene:     Phaser.Scene
  private container: Phaser.GameObjects.Container
  private bg:        Phaser.GameObjects.Graphics
  private moonGfx:   Phaser.GameObjects.Graphics
  private faceImage: Phaser.GameObjects.Image | null = null
  private glowRing:  Phaser.GameObjects.Graphics

  private owner:         Owner = null
  private isHighlighted  = false
  private isSelected     = false
  private pulseTween:    Phaser.Tweens.Tween | null = null

  constructor(scene: Phaser.Scene, phase: Phase, spaceId: number, x: number, y: number) {
    this.scene   = scene
    this.phase   = phase
    this.spaceId = spaceId

    this.bg       = scene.add.graphics()
    this.glowRing = scene.add.graphics()
    this.moonGfx  = scene.add.graphics()

    // Try to use the PNG asset; fall back to procedural if not loaded
    if (cardFaceLoaded(scene, phase)) {
      this.faceImage = scene.add.image(0, 0, cardFaceKey(phase))
        .setDisplaySize(CARD_W - 8, CARD_H - 8)
    }

    const children: Phaser.GameObjects.GameObject[] = [this.bg, this.glowRing, this.moonGfx]
    if (this.faceImage) children.push(this.faceImage)

    this.container = scene.add.container(x, y, children)
    this.container.setSize(CARD_W, CARD_H)

    this.drawCard()
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private drawCard() {
    const glowing   = this.isHighlighted || this.isSelected
    const bgColor   = this.isSelected ? SELECTED_BG : cardBgForOwner(this.owner)
    const border    = borderForOwner(this.owner, glowing)
    const borderAlpha = glowing ? 1.0 : 0.65
    const lineW     = glowing ? 2 : 1.5

    this.bg.clear()
    this.bg.fillStyle(bgColor, 1)
    this.bg.fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R)
    this.bg.lineStyle(lineW, border, borderAlpha)
    this.bg.strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, CARD_R)

    // Ownership glow ring: white multi-layer bloom for player, black shadow rings for AI
    this.glowRing.clear()
    if (this.owner === 'player') {
      const hw = CARD_W / 2, hh = CARD_H / 2, r = CARD_R
      this.glowRing.lineStyle(9, PLAYER_SHINE, glowing ? 0.20 : 0.10)
      this.glowRing.strokeRoundedRect(-hw - 8, -hh - 8, CARD_W + 16, CARD_H + 16, r + 8)
      this.glowRing.lineStyle(5, PLAYER_SHINE, glowing ? 0.48 : 0.26)
      this.glowRing.strokeRoundedRect(-hw - 4, -hh - 4, CARD_W + 8, CARD_H + 8, r + 4)
      this.glowRing.lineStyle(2, PLAYER_SHINE, glowing ? 0.92 : 0.60)
      this.glowRing.strokeRoundedRect(-hw - 2, -hh - 2, CARD_W + 4, CARD_H + 4, r + 2)
    } else if (this.owner === 'ai') {
      const hw = CARD_W / 2, hh = CARD_H / 2, r = CARD_R
      this.glowRing.lineStyle(10, AI_SHADOW, glowing ? 0.72 : 0.50)
      this.glowRing.strokeRoundedRect(-hw - 8, -hh - 8, CARD_W + 16, CARD_H + 16, r + 8)
      this.glowRing.lineStyle(6, AI_SHADOW, glowing ? 0.90 : 0.70)
      this.glowRing.strokeRoundedRect(-hw - 4, -hh - 4, CARD_W + 8, CARD_H + 8, r + 4)
      this.glowRing.lineStyle(3, AI_SHADOW, glowing ? 1.0 : 0.88)
      this.glowRing.strokeRoundedRect(-hw - 2, -hh - 2, CARD_W + 4, CARD_H + 4, r + 2)
    }

    if (!this.faceImage) {
      this.drawMoon()
    } else {
      this.moonGfx.clear()
    }
  }

  private drawMoon() {
    this.moonGfx.clear()
    const cx = 0, cy = 0, r = 24
    const col = PHASE_COLORS[this.phase]

    this.moonGfx.fillStyle(col, 0.15)
    this.moonGfx.fillCircle(cx, cy, r + 6)   // halo

    this.moonGfx.fillStyle(col, 1)
    this.moonGfx.fillCircle(cx, cy, r)

    if (this.phase !== 5) {
      const cutX = cx + this.getCutOffsetPx(r)
      this.moonGfx.fillStyle(cardBgForOwner(this.owner), 1)
      this.moonGfx.fillCircle(cutX, cy, r)
    }
  }

  private getCutOffsetPx(r: number): number {
    const cuts: Record<Phase, number> = {
      1: 0, 2: r * 0.9, 3: r * 0.1, 4: -r * 0.7,
      5: 0, 6: r * 0.7, 7: -r * 0.1, 8: -r * 0.9,
    }
    return cuts[this.phase]
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setOwner(newOwner: Owner) {
    this.owner = newOwner
    this.drawCard()
    this.updateOwnerPulse()
  }

  private updateOwnerPulse() {
    if (this.pulseTween) {
      this.pulseTween.stop()
      this.pulseTween = null
    }
    if (this.owner === 'player') {
      this.pulseTween = this.scene.tweens.add({
        targets: this.glowRing,
        alpha: { from: 0.55, to: 1.0 },
        duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut',
      })
    } else if (this.owner === 'ai') {
      this.pulseTween = this.scene.tweens.add({
        targets: this.glowRing,
        alpha: { from: 0.35, to: 0.85 },
        duration: 900, yoyo: true, repeat: -1, ease: 'Quad.InOut',
      })
    }
  }

  setHighlight(on: boolean) {
    this.isHighlighted = on
    this.drawCard()
    if (on) {
      this.scene.tweens.add({
        targets: this.container, y: this.container.y - 6,
        duration: 180, ease: 'Back.Out',
      })
    }
  }

  setSelected(on: boolean) {
    this.isSelected = on
    this.drawCard()
    this.container.setScale(on ? 1.1 : 1)
  }

  pulseDelivery(owner: 'player' | 'ai') {
    const tintColor = pulseColorForOwner(owner)
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.25, scaleY: 1.25,
      duration: 180, yoyo: true, ease: 'Back.Out',
    })
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

  destroy() {
    if (this.pulseTween) this.pulseTween.stop()
    this.container.destroy()
  }
}
