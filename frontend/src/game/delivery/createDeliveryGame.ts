import Phaser from 'phaser'
import { DeliveryGameScene } from './DeliveryGameScene'
import { COLS, ROWS, TILE } from './types'

export type DeliveryGameOptions = {
  onGameEnd?: (result: 'win' | 'lose', deliveries: number) => void
}

export type DeliveryGameAPI = {
  start: () => void
  stop: () => void
  destroy: () => void
}

export function createDeliveryGame(
  parent: HTMLDivElement,
  options: DeliveryGameOptions = {}
): DeliveryGameAPI {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: COLS * TILE,
    height: ROWS * TILE,
    backgroundColor: '#5A9030',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: { keyboard: true },
    audio: { disableWebAudio: false },
    scene: [],
  })

  game.scene.add(
    'DeliveryGameScene',
    DeliveryGameScene,
    true,
    { onGameEnd: options.onGameEnd ?? (() => {}) }
  )

  return {
    start: () => {},   // scene auto-starts on add
    stop:  () => game.scene.pause('DeliveryGameScene'),
    destroy: () => game.destroy(true, false),
  }
}
