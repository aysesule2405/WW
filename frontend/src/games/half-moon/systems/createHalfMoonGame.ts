import Phaser from 'phaser'
import { HalfMoonScene } from '../HalfMoonScene'
import type { SceneCallbacks } from '../HalfMoonScene'
import type { Difficulty, AIMode, WildCardType } from '../data/halfMoonConfig'

export type { ScoreState } from '../data/halfMoonConfig'

export type HalfMoonOptions = {
  difficulty?: Difficulty
  aiMode?:     AIMode
  level?:      number
  onLevelEnd?:    SceneCallbacks['onLevelEnd']
  onScoreUpdate?: SceneCallbacks['onScoreUpdate']
  onEvent?:       SceneCallbacks['onEvent']
  onHandUpdate?:  SceneCallbacks['onHandUpdate']
  onTurnChange?:  SceneCallbacks['onTurnChange']
}

export type HalfMoonAPI = {
  startLevel:    (level: number) => void
  activateWild:  (type: WildCardType) => void
  destroy:       () => void
}

export const VP_W = 960
export const VP_H = 620

export function createHalfMoonGame(
  parent: HTMLDivElement,
  options: HalfMoonOptions = {},
): HalfMoonAPI {
  const difficulty = options.difficulty ?? 'medium'
  const aiMode     = options.aiMode     ?? 'local'
  const level      = options.level      ?? 1

  const callbacks: SceneCallbacks = {
    onLevelEnd:    options.onLevelEnd    ?? (() => {}),
    onScoreUpdate: options.onScoreUpdate ?? (() => {}),
    onEvent:       options.onEvent       ?? (() => {}),
    onHandUpdate:  options.onHandUpdate  ?? (() => {}),
    onTurnChange:  options.onTurnChange  ?? (() => {}),
  }

  const initData = { ...callbacks, difficulty, aiMode, level }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width:  VP_W,
    height: VP_H,
    backgroundColor: '#060C1A',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: { keyboard: false },
    audio: { disableWebAudio: true },
    scene: [],
  })

  game.scene.add('HalfMoonScene', HalfMoonScene, true, initData)

  const getScene = (): HalfMoonScene | null =>
    game.scene.getScene('HalfMoonScene') as HalfMoonScene | null

  return {
    startLevel:   (level) => getScene()?.startLevel(level, difficulty, aiMode),
    activateWild: (type)  => getScene()?.activateWild(type),
    destroy:      ()      => game.destroy(true, false),
  }
}
