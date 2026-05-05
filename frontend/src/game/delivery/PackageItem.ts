import Phaser from 'phaser'
import { TILE } from './types'
import type { DeliveryType } from './types'

export class PackageItem {
  public type: DeliveryType
  public gridX: number
  public gridY: number
  public isPickedUp = false

  private scene: Phaser.Scene
  private container: Phaser.GameObjects.Container
  private colorNum: number

  constructor(
    scene: Phaser.Scene,
    type: DeliveryType,
    colorNum: number,
    letter: string,
    gridX: number,
    gridY: number
  ) {
    this.scene = scene
    this.type = type
    this.gridX = gridX
    this.gridY = gridY
    this.colorNum = colorNum

    const g = scene.add.graphics()
    this.drawBox(g, colorNum)

    const label = scene.add.text(0, 1, letter, {
      fontSize: '17px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#00000066',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5)

    // Glow ring
    const glow = scene.add.graphics()
    glow.lineStyle(3, colorNum, 0.35)
    glow.strokeCircle(0, 0, 28)

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [glow, g, label]
    )
    this.container.setDepth(3)

    // Idle float
    scene.tweens.add({
      targets: this.container,
      y: this.container.y - 5,
      duration: 900 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })

    // Glow pulse
    scene.tweens.add({
      targets: glow,
      alpha: 0.2,
      duration: 1200 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  private drawBox(g: Phaser.GameObjects.Graphics, colorNum: number) {
    const s = 20
    // Shadow
    g.fillStyle(0x000000, 0.22)
    g.fillRoundedRect(-s + 3, -s + 3, s * 2, s * 2, 7)
    // Box body
    g.fillStyle(colorNum)
    g.fillRoundedRect(-s, -s, s * 2, s * 2, 7)
    // Ribbon horizontal
    g.fillStyle(0xFFFFFF, 0.35)
    g.fillRect(-s, -4, s * 2, 8)
    // Ribbon vertical
    g.fillRect(-4, -s, 8, s * 2)
    // Bow knot
    g.fillStyle(0xFFFFFF, 0.55)
    g.fillCircle(0, 0, 5)
    g.fillCircle(-7, -4, 4)
    g.fillCircle(7, -4, 4)
    // Highlight
    g.fillStyle(0xFFFFFF, 0.2)
    g.fillRoundedRect(-s + 3, -s + 3, s - 2, 8, 3)
    // Border
    g.lineStyle(2, 0xFFFFFF, 0.4)
    g.strokeRoundedRect(-s, -s, s * 2, s * 2, 7)
  }

  pickup() {
    this.isPickedUp = true
    this.scene.tweens.killTweensOf(this.container)

    // Sparkle burst before vanishing
    const px = this.scene.add.particles(this.container.x, this.container.y, 'pixel', {
      speed: { min: 50, max: 130 },
      scale: { start: 2.5, end: 0 },
      lifespan: 500,
      quantity: 10,
      tint: [this.colorNum, 0xFFFFAA, 0xFFFFFF],
      gravityY: 60,
      emitting: false,
    })
    px.explode(10)
    this.scene.time.delayedCall(600, () => px.destroy())

    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 180,
      ease: 'Back.In',
      onComplete: () => this.container.setVisible(false),
    })
  }

  destroy() {
    this.container.destroy()
  }
}
