import Phaser from 'phaser'
import { TILE } from '../data/deliveryConfig'
import type { NpcConfig } from '../data/deliveryConfig'

export class Npc {
  public id: NpcConfig['id']
  public name: string
  public gridX: number
  public gridY: number
  public config: NpcConfig

  private container: Phaser.GameObjects.Container
  private glow: Phaser.GameObjects.Graphics

  constructor(scene: Phaser.Scene, config: NpcConfig, gridX: number, gridY: number) {
    this.id = config.id
    this.name = config.name
    this.config = config
    this.gridX = gridX
    this.gridY = gridY

    const shadow = scene.add.graphics()
    shadow.fillStyle(0x071006, 0.58)
    shadow.fillEllipse(0, 9, 56, 38)

    this.glow = scene.add.graphics()
    this.glow.lineStyle(3, 0xffefb0, 0.86)
    this.glow.strokeCircle(0, 0, 25)
    this.glow.lineStyle(1, 0x17250e, 0.9)
    this.glow.strokeCircle(0, 0, 28)

    // Jiji is a cat and should read much smaller than the human NPCs.
    const displaySize = config.id === 'madame-barsa' ? 74 : config.id === 'jiji' ? 42 : 68
    const animatedKey = `npc-${config.assetKey}-animated`
    const animationKey = `${animatedKey}-idle`
    const outline = scene.add.image(0, 0, animatedKey, 0)
    outline.setDisplaySize(displaySize + 5, displaySize + 5)
    outline.setTint(0xfff2bd).setAlpha(0.75)

    const sprite = scene.add.sprite(0, 0, animatedKey, 0)
    sprite.setDisplaySize(displaySize, displaySize)

    if (!scene.anims.exists(animationKey)) {
      scene.anims.create({
        key: animationKey,
        frames: scene.anims.generateFrameNumbers(animatedKey, { frames: [0, 1, 2, 3] }),
        frameRate: 3,
        repeat: -1,
        repeatDelay: 520 + config.name.length * 18,
      })
    }

    const body = scene.add.container(0, -5, [outline, sprite])

    const marker = scene.add.graphics()
    marker.fillStyle(0xffefb0, 0.96)
    marker.fillTriangle(0, -34, -5, -42, 5, -42)
    marker.fillCircle(0, -45, 4)
    marker.lineStyle(1, 0x17250e, 0.92)
    marker.strokeCircle(0, -45, 5)

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [shadow, this.glow, marker, body],
    )
    this.container.setDepth(5)

    const motionEnabled = typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (motionEnabled) {
      sprite.play(animationKey)
    }
  }

  destroy() {
    this.container.destroy()
  }
}
