import Phaser from 'phaser'
import { TILE, COLS, ROWS, MAP_DATA } from '../data/deliveryConfig'
import type { DeliveryType } from '../data/deliveryConfig'

export class Player {
  public gridX: number
  public gridY: number
  public isMoving = false
  public heldType: DeliveryType | null = null
  public heldImageIndex: number | null = null

  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private sprite: Phaser.GameObjects.Image
  private holdSprite: Phaser.GameObjects.Image | null = null
  private holdGlow: Phaser.GameObjects.Graphics | null = null

  constructor(scene: Phaser.Scene, gridX: number, gridY: number) {
    this.scene = scene
    this.gridX = gridX
    this.gridY = gridY

    // Shadow under kiki
    const shadow = scene.add.graphics()
    shadow.fillStyle(0x000000, 0.15)
    shadow.fillEllipse(0, 22, 36, 10)

    this.sprite = scene.add.image(0, 0, 'kiki')
    this.sprite.setDisplaySize(48, 48)

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [shadow, this.sprite],
    )
    this.container.setDepth(5)

    // Gentle idle bounce
    scene.tweens.add({
      targets: this.sprite,
      y: -3,
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  setHeld(type: DeliveryType | null, imageIndex: number | null, colorNum: number) {
    this.heldType = type
    this.heldImageIndex = imageIndex

    // Remove previous held visuals
    if (this.holdSprite) {
      this.holdSprite.destroy()
      this.holdSprite = null
    }
    if (this.holdGlow) {
      this.holdGlow.destroy()
      this.holdGlow = null
    }

    if (!type || imageIndex === null) return

    // Glow ring behind the held package
    this.holdGlow = this.scene.add.graphics()
    this.holdGlow.fillStyle(colorNum, 0.2)
    this.holdGlow.fillCircle(0, -40, 18)
    this.holdGlow.lineStyle(2, colorNum, 0.55)
    this.holdGlow.strokeCircle(0, -40, 18)
    this.container.add(this.holdGlow)

    // Use the actual package image above Kiki's head
    this.holdSprite = this.scene.add.image(0, -40, `package-${imageIndex}`)
    this.holdSprite.setDisplaySize(28, 28)
    this.container.add(this.holdSprite)

    // Pulse animation on the held item
    this.scene.tweens.add({
      targets: [this.holdSprite, this.holdGlow],
      y: '-=5',
      duration: 580,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
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

    if (dx < 0) this.sprite.setFlipX(true)
    else if (dx > 0) this.sprite.setFlipX(false)

    this.scene.tweens.add({
      targets: this.container,
      x: nx * TILE + TILE / 2,
      y: ny * TILE + TILE / 2,
      duration: 115,
      ease: 'Quad.Out',
      onComplete: () => {
        this.isMoving = false
        onArrival?.()
      },
    })

    return true
  }

  destroy() {
    this.holdSprite?.destroy()
    this.holdGlow?.destroy()
    this.container.destroy()
  }
}
