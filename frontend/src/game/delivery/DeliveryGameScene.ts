import Phaser from 'phaser'
import {
  TILE, COLS, ROWS,
  DELIVERY_TYPES,
  HOUSE_POSITIONS, PACKAGE_POSITIONS, PLAYER_START,
  GAME_DURATION_MS,
} from './types'
import { Player } from './Player'
import { PackageItem } from './PackageItem'
import { HouseItem } from './HouseItem'

type SceneData = {
  onGameEnd: (result: 'win' | 'lose', deliveries: number) => void
}

export class DeliveryGameScene extends Phaser.Scene {
  private onGameEnd?: (result: 'win' | 'lose', deliveries: number) => void

  private player!: Player
  private packages: PackageItem[] = []
  private houses: HouseItem[] = []

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private moveRepeatTimer = 0
  private readonly MOVE_REPEAT = 155

  private timeLeftMs = GAME_DURATION_MS
  private deliveredCount = 0
  private running = false

  private timerText!: Phaser.GameObjects.Text
  private deliveryText!: Phaser.GameObjects.Text
  private holdText!: Phaser.GameObjects.Text
  private timerBar!: Phaser.GameObjects.Graphics

  constructor() {
    super({ key: 'DeliveryGameScene' })
  }

  init(data: SceneData) {
    this.onGameEnd = data.onGameEnd
    this.timeLeftMs = GAME_DURATION_MS
    this.deliveredCount = 0
    this.running = false
    this.packages = []
    this.houses = []
  }

  preload() {
    // 4×4 white pixel — used for particle emitters
    const g = this.make.graphics({ x: 0, y: 0 }, false)
    g.fillStyle(0xffffff)
    g.fillRect(0, 0, 4, 4)
    g.generateTexture('pixel', 4, 4)
    g.destroy()
  }

  create() {
    this.drawMap()
    this.createWindParticles()
    this.spawnEntities()
    this.buildUI()
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.running = true
  }

  // ─── Map ────────────────────────────────────────────────────────────────────

