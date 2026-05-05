import Phaser from 'phaser'
import {
  TILE, COLS, ROWS, MAP_DATA,
  DELIVERY_TYPES, CORRECT_MESSAGES, WRONG_MESSAGES,
  HOUSE_POSITIONS, PACKAGE_POSITIONS, PLAYER_START,
  GAME_DURATION_MS,
} from './data/deliveryConfig'
import type { HUDState, InspectData } from './data/deliveryConfig'
import { Player } from './entities/Player'
import { Package } from './entities/Package'
import { House } from './entities/House'

export type SceneCallbacks = {
  onGameEnd: (result: 'win' | 'lose', deliveries: number, timeRemaining: number) => void
  onHUDUpdate: (state: HUDState) => void
  onInspectPackage: (data: InspectData) => void
  onInspectHouse: (data: InspectData) => void
}

const W = COLS * TILE  // 816
const HUD_H = 38

export class DeliveryGameScene extends Phaser.Scene {
  private cb!: SceneCallbacks

  private player!: Player
  private packages: Package[] = []
  private houses: House[] = []

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private moveRepeatTimer = 0
  private readonly MOVE_REPEAT = 155

  private timeLeftMs = GAME_DURATION_MS
  private deliveredCount = 0
  private running = false
  private timerPaused = false

  private nearHouseIdx = -1

  private timerText!: Phaser.GameObjects.Text
  private deliveryText!: Phaser.GameObjects.Text
  private holdText!: Phaser.GameObjects.Text
  private holdSwatch!: Phaser.GameObjects.Graphics
  private timerBar!: Phaser.GameObjects.Graphics

  private correctMsgIdx = 0
  private wrongMsgIdx = 0

  constructor() {
    super({ key: 'DeliveryGameScene' })
  }

  init(data: SceneCallbacks) {
    this.cb = data
    this.timeLeftMs = GAME_DURATION_MS
    this.deliveredCount = 0
    this.running = false
    this.timerPaused = false
    this.nearHouseIdx = -1
    this.packages = []
    this.houses = []
    this.correctMsgIdx = 0
    this.wrongMsgIdx = 0
  }

  preload() {
    this.load.image('game-bg', '/assets/backgrounds/delivery-on-the-wind/game-bg.png')
    this.load.image('kiki', '/assets/backgrounds/delivery-on-the-wind/kiki.png')
    for (let i = 1; i <= 4; i++) {
      this.load.image(`house-${i}`, `/assets/backgrounds/delivery-on-the-wind/house-${i}.png`)
      this.load.image(`package-${i}`, `/assets/backgrounds/delivery-on-the-wind/package-${i}.png`)
    }
  }

  create() {
    // Pixel texture for particles
    const pg = this.add.graphics().setVisible(false)
    pg.fillStyle(0xffffff)
    pg.fillRect(0, 0, 4, 4)
    pg.generateTexture('pixel', 4, 4)
    pg.destroy()

    this.drawBackground()
    this.createAtmosphere()
    this.spawnEntities()
    this.buildHUD()
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.running = true
    this.emitHUDUpdate()
  }

  // ── Inspection API (called from React via createDeliveryGame) ─────────────────

  inspectHeldPackage() {
    if (!this.player.heldType) return
    const cfg = DELIVERY_TYPES.find(d => d.type === this.player.heldType)
    if (!cfg) return
    this.timerPaused = true
    this.cb.onInspectPackage({
      kind: 'package',
      type: cfg.type,
      imageIndex: cfg.imageIndex,
      label: cfg.label,
      colorHex: cfg.colorHex,
      hint: cfg.hint,
    })
  }

  inspectNearHouse() {
    if (this.nearHouseIdx < 0) return
    const house = this.houses[this.nearHouseIdx]
    const cfg = DELIVERY_TYPES.find(d => d.type === house.type)
    if (!cfg) return
    this.timerPaused = true
    this.cb.onInspectHouse({
      kind: 'house',
      type: cfg.type,
      imageIndex: cfg.imageIndex,
      label: cfg.label,
      colorHex: cfg.colorHex,
      hint: cfg.hint,
    })
  }

  resumeFromInspection() {
    this.timerPaused = false
  }

  // ── Background ───────────────────────────────────────────────────────────────

  private drawBackground() {
    const canvasH = ROWS * TILE
    this.add.image(W / 2, canvasH / 2, 'game-bg')
      .setDisplaySize(W, canvasH)
      .setDepth(0)
  }

  // ── Atmosphere ───────────────────────────────────────────────────────────────

