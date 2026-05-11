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
    shadow.fillStyle(0x000000, 0.18)
    shadow.fillEllipse(0, 22, 36, 10)

    this.glow = scene.add.graphics()
    this.glow.lineStyle(2, 0xe9dfc2, 0.42)
    this.glow.strokeCircle(0, 0, 28)

    const sprite = scene.add.image(0, -4, `npc-${config.assetKey}`)
    sprite.setDisplaySize(48, 48)

    this.container = scene.add.container(
      gridX * TILE + TILE / 2,
      gridY * TILE + TILE / 2,
      [this.glow, shadow, sprite],
    )
    this.container.setDepth(4)

    scene.tweens.add({
      targets: sprite,
      y: -7,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
    scene.tweens.add({
      targets: this.glow,
      alpha: 0.25,
      duration: 950,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    })
  }

  destroy() {
    this.container.destroy()
  }
}
