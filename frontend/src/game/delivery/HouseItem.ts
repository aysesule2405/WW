import Phaser from 'phaser'
import { TILE } from './types'
import type { DeliveryType } from './types'

export class HouseItem {
  public type: DeliveryType
  public gridX: number
  public gridY: number
  public isDelivered = false

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
    this.drawHouse(g, colorNum)

    const typeLabel = scene.add.text(0, 4, letter, {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#00000066',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5)

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [g, typeLabel]
    )
    this.container.setDepth(2)
  }

  private drawHouse(g: Phaser.GameObjects.Graphics, colorNum: number) {
    // Chimney
    g.fillStyle(0x8B6914)
    g.fillRect(8, -38, 9, 16)
    g.fillStyle(0x555555)
    g.fillRect(7, -41, 11, 6)
    // Smoke puff (static)
    g.fillStyle(0xCCCCCC, 0.4)
    g.fillCircle(13, -46, 5)
    g.fillCircle(17, -50, 4)

    // Roof
    g.fillStyle(0x5C3317)
    g.fillTriangle(-26, -10, 26, -10, 0, -38)
    g.lineStyle(1.5, 0x3E2209, 0.6)
    g.strokeTriangle(-26, -10, 26, -10, 0, -38)

    // House body
    g.fillStyle(colorNum)
    g.fillRect(-22, -10, 44, 32)

    // Color band (door frame accent)
    g.fillStyle(colorNum, 0.7)
    const darken = Phaser.Display.Color.ValueToColor(colorNum)
    darken.darken(20)
    g.fillStyle(darken.color)
    g.fillRect(-22, -10, 44, 6)

    // Door
    g.fillStyle(0x8B6914)
    g.fillRoundedRect(-8, 8, 16, 24, { tl: 8, tr: 8, bl: 0, br: 0 })
    g.fillStyle(0xC8A020)
    g.fillCircle(5, 20, 2)

    // Left window
    g.fillStyle(0xADD8E6, 0.85)
    g.fillRect(-19, -6, 11, 11)
    g.fillStyle(0xFFFFFF, 0.3)
    g.fillRect(-19, -6, 11, 5)
    g.lineStyle(1.5, 0x8B6914, 0.7)
    g.strokeRect(-19, -6, 11, 11)
    g.beginPath()
    g.moveTo(-13, -6)
    g.lineTo(-13, 5)
    g.strokePath()
    g.beginPath()
    g.moveTo(-19, -0.5)
    g.lineTo(-8, -0.5)
    g.strokePath()

    // Right window
    g.fillStyle(0xADD8E6, 0.85)
    g.fillRect(8, -6, 11, 11)
    g.fillStyle(0xFFFFFF, 0.3)
    g.fillRect(8, -6, 11, 5)
    g.lineStyle(1.5, 0x8B6914, 0.7)
    g.strokeRect(8, -6, 11, 11)
    g.beginPath()
    g.moveTo(13, -6)
    g.lineTo(13, 5)
    g.strokePath()
    g.beginPath()
    g.moveTo(8, -0.5)
    g.lineTo(19, -0.5)
    g.strokePath()

    // Outer border
    g.lineStyle(2, 0x00000033)
    g.strokeRect(-22, -10, 44, 32)

    // Door mat
    g.fillStyle(0x8B6914, 0.5)
    g.fillRect(-10, 22, 20, 4)
  }

  markDelivered() {
    this.isDelivered = true

    // Check overlay on house
    const check = this.scene.add.text(
      this.gridX * TILE + TILE / 2,
      this.gridY * TILE - 8,
      '✓',
      { fontSize: '32px', fontStyle: 'bold', color: '#00EE55', stroke: '#004400', strokeThickness: 3 }
    ).setOrigin(0.5, 0.5).setDepth(7)

    this.scene.tweens.add({
      targets: check,
      y: check.y - 24,
      alpha: 0,
      duration: 1400,
      ease: 'Quad.Out',
      onComplete: () => check.destroy(),
    })

    // Sparkle burst
    const px = this.scene.add.particles(
      this.gridX * TILE + TILE / 2,
      this.gridY * TILE + TILE / 2,
      'pixel',
      {
        speed: { min: 60, max: 150 },
        scale: { start: 3, end: 0 },
        lifespan: 700,
        quantity: 16,
        tint: [this.colorNum, 0xFFFF88, 0xFFFFFF, 0xAAFFAA],
        gravityY: 100,
        emitting: false,
      }
    )
    px.explode(16)
    this.scene.time.delayedCall(800, () => px.destroy())

    // Shade the house to show it's done
    const overlay = this.scene.add.graphics()
    overlay.fillStyle(0x00AA33, 0.18)
    overlay.fillRect(
      this.gridX * TILE - 4,
      this.gridY * TILE - 20,
      TILE + 8,
      TILE + 20
    )
    overlay.setDepth(2)
  }

  shake() {
    const ox = this.container.x
    this.scene.tweens.add({
      targets: this.container,
      x: { from: ox - 5, to: ox + 5 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.InOut',
      onComplete: () => { this.container.x = ox },
    })
  }

  destroy() {
    this.container.destroy()
  }
}
