import Phaser from 'phaser'
import { TILE, HOUSE_SIZE } from '../data/deliveryConfig'
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
    showSprite = true,
  ) {
    this.scene = scene
    this.type = type
    this.gridX = gridX
    this.gridY = gridY
    this.colorNum = colorNum
    this.colorHex = colorHex
    this.imageIndex = imageIndex

    const blockSize = HOUSE_SIZE * TILE
    const halfBlock = blockSize / 2

    // Shadow ellipse beneath house
    const shadow = scene.add.graphics()
    shadow.fillStyle(0x000000, 0.18)
    shadow.fillEllipse(0, -10, 132, 34)
    shadow.setVisible(showSprite)

    // House image — keep the native PNG size and bottom-align it to the yard.
    this.sprite = scene.add.image(0, -10, `house-${imageIndex}`).setOrigin(0.5, 1)
    this.sprite.setVisible(showSprite)

    // Color-coded badge ring around the base
    const badge = scene.add.graphics()
    badge.lineStyle(4, colorNum, 0.8)
    badge.strokeCircle(0, -20, halfBlock - 18)
    badge.fillStyle(colorNum, 0.10)
    badge.fillCircle(0, -20, halfBlock - 18)

    // Container anchored at the bottom-center of the blocked house footprint.
    this.container = scene.add.container(
      (gridX + HOUSE_SIZE / 2) * TILE,
      (gridY + HOUSE_SIZE) * TILE,
      [shadow, badge, this.sprite],
    )
    this.container.setDepth(2)
  }

  markDelivered() {
    this.isDelivered = true

    // Sparkle burst — fires from center of 3×3 block
    const px = this.scene.add.particles(
      (this.gridX + HOUSE_SIZE / 2) * TILE,
      (this.gridY + HOUSE_SIZE / 2) * TILE,
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

    // Green glow overlay spans the full 3×3 block
    const overlay = this.scene.add.graphics()
    overlay.fillStyle(0x00CC44, 0.18)
    overlay.fillRoundedRect(
      this.gridX * TILE - 4,
      this.gridY * TILE - 4,
      HOUSE_SIZE * TILE + 8,
      HOUSE_SIZE * TILE + 8,
      10,
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
