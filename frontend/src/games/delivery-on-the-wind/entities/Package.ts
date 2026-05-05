import Phaser from 'phaser'
import { TILE } from '../data/deliveryConfig'
import type { DeliveryType } from '../data/deliveryConfig'

export class Package {
  public type: DeliveryType
  public gridX: number
  public gridY: number
  public imageIndex: number
  public isPickedUp = false

  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private colorNum: number

  constructor(
    scene: Phaser.Scene,
    type: DeliveryType,
    colorNum: number,
    imageIndex: number,
    gridX: number,
    gridY: number,
  ) {
    this.scene = scene
    this.type = type
    this.gridX = gridX
    this.gridY = gridY
    this.colorNum = colorNum
    this.imageIndex = imageIndex

    // Outer glow ring
    const glow = scene.add.graphics()
    glow.lineStyle(4, colorNum, 0.45)
    glow.strokeCircle(0, 0, 38)
    glow.lineStyle(2, colorNum, 0.2)
    glow.strokeCircle(0, 0, 46)

    // Package image — display at 56×56
    const sprite = scene.add.image(0, 0, `package-${imageIndex}`)
    sprite.setDisplaySize(56, 56)

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [glow, sprite],
    )
    this.container.setDepth(3)

    // Idle float
    scene.tweens.add({
      targets: this.container,
      y: this.container.y - 6,
      duration: 900 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })

    // Glow pulse
    scene.tweens.add({
      targets: glow,
      alpha: 0.15,
      duration: 1100 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  pickup() {
    this.isPickedUp = true
    this.scene.tweens.killTweensOf(this.container)

    const px = this.scene.add.particles(this.container.x, this.container.y, 'pixel', {
      speed: { min: 60, max: 160 },
      scale: { start: 3, end: 0 },
      lifespan: 520,
      quantity: 14,
      tint: [this.colorNum, 0xFFFFAA, 0xFFFFFF],
      gravityY: 70,
      emitting: false,
    })
    px.explode(14)
    this.scene.time.delayedCall(650, () => px.destroy())

    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 200,
      ease: 'Back.In',
      onComplete: () => this.container.setVisible(false),
    })
  }

  destroy() {
    this.container.destroy()
  }
}
