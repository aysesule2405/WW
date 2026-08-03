import Phaser from 'phaser'
import {
  TILE, HOUSE_SIZE, TILE_RULES, isTileAirPassable,
  VIEWPORT_W, VIEWPORT_H,
  NPC_CONFIGS,
  DELIVERY_TYPES, CORRECT_MESSAGES, WRONG_MESSAGES,
} from './data/deliveryConfig'
import type { TileType, HUDState, InspectData, NpcTalkData } from './data/deliveryConfig'
import type { MapConfig } from './data/mapRegistry'
import { Player } from './entities/Player'
import { Package } from './entities/Package'
import { House } from './entities/House'
import { Npc } from './entities/Npc'
import { audioManager } from '../../lib/AudioManager'
import { uiFontFamily } from '../../theme/typography'

const SFX = {
  pickup:   '/assets/audio/sfx/delivery/pickup.mp3',
  deliver:  '/assets/audio/sfx/delivery/deliver.mp3',
  wrong:    '/assets/audio/sfx/delivery/wrong.mp3',
  footstep: '/assets/audio/sfx/delivery/footstep.mp3',
  tick:     '/assets/audio/sfx/delivery/tick.mp3',
  win:      '/assets/audio/sfx/delivery/win.mp3',
  lose:     '/assets/audio/sfx/delivery/lose.mp3',
  interact: '/assets/audio/sfx/delivery/interact.mp3',
  talk:     '/assets/audio/sfx/delivery/talk.mp3',
  wind:     '/assets/audio/sfx/delivery/wind.mp3',
} as const

export type SceneCallbacks = {
  onGameEnd: (result: 'win' | 'lose', deliveries: number, timeRemaining: number) => void
  onHUDUpdate: (state: HUDState) => void
  onInspectPackage: (data: InspectData) => void
  onInspectHouse: (data: InspectData) => void
  onTalkNpc: (data: NpcTalkData) => void
}

const HUD_H      = 40
const BASE_MOVE  = 115               // ms per tile on grass

export class DeliveryGameScene extends Phaser.Scene {
  private cb!: SceneCallbacks
  private mapCfg!: MapConfig
  private worldW = 0
  private worldH = 0

  private player!: Player
  private packages: Package[] = []
  private houses:   House[]   = []
  private npcs:     Npc[]     = []

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private moveRepeatTimer = 0
  private readonly MOVE_REPEAT = 150

  private timeLeftMs    = 0
  private deliveredCount = 0
  private running        = false
  private timerPaused    = false
  private nearHouseIdx   = -1
  private nearNpcIdx     = -1

  private timerText!:    Phaser.GameObjects.Text
  private deliveryText!: Phaser.GameObjects.Text
  private holdText!:     Phaser.GameObjects.Text
  private holdSwatch!:   Phaser.GameObjects.Graphics
  private timerBar!:     Phaser.GameObjects.Graphics
  private hudContainer!: Phaser.GameObjects.Container
  private waterShimmers: Phaser.GameObjects.Image[] = []
  private waterFrame = 0

  private correctMsgIdx = 0
  private wrongMsgIdx   = 0

  constructor() { super({ key: 'DeliveryGameScene' }) }

  init(data: { callbacks: SceneCallbacks; mapCfg: MapConfig }) {
    this.cb             = data.callbacks
    this.mapCfg         = data.mapCfg
    this.timeLeftMs     = data.mapCfg.gameDurationMs
    this.deliveredCount = 0
    this.running        = false
    this.timerPaused    = false
    this.nearHouseIdx   = -1
    this.nearNpcIdx     = -1
    this.packages       = []
    this.houses         = []
    this.npcs           = []
    this.correctMsgIdx  = 0
    this.wrongMsgIdx    = 0
    this.waterShimmers  = []
    this.waterFrame     = 0
  }

  preload() {
    this.load.spritesheet('kiki-animated', '/assets/backgrounds/delivery-on-the-wind/kiki-animated.png', {
      frameWidth: 256,
      frameHeight: 256,
    })
    for (let i = 1; i <= 4; i++) {
      this.load.image(`house-${i}`,   `/assets/new_tiles/house_${i}.png`)
      this.load.image(`package-${i}`, `/assets/backgrounds/delivery-on-the-wind/package-${i}-pixel.png`)
    }
    for (const cfg of NPC_CONFIGS) {
      this.load.spritesheet(`npc-${cfg.assetKey}-animated`, `/assets/npcs/${cfg.assetKey}-animated.png`, {
        frameWidth: 256,
        frameHeight: 256,
      })
    }
    if (this.mapCfg.worldImage) this.load.image('delivery-world-map', this.mapCfg.worldImage)

    // All tiles from new_tiles (16×16 ground fills + overlays)
    // key → file in /assets/new_tiles/
    const TILE_MAP: [string, string][] = [
      // ground fills
      ['tile-grass',             'grass.png'],
      ['tile-grass_alt',         'medium_grass.png'],
      ['tile-medium_grass',      'medium_grass.png'],
      ['tile-dark_grass',        'dark_grass.png'],
      ['tile-moss_grass',        'moss_grass.png'],
      ['tile-dark_grass_leaves', 'dark_grass_leaves.png'],
      ['tile-grass_flowers',     'grass_flowers_1.png'],
      ['tile-grass_flowers_2',   'grass_flowers_2.png'],
      ['tile-grass_flowers_3',   'grass_flowers_3.png'],
      ['tile-grass_patch',       'grass_patch_1.png'],
      ['tile-grass_patch_2',     'grass_patch_2.png'],
      ['tile-soil',              'soil.png'],
      ['tile-tilled_soil',       'soil.png'],
      ['tile-stone_path',        'stone_path_1.png'],
      ['tile-stone_path_2',      'stone_path_2.png'],
      ['tile-stone_path_3',      'stone_path_3.png'],
      ['tile-stone_path_4',      'stone_path_4.png'],
      ['tile-stone-path-fixed',  'stone_path_fixed.png'],
      ['tile-path',              'stone_path_1.png'],
      ['tile-path_alt',          'stone_path_2.png'],
      ['tile-water',             'water_1.png'],
      ['tile-water_alt',         'water_2.png'],
      ['tile-water_grass',       'water_grass.png'],
      ['tile-ocean_shore',       'water_grass.png'],
      ['tile-water_stones',      'water_stones.png'],
      ['tile-water_shell',       'water_shell.png'],
      ['tile-wildflowers',       'grass_flowers_2.png'],
      ['tile-lavender',          'medium_grass_flowers_1.png'],
      ['tile-mushroom_patch',    'dark_grass_group.png'],
      ['tile-moss',              'moss_grass.png'],
      ['tile-fallen_leaves',     'dark_grass_leaves.png'],
      ['tile-swamp',             'water_grass.png'],
      // overlay sprites
      ['tile-tree',              'tree_1.png'],
      ['tile-tree_alt',          'tree_2.png'],
      ['tile-tree_dense',        'tree_3.png'],
      ['tile-stone',             'stone_path_4.png'],
      ['tile-tree_round',        'tree_1.png'],
      ['tile-tree_fruit',        'tree_2.png'],
      ['tile-tree_pine',         'tree_3.png'],
      ['tile-mystical_tree',     'mystical_tree.png'],
      ['tile-small_bush',        'small_bush.png'],
      ['tile-large_bush',        'large_bush.png'],
      ['tile-magic_tower',       'magic_tower.png'],
      ['tile-old_town_hall',     'old_town_hall.png'],
      ['tile-old_truck',         'old_truck.png'],
      ['tile-tunnel',            'secret_tunel.png'],
      ['tile-bridge',             'bridge_1.png'],
      ['tile-bridge_alt',         'bridge_2.png'],
      ['tile-horizontal-bridge-left',  'horizontal_bridge_left.png'],
      ['tile-horizontal-bridge-right', 'horizontal_bridge_right.png'],
      ['tile-town-square',        'town_square.png'],
      // kept from old tiles (no new_tiles equivalent)
      ['tile-wind_gust', '/assets/tiles/wind_gust.png'],
      ['tile-crop_seedling', '/assets/tiles/crop_seedling.png'],
      ['tile-crop_bloom',    '/assets/tiles/crop_bloom.png'],
    ]
    for (const [key, path] of TILE_MAP) {
      const url = path.startsWith('/') ? path : `/assets/new_tiles/${path}`
      this.load.image(key, url)
    }
    audioManager.preload(Object.values(SFX), 3)
  }