  private createAtmosphere() {
    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: W },
      y: { min: 0, max: ROWS * TILE },
      speedX: { min: 18, max: 55 },
      speedY: { min: -6, max: 6 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.3, end: 0 },
      lifespan: { min: 2200, max: 3800 },
      frequency: 240,
      tint: [0xDDE5B6, 0xFFFFDD, 0xAACC88, 0xFFFFAA],
    }).setDepth(8)
  }

  // ── Entities ─────────────────────────────────────────────────────────────────

  private spawnEntities() {
    const shuffled = [...DELIVERY_TYPES].sort(() => Math.random() - 0.5)

    for (let i = 0; i < 4; i++) {
      const cfg = shuffled[i]
      const pos = HOUSE_POSITIONS[i]
      this.houses.push(new House(
        this, cfg.type, cfg.colorNum, cfg.colorHex, cfg.imageIndex, pos.col, pos.row,
      ))
    }

    const pkgOrder = [...shuffled].sort(() => Math.random() - 0.5)
    for (let i = 0; i < 4; i++) {
      const cfg = pkgOrder[i]
      const pos = PACKAGE_POSITIONS[i]
      this.packages.push(new Package(
        this, cfg.type, cfg.colorNum, cfg.imageIndex, pos.col, pos.row,
      ))
    }

    this.player = new Player(this, PLAYER_START.col, PLAYER_START.row)
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────

  private buildHUD() {
    const panelG = this.add.graphics().setDepth(9)
    panelG.fillStyle(0x0D1A06, 0.88)
    panelG.fillRect(0, 0, W, HUD_H)
    panelG.lineStyle(1, 0x4A7C20, 0.5)
    panelG.strokeRect(0, 0, W, HUD_H)

    this.timerBar = this.add.graphics().setDepth(9)

    this.timerText = this.add.text(W / 2, HUD_H / 2, '2:00', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#F0EAD2',
      fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 0.5).setDepth(10)

    this.deliveryText = this.add.text(14, HUD_H / 2, '0 / 4  delivered', {
      fontSize: '14px',
      color: '#ADC178',
      fontFamily: 'Georgia, serif',
    }).setOrigin(0, 0.5).setDepth(10)

    this.holdSwatch = this.add.graphics().setDepth(10)

    this.holdText = this.add.text(W - 14, HUD_H / 2, 'Empty-handed', {
      fontSize: '13px',
      color: '#C8B89A',
      fontFamily: 'Georgia, serif',
    }).setOrigin(1, 0.5).setDepth(10)
  }

  private updateHoldHUD(colorNum: number | null, colorHex: string, label: string) {
    this.holdSwatch.clear()
    if (colorNum !== null) {
      const rx = W - 14 - this.holdText.width - 20
      this.holdSwatch.fillStyle(colorNum)
      this.holdSwatch.fillRoundedRect(rx, HUD_H / 2 - 7, 14, 14, 3)
      this.holdText.setText(label).setColor(colorHex)
    } else {
      this.holdText.setText('Empty-handed').setColor('#C8B89A')
    }
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.running) return
    if (!this.timerPaused) {
      this.timeLeftMs -= delta
    }
    if (this.timeLeftMs <= 0) {
      this.timeLeftMs = 0
      this.endGame('lose')
      return
    }

    this.refreshTimer()
    if (!this.timerPaused) {
      this.handleMovement(delta)
    }
  }

  // ── Movement ─────────────────────────────────────────────────────────────────

  private handleMovement(delta: number) {
    if (this.player.isMoving) return

    this.moveRepeatTimer -= delta
    const c = this.cursors
    let dx = 0
    let dy = 0

    if      (Phaser.Input.Keyboard.JustDown(c.left))       { dx = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (Phaser.Input.Keyboard.JustDown(c.right))      { dx =  1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (Phaser.Input.Keyboard.JustDown(c.up))         { dy = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (Phaser.Input.Keyboard.JustDown(c.down))       { dy =  1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.left.isDown  && this.moveRepeatTimer <= 0)  { dx = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.right.isDown && this.moveRepeatTimer <= 0)  { dx =  1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.up.isDown    && this.moveRepeatTimer <= 0)  { dy = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.down.isDown  && this.moveRepeatTimer <= 0)  { dy =  1; this.moveRepeatTimer = this.MOVE_REPEAT }

    if (dx === 0 && dy === 0) return

    const moved = this.player.tryMove(dx, dy, () => {
      this.checkPickup()
      this.checkDelivery()
      this.updateNearHouse()
      this.emitHUDUpdate()
    })

    if (!moved) this.cameras.main.shake(50, 0.0015)
  }

  // ── Game logic ───────────────────────────────────────────────────────────────

  private checkPickup() {
    const pkg = this.packages.find(
      p => !p.isPickedUp && p.gridX === this.player.gridX && p.gridY === this.player.gridY,
    )
    if (!pkg) return

    if (this.player.heldType !== null) {
      this.floatText('Deliver this package first!', this.player.x, this.player.y - 30, '#FFD166')
      return
    }

    const cfg = DELIVERY_TYPES.find(d => d.type === pkg.type)!
    pkg.pickup()
    this.player.setHeld(pkg.type, pkg.imageIndex, cfg.colorNum)
    this.updateHoldHUD(cfg.colorNum, cfg.colorHex, cfg.label)
    this.floatText(`Picked up ${cfg.label}!`, this.player.x, this.player.y - 28, '#FFE566')
  }

  private checkDelivery() {
    if (this.player.heldType === null) return

    const house = this.houses.find(
      h => !h.isDelivered && h.gridX === this.player.gridX && h.gridY === this.player.gridY,
    )
    if (!house) return

    if (house.type === this.player.heldType) {
      house.markDelivered()
      this.deliveredCount++
      this.player.setHeld(null, null, 0)
      this.updateHoldHUD(null, '', '')
      this.deliveryText.setText(`${this.deliveredCount} / 4  delivered`)

      const msg = CORRECT_MESSAGES[this.correctMsgIdx % CORRECT_MESSAGES.length]
      this.correctMsgIdx++
      this.showBubble(msg, house.gridX, house.gridY, true)
      this.cameras.main.flash(300, 180, 220, 120)

      if (this.deliveredCount === 4) {
        this.time.delayedCall(800, () => this.endGame('win'))
      }
    } else {
      house.shake()
      const msg = WRONG_MESSAGES[this.wrongMsgIdx % WRONG_MESSAGES.length]
      this.wrongMsgIdx++
      this.showBubble(msg, house.gridX, house.gridY, false)
      this.cameras.main.shake(220, 0.007)
      this.timeLeftMs = Math.max(0, this.timeLeftMs - 5_000)
      this.floatText('-5 sec', this.player.x, this.player.y - 22, '#FF7766')
    }
  }

  // Detect nearest undelivered house within 1 tile (Chebyshev)
  private updateNearHouse() {
    const idx = this.houses.findIndex(
      h =>
        !h.isDelivered &&
        Math.abs(h.gridX - this.player.gridX) <= 1 &&
        Math.abs(h.gridY - this.player.gridY) <= 1,
    )
    this.nearHouseIdx = idx
  }

  // ── HUD state emission ────────────────────────────────────────────────────────

  private emitHUDUpdate() {
    const heldCfg = this.player.heldType
      ? DELIVERY_TYPES.find(d => d.type === this.player.heldType) ?? null
      : null

    const nearHouse = this.nearHouseIdx >= 0 ? this.houses[this.nearHouseIdx] : null
    const nearCfg = nearHouse
      ? DELIVERY_TYPES.find(d => d.type === nearHouse.type) ?? null
      : null

    this.cb.onHUDUpdate({
      heldType:           heldCfg?.type ?? null,
      heldImageIndex:     heldCfg?.imageIndex ?? null,
      heldLabel:          heldCfg?.label ?? null,
      heldColorHex:       heldCfg?.colorHex ?? null,
      nearHouseType:      nearCfg?.type ?? null,
      nearHouseImageIndex: nearCfg?.imageIndex ?? null,
      nearHouseLabel:     nearCfg?.label ?? null,
    })
  }

  // ── Feedback ─────────────────────────────────────────────────────────────────

  private floatText(text: string, wx: number, wy: number, color: string) {
    const t = this.add.text(wx, wy, text, {
      fontSize: '14px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3,
      fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 0.5).setDepth(15)

    this.tweens.add({
      targets: t,
      y: wy - 46,
      alpha: 0,
      duration: 1200,
      ease: 'Quad.Out',
      onComplete: () => t.destroy(),
    })
  }

  private showBubble(text: string, gridX: number, gridY: number, success: boolean) {
    const bgColor     = success ? 0xD4EDBE : 0xFFDDCC
    const textColor   = success ? '#1A5C0A' : '#8B1A00'
    const borderColor = success ? 0x5A9E30 : 0xCC3300
    const bW = Math.max(170, text.length * 8 + 20)
    const bH = 38

    const g = this.add.graphics()
    g.fillStyle(bgColor, 0.97)
    g.fillRoundedRect(-bW / 2, -bH / 2, bW, bH, 10)
    g.lineStyle(2, borderColor, 0.9)
    g.strokeRoundedRect(-bW / 2, -bH / 2, bW, bH, 10)
    g.fillStyle(bgColor, 0.97)
    g.fillTriangle(-7, bH / 2, 7, bH / 2, 0, bH / 2 + 11)

    const t = this.add.text(0, 0, text, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: textColor,
      fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 0.5)

    const wx = Phaser.Math.Clamp(gridX * TILE + TILE / 2, bW / 2 + 6, COLS * TILE - bW / 2 - 6)
    const wy = Phaser.Math.Clamp(gridY * TILE - 18, bH / 2 + 48, ROWS * TILE - bH - 18)

    const bubble = this.add.container(wx, wy, [g, t])
    bubble.setDepth(12).setAlpha(0).setScale(0.7)

    this.tweens.add({ targets: bubble, alpha: 1, scaleX: 1, scaleY: 1, duration: 180, ease: 'Back.Out' })
    this.time.delayedCall(1900, () => {
      this.tweens.add({
        targets: bubble,
        alpha: 0,
        y: bubble.y - 16,
        duration: 380,
        ease: 'Quad.In',
        onComplete: () => bubble.destroy(),
      })
    })
  }

  // ── Timer ────────────────────────────────────────────────────────────────────

  private refreshTimer() {
    const sec = Math.ceil(this.timeLeftMs / 1000)
    const m = Math.floor(sec / 60)
    const s = sec % 60
    this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`)

    const ratio = this.timeLeftMs / GAME_DURATION_MS
    const barW = W * ratio

    this.timerBar.clear()
    const barColor = ratio > 0.5 ? 0x5ABA2E : ratio > 0.25 ? 0xE8C030 : 0xEE3322
    this.timerBar.fillStyle(barColor, 0.38)
    this.timerBar.fillRect(0, HUD_H - 4, barW, 4)

    if (this.timeLeftMs < 30_000) {
      this.timerText.setColor('#FF6B6B')
      const pulse = Math.floor(this.timeLeftMs / 500) % 2 === 0
      this.timerText.setScale(pulse ? 1.12 : 1.0)
    } else if (this.timeLeftMs < 60_000) {
      this.timerText.setColor('#FFD166').setScale(1.0)
    } else {
      this.timerText.setColor('#F0EAD2').setScale(1.0)
    }
  }

  // ── End game ─────────────────────────────────────────────────────────────────

  private endGame(result: 'win' | 'lose') {
    if (!this.running) return
    this.running = false

    const cx = W / 2
    const cy = (ROWS * TILE) / 2

    const overlay = this.add.graphics().setDepth(20)
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, W, ROWS * TILE)
    overlay.setAlpha(0)
    this.tweens.add({ targets: overlay, alpha: 1, duration: 500 })

    const title = this.add.text(
      cx, cy - 36,
      result === 'win' ? 'All Delivered!' : 'Time is up!',
      {
        fontSize: '36px',
        fontStyle: 'bold',
        color: result === 'win' ? '#FFE566' : '#FF9988',
        stroke: '#000000',
        strokeThickness: 5,
        fontFamily: 'Georgia, serif',
      },
    ).setOrigin(0.5, 0.5).setDepth(21).setAlpha(0)

    const sub = this.add.text(
      cx, cy + 16,
      result === 'win'
        ? `The grove thanks Kiki!  Time left: ${this.formatTime(this.timeLeftMs)}`
        : `${this.deliveredCount} of 4 packages delivered`,
      {
        fontSize: '18px',
        color: '#F0EAD2',
        stroke: '#000000',
        strokeThickness: 3,
        fontFamily: 'Georgia, serif',
      },
    ).setOrigin(0.5, 0.5).setDepth(21).setAlpha(0)

    this.tweens.add({ targets: title, alpha: 1, y: { from: cy - 10, to: cy - 36 }, duration: 680, ease: 'Back.Out' })
    this.tweens.add({ targets: sub, alpha: 1, y: { from: cy + 50, to: cy + 16 }, duration: 680, delay: 200, ease: 'Back.Out' })

    if (result === 'win') {
      this.time.delayedCall(250, () => {
        const conf = this.add.particles(cx, cy, 'pixel', {
          speed: { min: 110, max: 300 },
          angle: { min: -180, max: 0 },
          scale: { start: 4, end: 0 },
          lifespan: 1300,
          quantity: 50,
          tint: [0xFFE566, 0xADC178, 0xFF88AA, 0x88CCFF, 0xFFFFFF],
          gravityY: 220,
          emitting: false,
        })
        conf.explode(50)
        this.time.delayedCall(1500, () => conf.destroy())
      })
    }

    const timeRemaining = Math.round(this.timeLeftMs / 1000)
    this.time.delayedCall(2500, () => {
      this.cb.onGameEnd(result, this.deliveredCount, timeRemaining)
    })
  }

  private formatTime(ms: number): string {
    const sec = Math.ceil(ms / 1000)
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }
}
