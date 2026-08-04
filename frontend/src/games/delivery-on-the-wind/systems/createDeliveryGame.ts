import Phaser from 'phaser'
import { DeliveryGameScene } from '../DeliveryGameScene'
import type { SceneCallbacks } from '../DeliveryGameScene'
import { VIEWPORT_W, VIEWPORT_H } from '../data/deliveryConfig'
import { getMapConfig } from '../data/mapRegistry'

export type { HUDState, InspectData, NpcTalkData } from '../data/deliveryConfig'

export type DeliveryGameOptions = {
  onGameEnd?: (result: 'win' | 'lose', deliveries: number, timeRemaining: number) => void
  onHUDUpdate?: SceneCallbacks['onHUDUpdate']
  onInspectPackage?: SceneCallbacks['onInspectPackage']
  onInspectHouse?: SceneCallbacks['onInspectHouse']
  onTalkNpc?: SceneCallbacks['onTalkNpc']
}

export type DeliveryGameAPI = {
  inspectHeldPackage: () => void
  inspectNearHouse: () => void
  talkNearNpc: () => void
  resumeFromInspection: () => void
  setZoom: (zoom: number) => void
  destroy: () => void
}

export function createDeliveryGame(
  parent: HTMLDivElement,
  options: DeliveryGameOptions = {},
  mapId = 'meadow',
): DeliveryGameAPI {
  const callbacks: SceneCallbacks = {
    onGameEnd:        options.onGameEnd        ?? (() => {}),
    onHUDUpdate:      options.onHUDUpdate      ?? (() => {}),
    onInspectPackage: options.onInspectPackage ?? (() => {}),
    onInspectHouse:   options.onInspectHouse   ?? (() => {}),
    onTalkNpc:        options.onTalkNpc        ?? (() => {}),
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width:  VIEWPORT_W,
    height: VIEWPORT_H,
    backgroundColor: '#3A6820',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: { keyboard: true },
    audio: { disableWebAudio: false },
    scene: [],
  })

  const mapCfg = getMapConfig(mapId)
  game.scene.add('DeliveryGameScene', DeliveryGameScene, true, { callbacks, mapCfg })

  const getScene = (): DeliveryGameScene | null =>
    game.scene.getScene('DeliveryGameScene') as DeliveryGameScene | null

  return {
    inspectHeldPackage:   () => getScene()?.inspectHeldPackage(),
    inspectNearHouse:     () => getScene()?.inspectNearHouse(),
    talkNearNpc:          () => getScene()?.talkNearNpc(),
    resumeFromInspection: () => getScene()?.resumeFromInspection(),
    setZoom:              (zoom) => getScene()?.setCameraZoom(zoom),
    destroy:              () => game.destroy(true, false),
  }
}
