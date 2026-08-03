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
  private sprite: Phaser.GameObjects.Sprite
  private outline: Phaser.GameObjects.Image
  private motionEnabled: boolean
  private holdSprite: Phaser.GameObjects.Image | null = null
  private holdGlow: Phaser.GameObjects.Graphics | null = null

  constructor(scene: Phaser.Scene, gridX: number, gridY: number) {
    this.scene = scene
    this.motionEnabled = typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    this.gridX = gridX
    this.gridY = gridY

    const focus = scene.add.graphics()
    focus.fillStyle(0x081106, 0.54)
    focus.fillCircle(0, -8, 34)
    focus.lineStyle(2, 0xffefad, 0.82)
    focus.strokeCircle(0, -8, 34)

    const shadow = scene.add.graphics()
    shadow.fillStyle(0x000000, 0.36)
    shadow.fillEllipse(0, 12, 54, 9)

    this.outline = scene.add.image(0, -8, 'kiki-animated', 0)
    this.outline.setDisplaySize(78, 78)
    this.outline.setTint(0xfff1ad).setAlpha(0.7)

    this.sprite = scene.add.sprite(0, -8, 'kiki-animated', 0)
    this.sprite.setDisplaySize(72, 72)

    if (!scene.anims.exists('kiki-pixel-flight')) {
      scene.anims.create({
        key: 'kiki-pixel-flight',
        frames: scene.anims.generateFrameNumbers('kiki-animated', { frames: [0, 1, 2, 3] }),
        frameRate: 8,
        repeat: -1,
      })
    }

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [focus, shadow, this.outline, this.sprite],
    )
    this.container.setDepth(7)
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

    const holdY = -44
    this.holdGlow = this.scene.add.graphics()
    this.holdGlow.fillStyle(colorNum, 0.2)
    this.holdGlow.fillCircle(0, holdY, TILE - 4)
    this.holdGlow.lineStyle(2, colorNum, 0.55)
    this.holdGlow.strokeCircle(0, holdY, TILE - 4)
    this.container.add(this.holdGlow)

    this.holdSprite = this.scene.add.image(0, holdY, `package-${imageIndex}`)
    this.holdSprite.setDisplaySize(30, 30)
    this.container.add(this.holdSprite)
  }

  // Scene validates airborne traversal before calling; Player just animates.
  tryMove(dx: number, dy: number, duration: number, onArrival?: () => void) {
    if (this.isMoving) return

    this.isMoving = true
    this.gridX += dx
    this.gridY += dy

    if (dx < 0) {
      this.sprite.setFlipX(true)
      this.outline.setFlipX(true)
    } else if (dx > 0) {
      this.sprite.setFlipX(false)
      this.outline.setFlipX(false)
    }

    if (this.motionEnabled) {
      this.sprite.play('kiki-pixel-flight', true)
    }

    this.scene.tweens.add({
      targets: this.container,
      x: this.gridX * TILE + TILE / 2,
      y: this.gridY * TILE + TILE / 2,
      duration,
      ease: 'Quad.Out',
      onComplete: () => {
        this.isMoving = false
        this.sprite.stop().setFrame(0)
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
