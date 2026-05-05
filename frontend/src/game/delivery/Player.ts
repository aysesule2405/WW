import Phaser from 'phaser'
import { TILE, COLS, ROWS, MAP_DATA } from './types'
import type { DeliveryType } from './types'

export class Player {
  public gridX: number
  public gridY: number
  public isMoving = false
  public heldType: DeliveryType | null = null

  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private bodyGfx: Phaser.GameObjects.Graphics
  private holdGfx: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, gridX: number, gridY: number) {
    this.scene = scene
    this.gridX = gridX
    this.gridY = gridY

    this.bodyGfx = scene.add.graphics()
    this.holdGfx = scene.add.graphics()

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [this.bodyGfx, this.holdGfx]
    )
    this.container.setDepth(5)

    this.drawCharacter()

    // Idle gentle bounce
    scene.tweens.add({
      targets: this.bodyGfx,
      y: -2,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  private drawCharacter() {
    const g = this.bodyGfx
    g.clear()
    // Drop shadow
    g.fillStyle(0x000000, 0.18)
    g.fillEllipse(0, 20, 30, 10)
    // Cape / cloak
    g.fillStyle(0x7B3F00)
    g.fillEllipse(0, 8, 32, 28)
    // Body
    g.fillStyle(0xA0522D)
    g.fillCircle(0, 4, 14)
    // Head
    g.fillStyle(0xF5CBA7)
    g.fillCircle(0, -10, 10)
    // Hat brim
    g.fillStyle(0x4A2800)
    g.fillEllipse(0, -18, 28, 9)
    // Hat top
    g.fillRect(-7, -32, 14, 16)
    // Hat ribbon
    g.fillStyle(0xDDA0DD, 0.9)
    g.fillRect(-7, -21, 14, 4)
    // Eyes
    g.fillStyle(0x2C1810)
    g.fillCircle(-3, -11, 2)
    g.fillCircle(3, -11, 2)
    // Rosy cheeks
    g.fillStyle(0xFFB6C1, 0.55)
    g.fillCircle(-6, -8, 3)
    g.fillCircle(6, -8, 3)
    // Smile
    g.lineStyle(1.5, 0x2C1810, 0.7)
    g.beginPath()
    g.arc(0, -6, 4, 0.2, Math.PI - 0.2)
    g.strokePath()
  }

  setHeld(type: DeliveryType | null, colorNum: number, letter: string) {
    this.heldType = type
    const g = this.holdGfx
    g.clear()
    if (!type) return

    // Small package bobbing above head
    const s = 10
    g.fillStyle(0x000000, 0.2)
    g.fillRoundedRect(-s + 2, -48 + 2, s * 2, s * 2, 3)
    g.fillStyle(colorNum)
    g.fillRoundedRect(-s, -48, s * 2, s * 2, 3)
    g.fillStyle(0xFFFFFF, 0.4)
    g.fillRect(-s, -42, s * 2, 2)
    g.fillRect(-2, -48, 4, s * 2)
    g.lineStyle(1.5, 0xFFFFFF, 0.5)
    g.strokeRoundedRect(-s, -48, s * 2, s * 2, 3)

    // Letter
    const text = this.scene.add.text(0, -38, letter, {
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setDepth(6)
    this.container.add(text)
    // Clean up previous label - store ref and destroy on next call
    ;(this as any)._holdLabel?.destroy()
    ;(this as any)._holdLabel = text
  }

  get x() { return this.container.x }
  get y() { return this.container.y }

  tryMove(dx: number, dy: number, onArrival?: () => void): boolean {
    if (this.isMoving) return false

    const nx = this.gridX + dx
    const ny = this.gridY + dy

    if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false
    const tile = MAP_DATA[ny]?.[nx]
    if (tile === 1 || tile === 2) return false

    this.isMoving = true
    this.gridX = nx
    this.gridY = ny

    this.scene.tweens.add({
      targets: this.container,
      x: nx * TILE + TILE / 2,
      y: ny * TILE + TILE / 2,
      duration: 110,
      ease: 'Quad.Out',
      onComplete: () => {
        this.isMoving = false
        onArrival?.()
      },
    })

    return true
  }

  destroy() {
    ;(this as any)._holdLabel?.destroy()
    this.container.destroy()
  }
}