  private drawMap() {
    const g = this.add.graphics().setDepth(0)
    const MAP_DATA = this.getMapData()

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = MAP_DATA[row][col]
        const px = col * TILE
        const py = row * TILE

        if (tile === 1) {
          g.fillStyle(0x2D5A1B)
          g.fillRect(px, py, TILE, TILE)
          g.fillStyle(0x3A7525, 0.55)
          g.fillRect(px + 4, py + 4, TILE - 8, TILE - 8)
          g.fillStyle(0x1E3F10, 0.35)
          g.fillCircle(px + 14, py + 14, 5)
          g.fillCircle(px + 34, py + 32, 4)
        } else if (tile === 2) {
          // Grass base
          g.fillStyle(0x5E8A2E)
          g.fillRect(px, py, TILE, TILE)
          // Trunk
          g.fillStyle(0x8B5E3C)
          g.fillRect(px + 19, py + 30, 10, 18)
          // Canopy layers (back to front)
          g.fillStyle(0x2E6010)
          g.fillCircle(px + 24, py + 20, 20)
          g.fillStyle(0x3D7820)
          g.fillCircle(px + 16, py + 16, 14)
          g.fillStyle(0x4D9028)
          g.fillCircle(px + 32, py + 18, 12)
          g.fillStyle(0x60A830)
          g.fillCircle(px + 24, py + 11, 12)
          // Highlight
          g.fillStyle(0x78C040, 0.4)
          g.fillCircle(px + 20, py + 9, 5)
        } else {
          const isAlt = (row + col) % 2 === 0
          g.fillStyle(isAlt ? 0x6EAF38 : 0x78BC40)
          g.fillRect(px, py, TILE, TILE)
          // Subtle grass blades
          g.fillStyle(0x5A9A2E, 0.3)
          g.fillRect(px + 9, py + 11, 3, 9)
          g.fillRect(px + 22, py + 32, 3, 7)
          g.fillRect(px + 37, py + 16, 3, 7)
        }
      }
    }

    // Subtle dirt path connecting the four corners via center
    const pathG = this.add.graphics().setDepth(1)
    pathG.fillStyle(0x8B7355, 0.22)
    for (let col = 1; col <= 15; col++) {
      pathG.fillRoundedRect(col * TILE + 6, 5 * TILE + 6, TILE - 12, TILE - 12, 4)
      pathG.fillRoundedRect(col * TILE + 6, 6 * TILE + 6, TILE - 12, TILE - 12, 4)
    }
    for (let row = 1; row <= 10; row++) {
      pathG.fillRoundedRect(7 * TILE + 6, row * TILE + 6, TILE - 12, TILE - 12, 4)
      pathG.fillRoundedRect(8 * TILE + 6, row * TILE + 6, TILE - 12, TILE - 12, 4)
    }
  }

  private getMapData(): number[][] {
    // Re-imported here to keep scene self-contained
    return [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]
  }

  // ─── Atmosphere ─────────────────────────────────────────────────────────────

  private createWindParticles() {
    const emitter = this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: COLS * TILE },
      y: { min: 0, max: ROWS * TILE },
      speedX: { min: 20, max: 60 },
      speedY: { min: -8, max: 8 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.35, end: 0 },
      lifespan: { min: 2000, max: 3500 },
      frequency: 220,
      tint: [0xDDE5B6, 0xFFFFDD, 0xAACC88],
    })
    emitter.setDepth(8)
  }

  // ─── Entities ───────────────────────────────────────────────────────────────

  private spawnEntities() {
    const shuffled = [...DELIVERY_TYPES].sort(() => Math.random() - 0.5)

    for (let i = 0; i < 4; i++) {
      const cfg = shuffled[i]
      const pos = HOUSE_POSITIONS[i]
      this.houses.push(new HouseItem(this, cfg.type, cfg.colorNum, cfg.letter, pos.col, pos.row))
    }

    const pkgOrder = [...shuffled].sort(() => Math.random() - 0.5)
    for (let i = 0; i < 4; i++) {
      const cfg = pkgOrder[i]
      const pos = PACKAGE_POSITIONS[i]
      this.packages.push(new PackageItem(this, cfg.type, cfg.colorNum, cfg.letter, pos.col, pos.row))
    }

    this.player = new Player(this, PLAYER_START.col, PLAYER_START.row)
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────

  private buildUI() {
    const W = COLS * TILE
    const BAR = 38

    // Panel background
    const panelG = this.add.graphics().setDepth(9)
    panelG.fillStyle(0x0D1F06, 0.85)
    panelG.fillRect(0, 0, W, BAR)
    panelG.lineStyle(1, 0x4A7C20, 0.6)
    panelG.strokeRect(0, 0, W, BAR)

    // Timer progress bar (behind text)
    this.timerBar = this.add.graphics().setDepth(9)

    this.timerText = this.add.text(W / 2, BAR / 2, '2:00', {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#F0EAD2',
      fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 0.5).setDepth(10)

    this.deliveryText = this.add.text(14, BAR / 2, '0 / 4  📦', {
      fontSize: '15px',
      color: '#ADC178',
    }).setOrigin(0, 0.5).setDepth(10)

    this.holdText = this.add.text(W - 14, BAR / 2, 'Hands empty', {
      fontSize: '14px',
      color: '#C8B89A',
    }).setOrigin(1, 0.5).setDepth(10)
  }

  // ─── Update ─────────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (!this.running) return

    this.timeLeftMs -= delta
    if (this.timeLeftMs <= 0) {
      this.timeLeftMs = 0
      this.endGame('lose')
      return
    }

    this.refreshTimer()
    this.handleMovement(delta)
  }

  // ─── Movement ───────────────────────────────────────────────────────────────

  private handleMovement(delta: number) {
    if (this.player.isMoving) return

    this.moveRepeatTimer -= delta
    const c = this.cursors
    let dx = 0
    let dy = 0

    // JustDown = first press; isDown = held repeat
    if (Phaser.Input.Keyboard.JustDown(c.left))        { dx = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (Phaser.Input.Keyboard.JustDown(c.right))  { dx =  1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (Phaser.Input.Keyboard.JustDown(c.up))     { dy = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (Phaser.Input.Keyboard.JustDown(c.down))   { dy =  1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.left.isDown  && this.moveRepeatTimer <= 0) { dx = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.right.isDown && this.moveRepeatTimer <= 0) { dx =  1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.up.isDown    && this.moveRepeatTimer <= 0) { dy = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.down.isDown  && this.moveRepeatTimer <= 0) { dy =  1; this.moveRepeatTimer = this.MOVE_REPEAT }

    if (dx === 0 && dy === 0) return

    const moved = this.player.tryMove(dx, dy, () => {
      this.checkPickup()
      this.checkDelivery()
    })

    if (!moved) {
      // Soft bump feedback — tiny screen nudge
      this.cameras.main.shake(50, 0.002)
    }
  }

  // ─── Game logic ─────────────────────────────────────────────────────────────

  private checkPickup() {
    if (this.player.heldType !== null) return

    const pkg = this.packages.find(
      (p) => !p.isPickedUp && p.gridX === this.player.gridX && p.gridY === this.player.gridY
    )
    if (!pkg) return

    const cfg = DELIVERY_TYPES.find((d) => d.type === pkg.type)!
    pkg.pickup()
    this.player.setHeld(pkg.type, cfg.colorNum, cfg.letter)
    this.holdText.setText(`Carrying: ${cfg.label}`).setColor(cfg.colorHex)
    this.floatText(`✦ Picked up ${cfg.label}!`, this.player.x, this.player.y - 24, '#FFE566')
  }

  private checkDelivery() {
    if (this.player.heldType === null) return

    const house = this.houses.find(
      (h) => !h.isDelivered && h.gridX === this.player.gridX && h.gridY === this.player.gridY
    )
    if (!house) return

    if (house.type === this.player.heldType) {
      // ✅ Correct
      house.markDelivered()
      this.deliveredCount++
      this.player.setHeld(null, 0, '')
      this.holdText.setText('Hands empty').setColor('#C8B89A')
      this.deliveryText.setText(`${this.deliveredCount} / 4  📦`)
      this.showBubble('Thank you! 🌸', house.gridX, house.gridY, true)
      this.cameras.main.flash(280, 180, 220, 120)

      if (this.deliveredCount === 4) {
        this.time.delayedCall(700, () => this.endGame('win'))
      }
    } else {
      // ❌ Wrong house
      house.shake()
      this.showBubble("That's not mine! ✗", house.gridX, house.gridY, false)
      this.cameras.main.shake(200, 0.007)
      // 5-second time penalty
      this.timeLeftMs = Math.max(0, this.timeLeftMs - 5_000)
      this.floatText('-5s ⏰', this.player.x, this.player.y - 20, '#FF7766')
    }
  }

  // ─── Feedback ───────────────────────────────────────────────────────────────

  private floatText(text: string, wx: number, wy: number, color: string) {
    const t = this.add.text(wx, wy, text, {
      fontSize: '14px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(15)

    this.tweens.add({
      targets: t,
      y: wy - 44,
      alpha: 0,
      duration: 1100,
      ease: 'Quad.Out',
      onComplete: () => t.destroy(),
    })
  }

  private showBubble(text: string, gridX: number, gridY: number, success: boolean) {
    const bgColor = success ? 0xD4EDBE : 0xFFDDCC
    const textColor = success ? '#1A5C0A' : '#8B1A00'
    const borderColor = success ? 0x5A9E30 : 0xCC3300
    const W = 164, H = 38

    const g = this.add.graphics()
    g.fillStyle(bgColor, 0.96)
    g.fillRoundedRect(-W / 2, -H / 2, W, H, 10)
    g.lineStyle(2, borderColor, 0.85)
    g.strokeRoundedRect(-W / 2, -H / 2, W, H, 10)
    // Pointer tail
    g.fillStyle(bgColor, 0.96)
    g.fillTriangle(-7, H / 2, 7, H / 2, 0, H / 2 + 11)

    const t = this.add.text(0, 0, text, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: textColor,
    }).setOrigin(0.5, 0.5)

    const wx = Phaser.Math.Clamp(gridX * TILE + TILE / 2, W / 2 + 4, COLS * TILE - W / 2 - 4)
    const wy = Phaser.Math.Clamp(gridY * TILE - 16, H / 2 + 50, ROWS * TILE - H - 20)

    const bubble = this.add.container(wx, wy, [g, t])
    bubble.setDepth(12).setAlpha(0).setScale(0.7)

    this.tweens.add({
      targets: bubble,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: 'Back.Out',
    })

    this.time.delayedCall(1900, () => {
      this.tweens.add({
        targets: bubble,
        alpha: 0,
        y: bubble.y - 18,
        duration: 380,
        ease: 'Quad.In',
        onComplete: () => bubble.destroy(),
      })
    })
  }

  // ─── Timer display ──────────────────────────────────────────────────────────

  private refreshTimer() {
    const sec = Math.ceil(this.timeLeftMs / 1000)
    const m = Math.floor(sec / 60)
    const s = sec % 60
    this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`)

    const ratio = this.timeLeftMs / GAME_DURATION_MS
    const barW = (COLS * TILE) * ratio

    this.timerBar.clear()
    const barColor = ratio > 0.5 ? 0x5ABA2E : ratio > 0.25 ? 0xE8C030 : 0xEE3322
    this.timerBar.fillStyle(barColor, 0.3)
    this.timerBar.fillRect(0, 34, barW, 4)

    if (this.timeLeftMs < 30_000) {
      this.timerText.setColor('#FF6B6B')
      // Heartbeat pulse
      const pulse = Math.floor(this.timeLeftMs / 500) % 2 === 0
      this.timerText.setScale(pulse ? 1.12 : 1.0)
    } else if (this.timeLeftMs < 60_000) {
      this.timerText.setColor('#FFD166').setScale(1.0)
    } else {
      this.timerText.setColor('#F0EAD2').setScale(1.0)
    }
  }

  // ─── End game ───────────────────────────────────────────────────────────────

  private endGame(result: 'win' | 'lose') {
    if (!this.running) return
    this.running = false

    const cx = (COLS * TILE) / 2
    const cy = (ROWS * TILE) / 2

    const overlay = this.add.graphics().setDepth(20)
    overlay.fillStyle(0x000000, 0.55)
    overlay.fillRect(0, 0, COLS * TILE, ROWS * TILE)
    overlay.setAlpha(0)
    this.tweens.add({ targets: overlay, alpha: 1, duration: 500 })

    const title = this.add.text(
      cx, cy - 28,
      result === 'win' ? '✨  All Delivered!  ✨' : '⏰  Time is up!',
      {
        fontSize: '34px',
        fontStyle: 'bold',
        color: result === 'win' ? '#FFE566' : '#FF8888',
        stroke: '#000000',
        strokeThickness: 4,
        fontFamily: 'Georgia, serif',
      }
    ).setOrigin(0.5, 0.5).setDepth(21).setAlpha(0)

    const sub = this.add.text(
      cx, cy + 24,
      result === 'win'
        ? 'The grove thanks Kiki! 🌸'
        : `${this.deliveredCount} of 4 packages delivered`,
      {
        fontSize: '18px',
        color: '#F0EAD2',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5, 0.5).setDepth(21).setAlpha(0)

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: { from: cy, to: cy - 28 },
      duration: 650,
      ease: 'Back.Out',
    })
    this.tweens.add({
      targets: sub,
      alpha: 1,
      y: { from: cy + 55, to: cy + 24 },
      duration: 650,
      delay: 180,
      ease: 'Back.Out',
    })

    if (result === 'win') {
      // Confetti burst
      this.time.delayedCall(200, () => {
        const conf = this.add.particles(cx, cy, 'pixel', {
          speed: { min: 100, max: 280 },
          angle: { min: -180, max: 0 },
          scale: { start: 4, end: 0 },
          lifespan: 1200,
          quantity: 40,
          tint: [0xFFE566, 0xADC178, 0xFF88AA, 0x88CCFF, 0xFFFFFF],
          gravityY: 200,
          emitting: false,
        })
        conf.explode(40)
        this.time.delayedCall(1500, () => conf.destroy())
      })
    }

    this.time.delayedCall(2200, () => {
      this.onGameEnd?.(result, this.deliveredCount)
    })
  }
}
