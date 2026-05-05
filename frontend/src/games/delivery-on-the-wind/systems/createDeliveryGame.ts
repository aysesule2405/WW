import Phaser from 'phaser'
import { DeliveryGameScene } from '../DeliveryGameScene'
import type { SceneCallbacks } from '../DeliveryGameScene'
import { COLS, ROWS, TILE } from '../data/deliveryConfig'

export type { HUDState, InspectData } from '../data/deliveryConfig'

export type DeliveryGameOptions = {
  onGameEnd?: (result: 'win' | 'lose', deliveries: number, timeRemaining: number) => void
  onHUDUpdate?: SceneCallbacks['onHUDUpdate']
  onInspectPackage?: SceneCallbacks['onInspectPackage']
  onInspectHouse?: SceneCallbacks['onInspectHouse']
}

export type DeliveryGameAPI = {
  inspectHeldPackage: () => void
  inspectNearHouse: () => void
  resumeFromInspection: () => void
  destroy: () => void
}

export function createDeliveryGame(
  parent: HTMLDivElement,
  options: DeliveryGameOptions = {},
): DeliveryGameAPI {
  const callbacks: SceneCallbacks = {
    onGameEnd:        options.onGameEnd        ?? (() => {}),
    onHUDUpdate:      options.onHUDUpdate      ?? (() => {}),
    onInspectPackage: options.onInspectPackage ?? (() => {}),
    onInspectHouse:   options.onInspectHouse   ?? (() => {}),
  }

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

  game.scene.add('DeliveryGameScene', DeliveryGameScene, true, callbacks)

  const getScene = (): DeliveryGameScene | null =>
    game.scene.getScene('DeliveryGameScene') as DeliveryGameScene | null

  return {
    inspectHeldPackage:   () => getScene()?.inspectHeldPackage(),
    inspectNearHouse:     () => getScene()?.inspectNearHouse(),
    resumeFromInspection: () => getScene()?.resumeFromInspection(),
    destroy:              () => game.destroy(true, false),
  }
}
