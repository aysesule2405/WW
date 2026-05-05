import Phaser from 'phaser'
import { TILE } from '../data/deliveryConfig'
import type { DeliveryType } from '../data/deliveryConfig'

export class House {
  public type: DeliveryType
  public gridX: number
  public gridY: number
  public imageIndex: number
  public colorNum: number
  public colorHex: string
  public isDelivered = false

  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private sprite: Phaser.GameObjects.Image

  constructor(
    scene: Phaser.Scene,
    type: DeliveryType,
    colorNum: number,
    colorHex: string,
    imageIndex: number,
    gridX: number,
    gridY: number,
  ) {
    this.scene = scene
    this.type = type
    this.gridX = gridX
    this.gridY = gridY
    this.colorNum = colorNum
    this.colorHex = colorHex
    this.imageIndex = imageIndex

    // Shadow ellipse beneath house
    const shadow = scene.add.graphics()
    shadow.fillStyle(0x000000, 0.18)
    shadow.fillEllipse(0, 28, 62, 16)

    // House image — display at 68×68
    this.sprite = scene.add.image(0, -4, `house-${imageIndex}`)
    this.sprite.setDisplaySize(68, 68)

    // Color-coded badge ring around the base
    const badge = scene.add.graphics()
    badge.lineStyle(3, colorNum, 0.8)
    badge.strokeCircle(0, 26, 26)
    badge.fillStyle(colorNum, 0.12)
    badge.fillCircle(0, 26, 26)

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [shadow, badge, this.sprite],
    )
    this.container.setDepth(2)
  }

  markDelivered() {
    this.isDelivered = true

    // Sparkle burst
    const px = this.scene.add.particles(
      this.gridX * TILE + TILE / 2,
      this.gridY * TILE + TILE / 2,
      'pixel',
      {
        speed: { min: 70, max: 180 },
        scale: { start: 3.5, end: 0 },
        lifespan: 750,
        quantity: 22,
        tint: [this.colorNum, 0xFFFF88, 0xFFFFFF, 0xAAFFAA],
        gravityY: 120,
        emitting: false,
      },
    )
    px.explode(22)
    this.scene.time.delayedCall(900, () => px.destroy())

    // Green tint on sprite
    this.sprite.setTint(0x88EE88)

    // Green glow overlay
    const overlay = this.scene.add.graphics()
    overlay.fillStyle(0x00CC44, 0.18)
    overlay.fillRoundedRect(
      this.gridX * TILE - 4,
      this.gridY * TILE - 4,
      TILE + 8,
      TILE + 8,
      6,
    )
    overlay.setDepth(2)

    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 1800,
      delay: 600,
      ease: 'Quad.Out',
      onComplete: () => overlay.destroy(),
    })
  }

  shake() {
    const ox = this.container.x
    this.scene.tweens.add({
      targets: this.container,
      x: { from: ox - 6, to: ox + 6 },
      duration: 50,
      yoyo: true,
      repeat: 5,
      ease: 'Sine.InOut',
      onComplete: () => { this.container.x = ox },
    })
  }

  destroy() {
    this.container.destroy()
  }
}
