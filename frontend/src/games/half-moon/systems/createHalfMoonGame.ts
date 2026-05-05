import Phaser from 'phaser'
import { HalfMoonScene } from '../HalfMoonScene'
import type { SceneCallbacks } from '../HalfMoonScene'
import type { Difficulty, WildCardType } from '../data/halfMoonConfig'

export type { ScoreState } from '../data/halfMoonConfig'

export type HalfMoonOptions = {
  difficulty?: Difficulty
  onLevelEnd?:    SceneCallbacks['onLevelEnd']
  onScoreUpdate?: SceneCallbacks['onScoreUpdate']
  onEvent?:       SceneCallbacks['onEvent']
  onHandUpdate?:  SceneCallbacks['onHandUpdate']
  onTurnChange?:  SceneCallbacks['onTurnChange']
}

export type HalfMoonAPI = {
  startLevel: (level: number) => void
  activateWild: (type: WildCardType) => void
  destroy: () => void
}

export const VP_W = 960
export const VP_H = 620

export function createHalfMoonGame(
  parent: HTMLDivElement,
  options: HalfMoonOptions = {},
): HalfMoonAPI {
  const difficulty = options.difficulty ?? 'medium'

  const callbacks: SceneCallbacks = {
    onLevelEnd:    options.onLevelEnd    ?? (() => {}),
    onScoreUpdate: options.onScoreUpdate ?? (() => {}),
    onEvent:       options.onEvent       ?? (() => {}),
    onHandUpdate:  options.onHandUpdate  ?? (() => {}),
    onTurnChange:  options.onTurnChange  ?? (() => {}),
  }

  const initData = { ...callbacks, difficulty, level: 1 }

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
    input: { keyboard: false },   // this game is pointer-only
    audio: { disableWebAudio: true },
    scene: [],
  })

  game.scene.add('HalfMoonScene', HalfMoonScene, true, initData)

  const getScene = (): HalfMoonScene | null =>
    game.scene.getScene('HalfMoonScene') as HalfMoonScene | null

  return {
    startLevel: (level) => getScene()?.startLevel(level, difficulty),
    activateWild: (type) => getScene()?.activateWild(type),
    destroy: () => game.destroy(true, false),
  }
}
