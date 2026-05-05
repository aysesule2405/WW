import Phaser from 'phaser'
import { TILE } from '../data/deliveryConfig'
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

    scene.tweens.add({
      targets: this.sprite,
      y: -3,
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  get x() { return this.container.x }
  get y() { return this.container.y }

  // Exposed for camera.startFollow()
  get cameraTarget(): Phaser.GameObjects.Container { return this.container }

  setHeld(type: DeliveryType | null, imageIndex: number | null, colorNum: number) {
    this.heldType = type
    this.heldImageIndex = imageIndex

    if (this.holdSprite) { this.holdSprite.destroy(); this.holdSprite = null }
    if (this.holdGlow)   { this.holdGlow.destroy();   this.holdGlow   = null }

    if (!type || imageIndex === null) return

    this.holdGlow = this.scene.add.graphics()
    this.holdGlow.fillStyle(colorNum, 0.2)
    this.holdGlow.fillCircle(0, -40, 18)
    this.holdGlow.lineStyle(2, colorNum, 0.55)
    this.holdGlow.strokeCircle(0, -40, 18)
    this.container.add(this.holdGlow)

    this.holdSprite = this.scene.add.image(0, -40, `package-${imageIndex}`)
    this.holdSprite.setDisplaySize(28, 28)
    this.container.add(this.holdSprite)

    this.scene.tweens.add({
      targets: [this.holdSprite, this.holdGlow],
      y: '-=5',
      duration: 580,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  // Scene validates walkability before calling; Player just animates.
  tryMove(dx: number, dy: number, duration: number, onArrival?: () => void) {
    if (this.isMoving) return

    this.isMoving = true
    this.gridX += dx
    this.gridY += dy

    if (dx < 0) this.sprite.setFlipX(true)
    else if (dx > 0) this.sprite.setFlipX(false)

    this.scene.tweens.add({
      targets: this.container,
      x: this.gridX * TILE + TILE / 2,
      y: this.gridY * TILE + TILE / 2,
      duration,
      ease: 'Quad.Out',
      onComplete: () => {
        this.isMoving = false
        onArrival?.()
      },
    })
  }

  destroy() {
    this.holdSprite?.destroy()
    this.holdGlow?.destroy()
    this.container.destroy()
  }
}