  create() {
    this.worldW = this.mapCfg.cols * TILE
    this.worldH = this.mapCfg.rows * TILE

    // Pixel texture for particles
    const pg = this.add.graphics().setVisible(false)
    pg.fillStyle(0xffffff)
    pg.fillRect(0, 0, 4, 4)
    pg.generateTexture('pixel', 4, 4)
    pg.destroy()
    this.createPixelFrameTextures()

    // The player can change this bounded zoom from the React controls. The HUD
    // counter-scales in sync so its timer and delivery count never get clipped.
    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH)
    this.cameras.main.setZoom(1)
    this.cameras.main.roundPixels = true

    if (!this.mapCfg.worldImage) this.upscaleGroundTiles()
    this.drawTiles()
    this.createAtmosphere()
    this.spawnEntities()

    // Keep Kiki centered while the map scrolls underneath her.
    this.cameras.main.startFollow(this.player.cameraTarget, true, 1, 1)

    this.buildHUD()
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.running = true
    this.emitHUDUpdate()
  }

  // ── Inspection API ────────────────────────────────────────────────────────────

  inspectHeldPackage() {
    if (!this.player.heldType) return
    const cfg = DELIVERY_TYPES.find(d => d.type === this.player.heldType)
    if (!cfg) return
    audioManager.play(SFX.interact, 0.65)
    this.timerPaused = true
    this.cb.onInspectPackage({
      kind: 'package', type: cfg.type, imageIndex: cfg.imageIndex,
      label: cfg.label, colorHex: cfg.colorHex, hint: cfg.hint,
    })
  }

  inspectNearHouse() {
    if (this.nearHouseIdx < 0) return
    const house = this.houses[this.nearHouseIdx]
    const cfg   = DELIVERY_TYPES.find(d => d.type === house.type)
    if (!cfg) return
    audioManager.play(SFX.interact, 0.65)
    this.timerPaused = true
    this.cb.onInspectHouse({
      kind: 'house', type: cfg.type, imageIndex: cfg.imageIndex,
      label: cfg.label, colorHex: cfg.colorHex, hint: cfg.hint,
    })
  }

  talkNearNpc() {
    if (this.nearNpcIdx < 0) return
    const npc = this.npcs[this.nearNpcIdx]
    audioManager.play(SFX.talk, 0.7)
    const heldCfg = this.player.heldType
      ? DELIVERY_TYPES.find(d => d.type === this.player.heldType) ?? null
      : null
    const destination = heldCfg
      ? this.houses.find(house => !house.isDelivered && house.type === heldCfg.type) ?? null
      : null
    const line = heldCfg && destination
      ? this.buildNpcDeliveryHint(npc, heldCfg.label, destination.gridX, destination.gridY)
      : npc.config.emptyLine
    this.timerPaused = true
    this.cb.onTalkNpc({
      id: npc.id,
      name: npc.name,
      assetKey: npc.config.assetKey,
      role: npc.config.role,
      line,
      heldLabel: heldCfg?.label ?? null,
      heldColorHex: heldCfg?.colorHex ?? null,
    })
  }

  private buildNpcDeliveryHint(npc: Npc, label: string, houseCol: number, houseRow: number): string {
    const route = this.describeRouteToHouse(houseCol, houseRow)
    const housePosition = this.describeHousePosition(houseCol, houseRow)

    switch (npc.id) {
      case 'jiji':
        return `${label} belongs to the ${housePosition}. ${route} Keep your eyes on the house ring, not just the scenery.`
      case 'tombo':
        return `${label}? Flight plan says ${housePosition}. ${route} Nice clean route if you hold the line.`
      case 'ursula':
        return `That package is pulling toward the ${housePosition}. ${route} Follow the colors and do not rush the turn.`
      case 'madame-barsa':
        return `${label} should be delivered to the ${housePosition}, dear. ${route} Barsa says the ring will confirm it.`
      default:
        return `${label} belongs to the ${housePosition}. ${route}`
    }
  }

  private describeHousePosition(houseCol: number, houseRow: number): string {
    const centerCol = houseCol + Math.floor(HOUSE_SIZE / 2)
    const centerRow = houseRow + Math.floor(HOUSE_SIZE / 2)
    const vertical = centerRow < this.mapCfg.rows / 2 ? 'north' : 'south'
    const horizontal = centerCol < this.mapCfg.cols / 2 ? 'west' : 'east'
    return `${vertical}-${horizontal} cottage`
  }

  private describeRouteToHouse(houseCol: number, houseRow: number): string {
    const path = this.findFlightPathToHouse(houseCol, houseRow)
    if (path.length < 2) return 'Circle the cottage and approach its glowing delivery ring.'

    const segments: Array<{ direction: string; steps: number }> = []
    for (let index = 1; index < path.length; index++) {
      const dx = path[index].col - path[index - 1].col
      const dy = path[index].row - path[index - 1].row
      const direction = dx < 0 ? 'west' : dx > 0 ? 'east' : dy < 0 ? 'north' : 'south'
      const previous = segments[segments.length - 1]
      if (previous?.direction === direction) previous.steps++
      else segments.push({ direction, steps: 1 })
    }

    const directions = segments.slice(0, 3).map(({ direction, steps }, index) => {
      const distance = steps <= 3 ? 'a short way' : steps <= 8 ? 'through the next clearing' : 'across the village'
      return `${index === 0 ? 'fly' : 'then turn'} ${direction} ${distance}`
    })
    const instruction = `${directions.join(', ')}.`
    return `${instruction[0].toUpperCase()}${instruction.slice(1)} The route can cross open water and bends around solid trees and buildings.`
  }

  private findFlightPathToHouse(houseCol: number, houseRow: number): Array<{ col: number; row: number }> {
    const key = (col: number, row: number) => `${col},${row}`
    const targets = new Set<string>()
    for (let row = houseRow - 1; row <= houseRow + HOUSE_SIZE; row++) {
      for (let col = houseCol - 1; col <= houseCol + HOUSE_SIZE; col++) {
        if (!this.isHouseFootprint(col, row) && this.isCellAirPassable(col, row)) targets.add(key(col, row))
      }
    }

    const start = { col: this.player.gridX, row: this.player.gridY }
    const startKey = key(start.col, start.row)
    const queue = [start]
    const parents = new Map<string, string | null>([[startKey, null]])
    const points = new Map<string, { col: number; row: number }>([[startKey, start]])
    const targetCenter = { col: houseCol + HOUSE_SIZE / 2, row: houseRow + HOUSE_SIZE / 2 }
    let destinationKey: string | null = targets.has(startKey) ? startKey : null

    for (let index = 0; index < queue.length && destinationKey === null; index++) {
      const current = queue[index]
      const neighbors = [
        { col: current.col + 1, row: current.row },
        { col: current.col - 1, row: current.row },
        { col: current.col, row: current.row + 1 },
        { col: current.col, row: current.row - 1 },
      ].sort((a, b) =>
        Math.abs(a.col - targetCenter.col) + Math.abs(a.row - targetCenter.row) -
        (Math.abs(b.col - targetCenter.col) + Math.abs(b.row - targetCenter.row)),
      )

      for (const next of neighbors) {
        const nextKey = key(next.col, next.row)
        if (parents.has(nextKey) || !this.isCellAirPassable(next.col, next.row)) continue
        parents.set(nextKey, key(current.col, current.row))
        points.set(nextKey, next)
        queue.push(next)
        if (targets.has(nextKey)) {
          destinationKey = nextKey
          break
        }
      }
    }

    if (!destinationKey) return []
    const path: Array<{ col: number; row: number }> = []
    for (let cursor: string | null = destinationKey; cursor !== null; cursor = parents.get(cursor) ?? null) {
      const point = points.get(cursor)
      if (point) path.push(point)
    }
    return path.reverse()
  }

  resumeFromInspection() { this.timerPaused = false }

  setCameraZoom(value: number) {
    const zoom = Phaser.Math.Clamp(value, 0.75, 1.5)
    this.cameras.main.zoomTo(zoom, 220, 'Sine.easeInOut', true)
  }

  // ── Tile map ──────────────────────────────────────────────────────────────────

  private drawTiles() {
    if (this.mapCfg.worldImage && this.textures.exists('delivery-world-map')) {
      this.add.image(0, 0, 'delivery-world-map')
        .setOrigin(0, 0)
        .setDisplaySize(this.worldW, this.worldH)
        .setDepth(0)
      return
    }

    // Bake all tiles into a single RenderTexture for best performance
    const rt = this.add.renderTexture(0, 0, this.worldW, this.worldH).setDepth(0).setOrigin(0, 0)
    const flippedShore = this.make.image({ key: 'tile-ocean_shore', add: false }).setOrigin(0, 0).setFlipY(true)

    for (let row = 0; row < this.mapCfg.rows; row++) {
      for (let col = 0; col < this.mapCfg.cols; col++) {
        this.drawGroundTile(rt, row, col, flippedShore)
      }
    }

    for (let row = 0; row < this.mapCfg.rows; row++) {
      for (let col = 0; col < this.mapCfg.cols; col++) {
        this.drawOverlayTile(rt, row, col)
      }
    }

    flippedShore.destroy()
  }

  // Tiles drawn as overlays — base ground is drawn first, then the sprite on top.
  private static readonly OVERLAY_BASE: Partial<Record<TileType, 'grass' | 'tilled_soil' | 'path' | 'bridge'>> = {
    // legacy overlays
    tree:           'grass',
    tree_dense:     'grass',
    stone:          'grass',
    fallen_leaves:  'grass',
    wildflowers:    'grass',
    lavender:       'grass',
    mushroom_patch: 'grass',
    moss:           'grass',
    wind_gust:      'path',
    crop_seedling:  'tilled_soil',
    crop_bloom:     'tilled_soil',
    // new tree overlays
    tree_round:     'grass',
    tree_fruit:     'grass',
    tree_pine:      'grass',
    mystical_tree:  'grass',
    // new decoration overlays
    small_bush:     'grass',
    large_bush:     'grass',
    magic_tower:    'grass',
    old_town_hall:  'grass',
    old_truck:      'grass',
    tunnel:         'grass',
    town_square:    'path',
    horizontal_bridge_left:  'bridge',
    horizontal_bridge_right: 'bridge',
    // dark_grass_leaves is a full-fill tile, not an overlay
  }

  // Per-sprite pixel offset [dx, dy] — bottom-centre each sprite in its 16px cell.
  // Formula: dx = (TILE - spriteW) / 2,  dy = TILE - spriteH  (TILE = 16)
  //
  // Trees (48×96) → 3 cols wide × 6 rows tall = 18 tiles.
  // Canopy bleeds into the 5 rows above; those rows were already drawn so
  // the canopy correctly overlays them.
  private static readonly SPRITE_OFFSET: Partial<Record<TileType, [number, number]>> = {
    tree:          [0,   -80],  // 48×96  → dy = 16-96 = -80
    tree_dense:    [0,   -80],
    tree_round:    [0,   -80],
    tree_fruit:    [0,   -80],
    tree_pine:     [0,   -80],
    mystical_tree: [-37, -96],  // 90×112 → dx=(16-90)/2=-37, dy=16-112=-96
    small_bush:    [-8,  -16],  // 32×32  → dx=(16-32)/2=-8,  dy=16-32=-16
    large_bush:    [-16, -32],  // 48×48  → dx=(16-48)/2=-16, dy=16-48=-32
    magic_tower:   [-24,-176],  // 64×192 → dx=(16-64)/2=-24, dy=16-192=-176
    old_town_hall: [-88,-144],  // 192×160 → dx=(16-192)/2=-88, dy=16-160=-144
    old_truck:     [-24, -82],  // 63×98  → dx≈-24, dy=16-98=-82
    tunnel:        [-8,  -32],  // 32×48  → dx=-8,  dy=16-48=-32
    town_square:   [0,     0],  // 96×96  → marker is the top-left tile
    horizontal_bridge_left:  [0, 0], // 80×48 → top-left marker
    horizontal_bridge_right: [0, 0], // 48×48 → top-left marker
  }

  private drawGroundTile(
    rt: Phaser.GameObjects.RenderTexture,
    row: number,
    col: number,
    flippedShore: Phaser.GameObjects.Image,
  ) {
    const tile = this.mapCfg.tiles[row][col]
    const x = col * TILE
    const y = row * TILE

    const base = DeliveryGameScene.OVERLAY_BASE[tile]
    if (base) {
      rt.draw(this.baseKey(base, row, col), x, y)
      return
    }

    if (tile === 'ocean_shore' && this.isLowerShore(row, col)) {
      rt.draw(flippedShore, x, y)
      return
    }

    rt.draw(this.tileKey(tile, row, col), x, y)
  }

  private drawOverlayTile(rt: Phaser.GameObjects.RenderTexture, row: number, col: number) {
    const tile = this.mapCfg.tiles[row][col]
    if (!DeliveryGameScene.OVERLAY_BASE[tile]) return

    const x = col * TILE
    const y = row * TILE
    const [dx, dy] = DeliveryGameScene.SPRITE_OFFSET[tile] ?? [0, 0]
    rt.draw(this.tileKey(tile, row, col), x + dx, y + dy)
  }

  private baseKey(base: 'grass' | 'tilled_soil' | 'path' | 'bridge', row: number, col: number): string {
    if (base === 'tilled_soil') return 'tile-tilled_soil'
    if (base === 'path') return this.stonePathKey(row, col)
    if (base === 'bridge') return (row + col) % 2 === 0 ? 'tile-bridge_48' : 'tile-bridge-alt_48'
    return this.grassTileKey(row, col)
  }

  // Copy 16×16 new-tile PNGs into canvas textures used by the renderer.
  // Called once in create() before drawTiles() — fast canvas operation.
  private upscaleGroundTiles(): void {
    const keys16 = [
      'tile-grass',             'tile-grass_alt',     'tile-medium_grass',
      'tile-dark_grass',        'tile-moss_grass',     'tile-dark_grass_leaves',
      'tile-grass_flowers',     'tile-grass_flowers_2','tile-grass_flowers_3',
      'tile-grass_patch',       'tile-grass_patch_2',  'tile-soil',
      'tile-tilled_soil',       'tile-stone_path',     'tile-stone_path_2',
      'tile-stone_path_3',      'tile-stone_path_4',   'tile-path',
      'tile-path_alt',          'tile-water',          'tile-water_alt',
      'tile-water_grass',       'tile-ocean_shore',    'tile-water_stones',
      'tile-water_shell',       'tile-wildflowers',    'tile-lavender',
      'tile-mushroom_patch',    'tile-moss',           'tile-fallen_leaves',
      'tile-swamp',             'tile-bridge',         'tile-bridge-alt',
    ]
    for (const key of keys16) {
      const scaledKey = `${key}_48`
      if (this.textures.exists(scaledKey)) continue
      if (!this.textures.exists(key)) continue
      const src = this.textures.get(key).getSourceImage() as HTMLImageElement
      const cv  = this.textures.createCanvas(scaledKey, TILE, TILE)
      if (!cv) continue
      cv.context.imageSmoothingEnabled = false
      cv.context.drawImage(src, 0, 0, TILE, TILE)
      cv.refresh()
    }

    // stone_path_fixed.png is a seamless 2×2 tile block. Split it into four
    // native 16px canvas textures so paths repeat without shrinking the source.
    if (this.textures.exists('tile-stone-path-fixed')) {
      const source = this.textures.get('tile-stone-path-fixed').getSourceImage() as HTMLImageElement
      for (let frame = 0; frame < 4; frame++) {
        const key = `tile-stone-path-fixed-${frame}`
        if (this.textures.exists(key)) continue
        const canvas = this.textures.createCanvas(key, TILE, TILE)
        if (!canvas) continue
        canvas.context.imageSmoothingEnabled = false
        canvas.context.drawImage(
          source,
          (frame % 2) * TILE,
          Math.floor(frame / 2) * TILE,
          TILE,
          TILE,
          0,
          0,
          TILE,
          TILE,
        )
        canvas.refresh()
      }
    }
  }

  private isLowerShore(row: number, col: number): boolean {
    const tileAbove = this.mapCfg.tiles[row - 1]?.[col]
    return tileAbove === 'water' || tileAbove === 'water_alt' || tileAbove === 'bridge'
  }

  private grassTileKey(row: number, col: number): string {
    return (row + col) % 2 === 0 ? 'tile-grass_48' : 'tile-medium_grass_48'
  }

  private stonePathKey(row: number, col: number): string {
    return `tile-stone-path-fixed-${(row % 2) * 2 + (col % 2)}`
  }

  private tileKey(tile: TileType, row: number, col: number): string {
    const idx = (row * this.mapCfg.cols + col) % 4
    switch (tile) {
      // grass variants — rotate for visual variety
      // 16×16 ground fills — return upscaled _48 canvas key
      case 'grass':
        return idx < 2 ? 'tile-grass_48' : 'tile-medium_grass_48'
      case 'medium_grass':      return 'tile-medium_grass_48'
      case 'dark_grass':        return 'tile-dark_grass_48'
      case 'moss_grass':        return 'tile-moss_grass_48'
      case 'dark_grass_leaves': return 'tile-dark_grass_leaves_48'
      case 'grass_flowers':
        return ['tile-grass_flowers_48','tile-grass_flowers_2_48','tile-grass_flowers_3_48','tile-grass_flowers_48'][idx]
      case 'grass_patch':
        return idx % 2 === 0 ? 'tile-grass_patch_48' : 'tile-grass_patch_2_48'
      case 'stone_path':
      case 'path':              return this.stonePathKey(row, col)
      case 'soil':
      case 'tilled_soil':       return 'tile-soil_48'
      case 'crop_seedling':     return 'tile-crop_seedling'
      case 'crop_bloom':        return 'tile-crop_bloom'
      case 'water':             return 'tile-water_48'
      case 'water_alt':         return 'tile-water_alt_48'
      case 'water_grass':
      case 'ocean_shore':
      case 'swamp':             return 'tile-water_grass_48'
      case 'water_stones':      return 'tile-water_stones_48'
      case 'water_shell':       return 'tile-water_shell_48'
      case 'bridge':
        return (row + col) % 2 === 0 ? 'tile-bridge_48' : 'tile-bridge-alt_48'
      case 'horizontal_bridge_left':  return 'tile-horizontal-bridge-left'
      case 'horizontal_bridge_right': return 'tile-horizontal-bridge-right'
      case 'town_square':              return 'tile-town-square'
      case 'wind_gust':         return 'tile-wind_gust'
      case 'wildflowers':       return 'tile-wildflowers_48'
      case 'lavender':          return 'tile-lavender_48'
      case 'mushroom_patch':    return 'tile-mushroom_patch_48'
      case 'moss':              return 'tile-moss_48'
      case 'fallen_leaves':     return 'tile-fallen_leaves_48'
      case 'stone':             return 'tile-stone'
      // trees
      case 'tree':
        return idx < 2 ? 'tile-tree' : 'tile-tree_alt'
      case 'tree_dense':    return 'tile-tree_dense'
      case 'tree_round':    return 'tile-tree_round'
      case 'tree_fruit':    return 'tile-tree_fruit'
      case 'tree_pine':     return 'tile-tree_pine'
      case 'mystical_tree': return 'tile-mystical_tree'
      // decorations
      case 'small_bush':    return 'tile-small_bush'
      case 'large_bush':    return 'tile-large_bush'
      case 'magic_tower':   return 'tile-magic_tower'
      case 'old_town_hall': return 'tile-old_town_hall'
      case 'old_truck':     return 'tile-old_truck'
      case 'tunnel':        return 'tile-tunnel'
      default:              return 'tile-grass'
    }
  }

  // ── Atmosphere ────────────────────────────────────────────────────────────────

  private createAtmosphere() {
    const motionEnabled = typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!motionEnabled) return

    this.createWaterAnimation()

    // Screen-space wind particles (scrollFactor 0 = fixed to camera)
    this.add.particles(VIEWPORT_W / 2, VIEWPORT_H / 2, 'pixel', {
      x: { min: -VIEWPORT_W / 2, max: VIEWPORT_W / 2 },
      y: { min: -VIEWPORT_H / 2, max: VIEWPORT_H / 2 },
      speedX: { min: 20, max: 60 },
      speedY: { min: -8, max: 8 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.28, end: 0 },
      lifespan: { min: 2000, max: 3600 },
      frequency: 240,
      tint: [0xDDE5B6, 0xFFFFDD, 0xAACC88, 0xFFFFAA],
    }).setDepth(8).setScrollFactor(0)
  }

  private createPixelFrameTextures() {
    const waterFrames: Array<Array<[number, number, number, number]>> = [
      [[2, 7, 5, 1], [10, 4, 2, 1], [12, 10, 1, 1]],
      [[3, 7, 5, 1], [9, 5, 3, 1], [1, 11, 2, 1]],
      [[5, 7, 5, 1], [8, 4, 2, 1], [12, 11, 2, 1]],
      [[3, 7, 5, 1], [10, 3, 3, 1], [2, 10, 1, 1]],
    ]
    const sparkleFrames: Array<Array<[number, number, number]>> = [
      [[6, 8, 2], [39, 17, 1]],
      [[10, 5, 1], [36, 12, 2], [42, 31, 1]],
      [[7, 12, 1], [32, 7, 1], [40, 25, 2]],
      [[4, 18, 1], [35, 10, 1], [43, 20, 1]],
    ]

    const graphics = this.add.graphics().setVisible(false)
    waterFrames.forEach((pixels, frame) => {
      const key = `water-shimmer-${frame}`
      if (this.textures.exists(key)) return
      graphics.clear()
      graphics.fillStyle(frame % 2 === 0 ? 0xc9fbff : 0x89e7ee, 1)
      pixels.forEach(([x, y, width, height]) => graphics.fillRect(x, y, width, height))
      graphics.generateTexture(key, 16, 16)
    })
    sparkleFrames.forEach((pixels, frame) => {
      const key = `package-sparkle-${frame}`
      if (this.textures.exists(key)) return
      graphics.clear()
      graphics.fillStyle(0xfff4b5, 1)
      pixels.forEach(([x, y, size]) => {
        graphics.fillRect(x, y, size, size)
        if (size > 1) {
          graphics.fillRect(x - 1, y + 1, size + 2, 1)
          graphics.fillRect(x + 1, y - 1, 1, size + 2)
        }
      })
      graphics.generateTexture(key, 48, 48)
    })
    graphics.destroy()
  }

  private createWaterAnimation() {
    const waterTiles = new Set<TileType>([
      'water', 'water_alt', 'water_grass', 'water_stones', 'water_shell',
      'ocean_shore', 'swamp',
    ])
    const colorByBiome: Record<string, number> = {
      meadow: 0x9de8ef,
      forest: 0x72d8c4,
      coastal: 0xc5fbff,
      mountain: 0xaed8ff,
    }
    const rippleColor = colorByBiome[this.mapCfg.id] ?? 0xbcecf2
    let shimmerCount = 0

    for (let row = 0; row < this.mapCfg.rows && shimmerCount < 64; row++) {
      for (let col = 0; col < this.mapCfg.cols && shimmerCount < 64; col++) {
        if (!waterTiles.has(this.mapCfg.tiles[row][col])) continue
        if ((row * 37 + col * 19 + row * col) % 11 !== 0) continue

        const shimmer = this.add.image(
          col * TILE + TILE / 2,
          row * TILE + TILE / 2,
          `water-shimmer-${shimmerCount % 4}`,
        )
        shimmer.setDepth(1).setAlpha(0.68).setTint(rippleColor)
        shimmer.setData('frameOffset', shimmerCount % 4)
        this.waterShimmers.push(shimmer)
        shimmerCount++
      }
    }

    this.time.addEvent({
      delay: 190,
      loop: true,
      callback: () => {
        this.waterFrame = (this.waterFrame + 1) % 4
        this.waterShimmers.forEach(shimmer => {
          const offset = shimmer.getData('frameOffset') as number
          shimmer.setTexture(`water-shimmer-${(this.waterFrame + offset) % 4}`)
        })
      },
    })
  }

  // ── Entities ──────────────────────────────────────────────────────────────────

  private spawnEntities() {
    const shuffled = [...DELIVERY_TYPES].sort(() => Math.random() - 0.5)

    for (let i = 0; i < 4; i++) {
      const cfg = shuffled[i]
      const pos = this.mapCfg.housePositions[i]
      this.houses.push(new House(
        this, cfg.type, cfg.colorNum, cfg.colorHex, cfg.imageIndex, pos.col, pos.row,
        !this.mapCfg.worldImage,
      ))
    }

    const pkgOrder = [...shuffled].sort(() => Math.random() - 0.5)
    for (let i = 0; i < 4; i++) {
      const cfg = pkgOrder[i]
      const pos = this.mapCfg.packagePositions[i]
      this.packages.push(new Package(
        this, cfg.type, cfg.colorNum, cfg.imageIndex, pos.col, pos.row,
      ))
    }

    for (const pos of this.mapCfg.npcPositions) {
      const cfg = NPC_CONFIGS.find(npc => npc.id === pos.id)
      if (cfg) this.npcs.push(new Npc(this, cfg, pos.col, pos.row))
    }

    this.player = new Player(this, this.mapCfg.playerStart.col, this.mapCfg.playerStart.row)
  }

  // ── HUD (setScrollFactor(0) keeps everything fixed to the camera) ─────────────

  private buildHUD() {
    const bg = this.add.graphics()
    bg.fillStyle(0x0D1A06, 0.88)
    bg.fillRect(0, 0, VIEWPORT_W, HUD_H)
    bg.lineStyle(1, 0x4A7C20, 0.5)
    bg.strokeRect(0, 0, VIEWPORT_W, HUD_H)

    this.timerBar = this.add.graphics()

    this.timerText = this.add.text(VIEWPORT_W / 2, HUD_H / 2, this.formatTime(this.mapCfg.gameDurationMs), {
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#F0EAD2',
      fontFamily: uiFontFamily,
    }).setOrigin(0.5, 0.5)

    this.deliveryText = this.add.text(14, HUD_H / 2, '0 / 4  delivered', {
      fontSize: '14px',
      color: '#ADC178',
      fontFamily: uiFontFamily,
    }).setOrigin(0, 0.5)

    this.holdSwatch = this.add.graphics()

    this.holdText = this.add.text(VIEWPORT_W - 14, HUD_H / 2, 'Empty-handed', {
      fontSize: '13px',
      color: '#C8B89A',
      fontFamily: uiFontFamily,
    }).setOrigin(1, 0.5)

    this.hudContainer = this.add.container(0, 0, [
      bg,
      this.timerBar,
      this.timerText,
      this.deliveryText,
      this.holdSwatch,
      this.holdText,
    ]).setDepth(20).setScrollFactor(0)
    this.syncHudToCameraZoom()
  }

  private syncHudToCameraZoom() {
    if (!this.hudContainer) return
    const zoom = this.cameras.main.zoom || 1
    this.hudContainer.setScale(1 / zoom)
    this.hudContainer.setPosition(
      (VIEWPORT_W / 2) * (1 - 1 / zoom),
      (VIEWPORT_H / 2) * (1 - 1 / zoom),
    )
  }

  private updateHoldHUD(colorNum: number | null, colorHex: string, label: string) {
    this.holdSwatch.clear()
    if (colorNum !== null) {
      const rx = VIEWPORT_W - 14 - this.holdText.width - 20
      this.holdSwatch.fillStyle(colorNum)
      this.holdSwatch.fillRoundedRect(rx, HUD_H / 2 - 7, 14, 14, 3)
      this.holdText.setText(label).setColor(colorHex)
    } else {
      this.holdText.setText('Empty-handed').setColor('#C8B89A')
    }
  }

  // ── Update loop ───────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    this.syncHudToCameraZoom()
    if (!this.running) return
    if (!this.timerPaused) this.timeLeftMs -= delta
    if (this.timeLeftMs <= 0) {
      this.timeLeftMs = 0
      this.endGame('lose')
      return
    }
    this.refreshTimer()
    if (!this.timerPaused) this.handleMovement(delta)
  }

  // ── Movement ──────────────────────────────────────────────────────────────────

  private handleMovement(delta: number) {
    if (this.player.isMoving) return

    this.moveRepeatTimer -= delta
    const c = this.cursors
    let dx = 0, dy = 0

    if      (Phaser.Input.Keyboard.JustDown(c.left))       { dx = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (Phaser.Input.Keyboard.JustDown(c.right))      { dx =  1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (Phaser.Input.Keyboard.JustDown(c.up))         { dy = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (Phaser.Input.Keyboard.JustDown(c.down))       { dy =  1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.left.isDown  && this.moveRepeatTimer <= 0)  { dx = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.right.isDown && this.moveRepeatTimer <= 0)  { dx =  1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.up.isDown    && this.moveRepeatTimer <= 0)  { dy = -1; this.moveRepeatTimer = this.MOVE_REPEAT }
    else if (c.down.isDown  && this.moveRepeatTimer <= 0)  { dy =  1; this.moveRepeatTimer = this.MOVE_REPEAT }

    if (dx === 0 && dy === 0) return

    const nx = this.player.gridX + dx
    const ny = this.player.gridY + dy

    if (!this.isCellAirPassable(nx, ny)) {
      this.cameras.main.shake(50, 0.0015)
      return
    }
    const tile = this.mapCfg.tiles[ny]?.[nx]
    if (!tile) return

    const duration = BASE_MOVE / TILE_RULES[tile].speedMultiplier
    audioManager.play(SFX.wind, 0.24)
    this.player.tryMove(dx, dy, duration, () => {
      this.checkPickup()
      this.checkDelivery()
      this.updateNearHouse()
      this.updateNearNpc()
      this.emitHUDUpdate()
    })
  }

  private isHouseFootprint(col: number, row: number): boolean {
    return this.mapCfg.housePositions.some((house) =>
      col >= house.col &&
      col < house.col + HOUSE_SIZE &&
      row >= house.row &&
      row < house.row + HOUSE_SIZE,
    )
  }

  private isCellAirPassable(col: number, row: number): boolean {
    if (col < 0 || col >= this.mapCfg.cols || row < 0 || row >= this.mapCfg.rows) return false
    if (this.isHouseFootprint(col, row)) return false
    return isTileAirPassable(this.mapCfg.tiles[row]?.[col])
  }

  // ── Game logic ────────────────────────────────────────────────────────────────

  private checkPickup() {
    const pkg = this.packages.find(
      p => !p.isPickedUp && p.gridX === this.player.gridX && p.gridY === this.player.gridY,
    )
    if (!pkg) return
    if (this.player.heldType !== null) {
      this.floatText('Deliver first!', this.player.x, this.player.y - 30, '#FFD166')
      return
    }
    const cfg = DELIVERY_TYPES.find(d => d.type === pkg.type)!
    pkg.pickup()
    this.player.setHeld(pkg.type, pkg.imageIndex, cfg.colorNum)
    this.updateHoldHUD(cfg.colorNum, cfg.colorHex, cfg.label)
    this.floatText(`Picked up ${cfg.label}!`, this.player.x, this.player.y - 28, '#FFE566')
    audioManager.play(SFX.pickup, 0.7)
  }

  private checkDelivery() {
    if (this.player.heldType === null) return
    // Player must be in the 1-tile approach ring around the 3×3 house block
    const house = this.houses.find(h =>
      !h.isDelivered &&
      this.player.gridX >= h.gridX - 1 && this.player.gridX <= h.gridX + HOUSE_SIZE &&
      this.player.gridY >= h.gridY - 1 && this.player.gridY <= h.gridY + HOUSE_SIZE,
    )
    if (!house) return

    if (house.type === this.player.heldType) {
      house.markDelivered()
      this.deliveredCount++
      this.player.setHeld(null, null, 0)
      this.updateHoldHUD(null, '', '')
      this.deliveryText.setText(`${this.deliveredCount} / 4  delivered`)
      this.showBubble(CORRECT_MESSAGES[this.correctMsgIdx++ % CORRECT_MESSAGES.length], house.gridX, house.gridY, true)
      this.cameras.main.flash(300, 180, 220, 120)
      audioManager.play(SFX.deliver, 0.9)
      if (this.deliveredCount === 4) this.time.delayedCall(800, () => this.endGame('win'))
    } else {
      house.shake()
      this.showBubble(WRONG_MESSAGES[this.wrongMsgIdx++ % WRONG_MESSAGES.length], house.gridX, house.gridY, false)
      this.cameras.main.shake(220, 0.007)
      this.timeLeftMs = Math.max(0, this.timeLeftMs - 5_000)
      this.floatText('-5 sec', this.player.x, this.player.y - 22, '#FF7766')
      audioManager.play(SFX.wrong, 0.7)
    }
  }

  private updateNearHouse() {
    this.nearHouseIdx = this.houses.findIndex(h =>
      !h.isDelivered &&
      this.player.gridX >= h.gridX - 2 && this.player.gridX <= h.gridX + HOUSE_SIZE + 1 &&
      this.player.gridY >= h.gridY - 2 && this.player.gridY <= h.gridY + HOUSE_SIZE + 1,
    )
  }

  private updateNearNpc() {
    this.nearNpcIdx = this.npcs.findIndex(npc =>
      Math.abs(this.player.gridX - npc.gridX) <= 1 &&
      Math.abs(this.player.gridY - npc.gridY) <= 1,
    )
  }

  // ── HUD state emission ────────────────────────────────────────────────────────

  private emitHUDUpdate() {
    const heldCfg  = this.player.heldType
      ? DELIVERY_TYPES.find(d => d.type === this.player.heldType) ?? null : null
    const nearHouse = this.nearHouseIdx >= 0 ? this.houses[this.nearHouseIdx] : null
    const nearCfg   = nearHouse
      ? DELIVERY_TYPES.find(d => d.type === nearHouse.type) ?? null : null
    const nearNpc = this.nearNpcIdx >= 0 ? this.npcs[this.nearNpcIdx] : null

    this.cb.onHUDUpdate({
      heldType:            heldCfg?.type ?? null,
      heldImageIndex:      heldCfg?.imageIndex ?? null,
      heldLabel:           heldCfg?.label ?? null,
      heldColorHex:        heldCfg?.colorHex ?? null,
      nearHouseType:       nearCfg?.type ?? null,
      nearHouseImageIndex: nearCfg?.imageIndex ?? null,
      nearHouseLabel:      nearCfg?.label ?? null,
      nearNpcId:           nearNpc?.id ?? null,
      nearNpcName:         nearNpc?.name ?? null,
      nearNpcAssetKey:     nearNpc?.config.assetKey ?? null,
    })
  }

  // ── Feedback ──────────────────────────────────────────────────────────────────

  private floatText(text: string, wx: number, wy: number, color: string) {
    const t = this.add.text(wx, wy, text, {
      fontSize: '14px', fontStyle: 'bold', color,
      stroke: '#000000', strokeThickness: 3,
      fontFamily: uiFontFamily,
    }).setOrigin(0.5, 0.5).setDepth(15)
    this.tweens.add({
      targets: t, y: wy - 46, alpha: 0,
      duration: 1200, ease: 'Quad.Out',
      onComplete: () => t.destroy(),
    })
  }

  private showBubble(text: string, gridX: number, gridY: number, success: boolean) {
    const bgColor     = success ? 0xD4EDBE : 0xFFDDCC
    const textColor   = success ? '#1A5C0A' : '#8B1A00'
    const borderColor = success ? 0x5A9E30 : 0xCC3300
    const bW = Math.max(170, text.length * 8 + 20)
    const bH = 38

    const g = this.add.graphics()
    g.fillStyle(bgColor, 0.97)
    g.fillRoundedRect(-bW / 2, -bH / 2, bW, bH, 10)
    g.lineStyle(2, borderColor, 0.9)
    g.strokeRoundedRect(-bW / 2, -bH / 2, bW, bH, 10)
    g.fillStyle(bgColor, 0.97)
    g.fillTriangle(-7, bH / 2, 7, bH / 2, 0, bH / 2 + 11)

    const t = this.add.text(0, 0, text, {
      fontSize: '13px', fontStyle: 'bold', color: textColor,
      fontFamily: uiFontFamily,
    }).setOrigin(0.5, 0.5)

    const wx = Phaser.Math.Clamp((gridX + 1) * TILE + TILE / 2, bW / 2 + 6, this.worldW - bW / 2 - 6)
    const wy = Phaser.Math.Clamp(gridY * TILE - 18, bH / 2 + 48, this.worldH - bH - 18)
    const bubble = this.add.container(wx, wy, [g, t])
    bubble.setDepth(12).setAlpha(0).setScale(0.7)

    this.tweens.add({ targets: bubble, alpha: 1, scaleX: 1, scaleY: 1, duration: 180, ease: 'Back.Out' })
    this.time.delayedCall(1900, () => {
      this.tweens.add({
        targets: bubble, alpha: 0, y: bubble.y - 16,
        duration: 380, ease: 'Quad.In',
        onComplete: () => bubble.destroy(),
      })
    })
  }

  // ── Timer ─────────────────────────────────────────────────────────────────────

  private refreshTimer() {
    const sec = Math.ceil(this.timeLeftMs / 1000)
    const m = Math.floor(sec / 60)
    const s = sec % 60
    this.timerText.setText(`${m}:${s.toString().padStart(2, '0')}`)

    const ratio  = this.timeLeftMs / this.mapCfg.gameDurationMs
    const barW   = VIEWPORT_W * ratio
    const barCol = ratio > 0.5 ? 0x5ABA2E : ratio > 0.25 ? 0xE8C030 : 0xEE3322

    this.timerBar.clear()
    this.timerBar.fillStyle(barCol, 0.38)
    this.timerBar.fillRect(0, HUD_H - 4, barW, 4)

    if (this.timeLeftMs < 30_000) {
      this.timerText.setColor('#FF6B6B')
      this.timerText.setScale(Math.floor(this.timeLeftMs / 500) % 2 === 0 ? 1.12 : 1.0)
      if (Math.floor(this.timeLeftMs / 1000) !== Math.floor((this.timeLeftMs + 16) / 1000)) {
        audioManager.play(SFX.tick, 0.4)
      }
    } else if (this.timeLeftMs < 60_000) {
      this.timerText.setColor('#FFD166').setScale(1.0)
    } else {
      this.timerText.setColor('#F0EAD2').setScale(1.0)
    }
  }

  // ── End game ──────────────────────────────────────────────────────────────────

  private endGame(result: 'win' | 'lose') {
    if (!this.running) return
    this.running = false
    audioManager.play(result === 'win' ? SFX.win : SFX.lose, 0.9)

    const cx = VIEWPORT_W / 2
    const cy = VIEWPORT_H / 2

    const overlay = this.add.graphics()
    overlay.fillStyle(0x000000, 0.6)
    overlay.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H)
    overlay.setAlpha(0)
    this.tweens.add({ targets: overlay, alpha: 1, duration: 500 })

    const title = this.add.text(cx, cy - 36,
      result === 'win' ? 'All Delivered!' : 'Time is up!',
      { fontSize: '36px', fontStyle: 'bold',
        color: result === 'win' ? '#FFE566' : '#FF9988',
        stroke: '#000000', strokeThickness: 5, fontFamily: uiFontFamily },
    ).setOrigin(0.5, 0.5).setAlpha(0)

    const sub = this.add.text(cx, cy + 16,
      result === 'win'
        ? `The grove thanks Kiki!  Time left: ${this.formatTime(this.timeLeftMs)}`
        : `${this.deliveredCount} of 4 packages delivered`,
      { fontSize: '18px', color: '#F0EAD2',
        stroke: '#000000', strokeThickness: 3, fontFamily: uiFontFamily },
    ).setOrigin(0.5, 0.5).setAlpha(0)

    this.hudContainer.add([overlay, title, sub])

    this.tweens.add({ targets: title, alpha: 1, y: { from: cy - 10, to: cy - 36 }, duration: 680, ease: 'Back.Out' })
    this.tweens.add({ targets: sub,   alpha: 1, y: { from: cy + 50, to: cy + 16 }, duration: 680, delay: 200, ease: 'Back.Out' })

    if (result === 'win') {
      this.time.delayedCall(250, () => {
        const conf = this.add.particles(cx, cy, 'pixel', {
          speed: { min: 110, max: 300 },
          angle: { min: -180, max: 0 },
          scale: { start: 4, end: 0 },
          lifespan: 1300, quantity: 50,
          tint: [0xFFE566, 0xADC178, 0xFF88AA, 0x88CCFF, 0xFFFFFF],
          gravityY: 220, emitting: false,
        })
        this.hudContainer.add(conf)
        conf.explode(50)
        this.time.delayedCall(1500, () => conf.destroy())
      })
    }

    this.time.delayedCall(2500, () => {
      this.cb.onGameEnd(result, this.deliveredCount, Math.round(this.timeLeftMs / 1000))
    })
  }

  private formatTime(ms: number): string {
    const sec = Math.ceil(ms / 1000)
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
  }
}
