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
  private sparkle: Phaser.GameObjects.Image
  private sparkleTimer: Phaser.Time.TimerEvent | null = null

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

    const backing = scene.add.graphics()
    backing.fillStyle(0x081106, 0.66)
    backing.fillCircle(0, 0, 25)

    // Outer glow ring
    const glow = scene.add.graphics()
    glow.lineStyle(4, colorNum, 0.94)
    glow.strokeCircle(0, 0, 27)
    glow.lineStyle(2, 0xfff3c6, 0.88)
    glow.strokeCircle(0, 0, 31)

    const marker = scene.add.graphics()
    marker.fillStyle(0xfff3c6, 0.98)
    marker.fillTriangle(0, -31, -6, -40, 6, -40)
    marker.lineStyle(2, colorNum, 0.95)
    marker.strokeTriangle(0, -31, -6, -40, 6, -40)

    const outline = scene.add.image(0, 0, `package-${imageIndex}`)
    outline.setDisplaySize(51, 51)
    outline.setTint(0xfff2bd).setAlpha(0.78)

    // Package image — large enough to remain legible against the painted maps.
    const sprite = scene.add.image(0, 0, `package-${imageIndex}`)
    sprite.setDisplaySize(46, 46)

    this.sparkle = scene.add.image(0, 0, 'package-sparkle-0')
    this.sparkle.setDisplaySize(48, 48).setAlpha(0.92)

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [backing, glow, marker, outline, sprite, this.sparkle],
    )
    this.container.setDepth(6)

    const motionEnabled = typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (motionEnabled) {
      let sparkleFrame = imageIndex % 4
      this.sparkleTimer = scene.time.addEvent({
        delay: 205 + imageIndex * 18,
        loop: true,
        callback: () => {
          sparkleFrame = (sparkleFrame + 1) % 4
          this.sparkle.setTexture(`package-sparkle-${sparkleFrame}`)
        },
      })
    }
  }

  pickup() {
    this.isPickedUp = true
    this.sparkleTimer?.remove(false)
    this.sparkleTimer = null
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
    this.sparkleTimer?.remove(false)
    this.container.destroy()
  }
}
