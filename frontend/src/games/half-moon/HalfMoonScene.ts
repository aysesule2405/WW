import Phaser from 'phaser'
import {
  CELL, SCORE_CARD_CONTROL,
  buildDeck, shuffle, runScoringAfterPlacement, resetChainIds,
  BOARD_LAYOUTS, generateRandomLayout,
} from './data/halfMoonConfig'
import { audioManager } from '../../lib/AudioManager'

const SFX = {
  cardPlace: '/assets/audio/sfx/halfmoon/card-place.mp3',
  match:     '/assets/audio/sfx/halfmoon/match.mp3',
  chain:     '/assets/audio/sfx/halfmoon/chain.mp3',
  win:       '/assets/audio/sfx/halfmoon/win.mp3',
  lose:      '/assets/audio/sfx/halfmoon/lose.mp3',
} as const
import type {
  Phase, PlacedCard, BoardLayout, Difficulty, AIMode,
  ScoreState, WildCardType,
} from './data/halfMoonConfig'
import { Card, CARD_W, CARD_H } from './entities/Card'
import { AIOpponent } from './entities/AIOpponent'
import {
  preloadHalfMoonAssets,
  GAME_BG_KEY, MOON_SMILE_KEY, MOON_SAD_KEY,
} from './assets'
import {
  CONNECTION_PLAYER, CONNECTION_AI, CONNECTION_NEUTRAL,
  SLOT_HOVER_BG, SLOT_HOVER_BORDER, SLOT_EMPTY_BG, SLOT_EMPTY_BORDER,
} from './visuals/glowEffects'
import { numberFontFamily, uiFontFamily } from '../../theme/typography'

// ── Callback contract with React ──────────────────────────────────────────────

export type SceneCallbacks = {
  onLevelEnd:    (scores: ScoreState, won: boolean, level: number) => void
  onScoreUpdate: (scores: ScoreState) => void
  onEvent:       (msg: string, color: string) => void
  onHandUpdate:  (hand: Phase[], activeIdx: number | null) => void
  onTurnChange:  (isPlayerTurn: boolean) => void
}

// ── Scene ─────────────────────────────────────────────────────────────────────

const VP_W        = 960
const VP_H        = 620
const AI_THINK_MS = 820
const DROP_RADIUS = CARD_W * 0.7

export class HalfMoonScene extends Phaser.Scene {
  private cb!: SceneCallbacks
  private difficulty: Difficulty = 'medium'
  private aiMode:     AIMode     = 'local'
  private level = 1

  private layout!:     BoardLayout
  private placed:      PlacedCard[] = []
  private scoredPairs  = new Set<string>()

  private deck:       Phase[] = []
  private playerHand: Phase[] = []
  private aiHand:     Phase[] = []

  private scores: ScoreState = { player: 0, ai: 0, playerCards: 0, aiCards: 0 }

  private boardCards:   Map<number, Card>                        = new Map()
  private handCards:    Card[]                                   = []
  private handCardHomePos: { x: number; y: number }[]           = []

  // Half Moon opponent's hand — rendered face-up so its cards are always visible
  private aiHandCards:     Card[]                                = []
  private aiHandHomePos:   { x: number; y: number }[]            = []

  private slotGraphics:  Map<number, Phaser.GameObjects.Graphics> = new Map()
  private slotPositions: Map<number, { x: number; y: number }>   = new Map()

  // Scale applied to board cards/slots so larger, more irregular boards
  // (levels 7-9) always fit inside the fixed viewport without overlap.
  private boardScale = 1
  private longLinkKeys: Set<string> = new Set()

  // Dynamic connection-line layer (redrawn on every placement)
  private connectionGfx!: Phaser.GameObjects.Graphics

  private dragIdx:         number | null = null
  private dragCard:        Card   | null = null
  private dragHomeX = 0
  private dragHomeY = 0
  private dragHoveredSlot: number | null = null

  private ai!: AIOpponent
  private isPlayerTurn  = true
  private inputLocked   = false
  private doublePlacement = false
  private shieldActive = false

  private moonFaceGfx!: Phaser.GameObjects.Graphics      // procedural fallback
  private moonImg:      Phaser.GameObjects.Image | null = null  // real sprite
  private scoreText!:   Phaser.GameObjects.Text
  private turnText!:    Phaser.GameObjects.Text

  constructor() { super({ key: 'HalfMoonScene' }) }

  init(data: SceneCallbacks & { difficulty?: Difficulty; aiMode?: AIMode; level?: number }) {
    this.cb         = data
    this.difficulty = data.difficulty ?? 'medium'
    this.aiMode     = data.aiMode     ?? 'local'
    this.level      = data.level      ?? 1
    this.placed     = []
    this.scoredPairs = new Set()
    this.scores     = { player: 0, ai: 0, playerCards: 0, aiCards: 0 }
    this.playerHand = []
    this.aiHand     = []
    this.boardCards = new Map()
    this.handCards  = []
    this.handCardHomePos = []
    this.aiHandCards      = []
    this.aiHandHomePos    = []
    this.boardScale       = 1
    this.longLinkKeys     = new Set()
    this.slotGraphics    = new Map()
    this.slotPositions   = new Map()
    this.dragIdx         = null
    this.dragCard        = null
    this.dragHoveredSlot = null
    this.isPlayerTurn    = true
    this.inputLocked     = false
    this.doublePlacement = false
    this.shieldActive    = false
    resetChainIds()
    this.input.off('pointermove', this.onPointerMove, this)
    this.input.off('pointerup',   this.onPointerUp,   this)
  }

  preload() {
    // Silently loads PNGs from /assets/cards/ and /assets/ui/
    // Missing files are ignored — the game falls back to procedural graphics
    preloadHalfMoonAssets(this)
    audioManager.preload(Object.values(SFX), 3)
  }

  // ── Wild cards ────────────────────────────────────────────────────────────

  activateWild(type: WildCardType) {
    switch (type) {
      case 'eclipse-shield':
        this.shieldActive = true
        this.cb.onEvent("Eclipse Shield: AI's next turn is blocked!", '#88AAFF')
        break
      case 'moonrise':
        if (this.playerHand.length > 0) {
          this.playerHand.push(this.playerHand[0])
          this.renderHand()
          this.cb.onHandUpdate([...this.playerHand], null)
          this.cb.onEvent('Moonrise: card duplicated!', '#FFDDAA')
        }
        break
      case 'star-burst': {
        const aiCards = this.placed.filter(c => c.owner === 'ai')
        if (aiCards.length > 0) {
          const target = aiCards[Math.floor(Math.random() * aiCards.length)]
          this.boardCards.get(target.spaceId)?.setOwner(null)
          target.owner = null
          target.phase = 1 as Phase
          this.redrawConnections()
          this.cb.onEvent('Star Burst: removed an AI card!', '#FF8888')
        }
        break
      }
      case 'crescent-charm':
        this.doublePlacement = true
        this.cb.onEvent('Crescent Charm: next placement scores double!', '#FFEE88')
        break
    }
  }

  // ── Board layout ──────────────────────────────────────────────────────────

  private buildLayout() {
    this.layout = BOARD_LAYOUTS[this.level - 1] ?? generateRandomLayout(this.level)
    this.longLinkKeys = new Set(
      (this.layout.longLinks ?? []).map(([a, b]) => [a, b].sort((x, y) => x - y).join('-')),
    )
  }

  private drawStarfield() {
    const theme = this.layout?.theme

    // Use the real background image when loaded; fall back to procedural starfield.
    if (this.textures.exists(GAME_BG_KEY)) {
      this.add.image(VP_W / 2, VP_H / 2, GAME_BG_KEY)
        .setDisplaySize(VP_W, VP_H)
        .setDepth(-1)
      // The shared background art is the same PNG for every level — lay a
      // faint per-level color wash over it so each board still reads as a
      // distinct place without fighting the artwork underneath.
      if (theme) {
        this.add.graphics().setDepth(-1)
          .fillStyle(theme.bgTint, 0.16)
          .fillRect(0, 0, VP_W, VP_H)
      }
      return
    }
    const bgTint   = theme?.bgTint ?? 0x060C1A
    const density  = theme?.starDensity ?? 200
    const g = this.add.graphics()
    g.fillStyle(bgTint)
    g.fillRect(0, 0, VP_W, VP_H)
    for (let i = 0; i < density; i++) {
      const sx = Math.random() * VP_W
      const sy = Math.random() * VP_H * 0.88
      const sr = Math.random() < 0.8 ? 0.8 : 1.5
      g.fillStyle(Math.random() < 0.12 ? 0xDDE5FF : 0xFFFFFF, 0.6 + Math.random() * 0.4)
      g.fillCircle(sx, sy, sr)
    }
  }

  private drawMoonFace() {
    // Moon face is hidden during gameplay and revealed only at round end.
    if (this.textures.exists(MOON_SMILE_KEY)) {
      this.moonImg = this.add.image(VP_W - 72, 72, MOON_SMILE_KEY)
        .setDisplaySize(120, 120)
        .setDepth(0)
        .setAlpha(0)
      this.moonFaceGfx = this.add.graphics()
      return
    }
    this.moonFaceGfx = this.add.graphics().setAlpha(0)
  }

  // Top margin reserves the HUD bar + the Half Moon hand row; bottom margin
  // reserves the player's hand row. `scale` shrinks larger/irregular boards
  // (levels 7-9) to fit the remaining band without overlapping either row.
  private boardOffset() {
    const spaces = this.layout.spaces
    const maxX   = Math.max(...spaces.map(s => s.x)) + CELL
    const maxY   = Math.max(...spaces.map(s => s.y)) + CELL

    const TOP_MARGIN    = 168
    const BOTTOM_MARGIN = 112
    const SIDE_MARGIN   = 36
    const availW = VP_W - SIDE_MARGIN * 2
    const availH = VP_H - TOP_MARGIN - BOTTOM_MARGIN

    const scale = Math.min(1, availW / maxX, availH / maxY)

    return {
      ox: (VP_W - maxX * scale) / 2,
      oy: TOP_MARGIN + (availH - maxY * scale) / 2,
      scale,
    }
  }

  // ── Board drawing with dynamic connection colors ───────────────────────────

  private drawBoard() {
    const { ox, oy, scale } = this.boardOffset()
    this.boardScale = scale

    // Static slot markers
    for (const space of this.layout.spaces) {
      const sx = ox + (space.x + CELL / 2) * scale
      const sy = oy + (space.y + CELL / 2) * scale
      this.slotPositions.set(space.id, { x: sx, y: sy })
      const slotG = this.add.graphics().setDepth(2)
      this.slotGraphics.set(space.id, slotG)
      this.redrawSlot(space.id, false)
    }

    // Separate graphics layer for connection lines (redrawn after each placement)
    this.connectionGfx = this.add.graphics().setDepth(1)
    this.redrawConnections()
  }

  private drawDashedLine(
    g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number,
  ) {
    const dashLen = 7, gapLen = 5
    const dist = Math.hypot(x2 - x1, y2 - y1)
    if (dist === 0) return
    const ux = (x2 - x1) / dist, uy = (y2 - y1) / dist
    let pos = 0
    while (pos < dist) {
      const segEnd = Math.min(pos + dashLen, dist)
      g.strokeLineShape(new Phaser.Geom.Line(
        x1 + ux * pos, y1 + uy * pos, x1 + ux * segEnd, y1 + uy * segEnd,
      ))
      pos += dashLen + gapLen
    }
  }

  // Redraws all connection lines with ownership-aware colors. "Long link"
  // bridge edges (see BoardLayout.longLinks) render dashed so they read as
  // intentional shortcuts rather than a rendering glitch.
  private redrawConnections() {
    this.connectionGfx.clear()

    for (const space of this.layout.spaces) {
      for (const adjId of space.adjacentIds) {
        if (adjId > space.id) continue   // draw each edge once

        const spaceCard = this.placed.find(c => c.spaceId === space.id)
        const adjCard   = this.placed.find(c => c.spaceId === adjId)

        // Choose connection color based on shared ownership
        let lineColor = CONNECTION_NEUTRAL
        let lineAlpha = 0.4
        let lineWidth = 1

        if (spaceCard?.owner && adjCard?.owner && spaceCard.owner === adjCard.owner) {
          lineColor = spaceCard.owner === 'player' ? CONNECTION_PLAYER : CONNECTION_AI
          lineAlpha = 0.75
          lineWidth = 2
        }

        const { x: sx, y: sy } = this.slotPositions.get(space.id)!
        const { x: ax, y: ay } = this.slotPositions.get(adjId)!
        const isLongLink = this.longLinkKeys.has([space.id, adjId].sort((a, b) => a - b).join('-'))

        this.connectionGfx.lineStyle(lineWidth, lineColor, isLongLink ? Math.max(lineAlpha, 0.55) : lineAlpha)
        if (isLongLink) {
          this.drawDashedLine(this.connectionGfx, sx, sy, ax, ay)
        } else {
          this.connectionGfx.strokeLineShape(new Phaser.Geom.Line(sx, sy, ax, ay))
        }
      }
    }
  }

  private redrawSlot(spaceId: number, dropTarget: boolean) {
    const slotG = this.slotGraphics.get(spaceId)
    if (!slotG) return
    const { x: sx, y: sy } = this.slotPositions.get(spaceId)!
    const occupied = !!this.placed.find(c => c.spaceId === spaceId)
    const w = CARD_W * this.boardScale, h = CARD_H * this.boardScale, r = 10 * this.boardScale

    slotG.clear()
    if (dropTarget && !occupied) {
      slotG.fillStyle(SLOT_HOVER_BG, 1)
      slotG.fillRoundedRect(sx - w / 2, sy - h / 2, w, h, r)
      slotG.lineStyle(2, SLOT_HOVER_BORDER, 0.9)
      slotG.strokeRoundedRect(sx - w / 2, sy - h / 2, w, h, r)
    } else {
      slotG.fillStyle(SLOT_EMPTY_BG, 1)
      slotG.fillRoundedRect(sx - w / 2, sy - h / 2, w, h, r)
      slotG.lineStyle(1, SLOT_EMPTY_BORDER, 0.8)
      slotG.strokeRoundedRect(sx - w / 2, sy - h / 2, w, h, r)
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────────

  private buildHUD() {
    const bar = this.add.graphics().setDepth(20).setScrollFactor(0)
    bar.fillStyle(0x060C1A, 0.92)
    bar.fillRect(0, 0, VP_W, 48)
    bar.lineStyle(1, 0xC8A84B, 0.3)
    bar.strokeRect(0, 0, VP_W, 48)

    this.scoreText = this.add.text(VP_W / 2, 24, 'You: 0   Half Moon: 0', {
      fontSize: '18px', fontStyle: 'bold',
      color: '#D6D3A9', fontFamily: numberFontFamily,
    }).setOrigin(0.5, 0.5).setDepth(21).setScrollFactor(0)

    this.turnText = this.add.text(14, 24, 'Your turn — drag a card to the board', {
      fontSize: '13px', color: '#D6D3A9', fontFamily: uiFontFamily,
    }).setOrigin(0, 0.5).setDepth(21).setScrollFactor(0)

    this.add.text(VP_W - 14, 24, `Level ${this.level}: ${this.layout.label}`, {
      fontSize: '12px', color: '#D6D3A9', fontFamily: uiFontFamily,
    }).setOrigin(1, 0.5).setDepth(21).setScrollFactor(0)

    this.add.text(VP_W / 2, 72, "Half Moon's hand", {
      fontSize: '11px', color: '#998FAA', fontFamily: uiFontFamily,
    }).setOrigin(0.5, 0.5).setDepth(21).setScrollFactor(0)
  }

  private refreshScoreHUD() {
    this.scoreText.setText(`You: ${this.scores.player}   Half Moon: ${this.scores.ai}`)
    this.cb.onScoreUpdate({ ...this.scores })
  }

  // ── Deck & hands ──────────────────────────────────────────────────────────

  private dealHands() {
    this.deck       = buildDeck()
    this.playerHand = this.deck.splice(0, 3)
    this.aiHand     = this.deck.splice(0, 3)
    this.cb.onHandUpdate([...this.playerHand], null)
    this.renderAIHand()
  }

  private drawForPlayer(n = 1) {
    for (let i = 0; i < n; i++) {
      if (this.deck.length === 0) this.deck = shuffle(buildDeck())
      this.playerHand.push(this.deck.shift()!)
    }
  }

  private drawForAI(n = 1) {
    for (let i = 0; i < n; i++) {
      if (this.deck.length === 0) this.deck = shuffle(buildDeck())
      this.aiHand.push(this.deck.shift()!)
    }
  }

  // ── Hand rendering ────────────────────────────────────────────────────────

  private renderHand() {
    this.handCards.forEach(c => c.destroy())
    this.handCards = []
    this.handCardHomePos = []

    const y      = VP_H - 60
    const gap    = CARD_W + 12
    const startX = VP_W / 2 - (this.playerHand.length - 1) * gap / 2

    for (let i = 0; i < this.playerHand.length; i++) {
      const hx   = startX + i * gap
      const card = new Card(this, this.playerHand[i], -1, hx, y)
      card.setDepth(30)
      card.setOwner('player')
      this.handCardHomePos.push({ x: hx, y })
      const idx = i
      card.setDragInteractive(
        () => this.startDrag(idx),
        () => this.dragCard !== null,
      )
      this.handCards.push(card)
    }
  }

  // The Half Moon opponent's hand — always visible face-up so the player can
  // judge whether it's drawing better cards, not tucked away client-side.
  private renderAIHand() {
    this.aiHandCards.forEach(c => c.destroy())
    this.aiHandCards   = []
    this.aiHandHomePos = []

    const y      = 114
    const gap    = CARD_W + 12
    const startX = VP_W / 2 - (this.aiHand.length - 1) * gap / 2

    for (let i = 0; i < this.aiHand.length; i++) {
      const hx   = startX + i * gap
      const card = new Card(this, this.aiHand[i], -1, hx, y)
      card.setDepth(29)
      card.setOwner('ai')
      this.aiHandHomePos.push({ x: hx, y })
      this.aiHandCards.push(card)
    }
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  private startDrag(idx: number) {
    if (this.inputLocked || !this.isPlayerTurn || this.dragCard) return
    this.dragIdx   = idx
    this.dragCard  = this.handCards[idx]
    this.dragHomeX = this.handCardHomePos[idx].x
    this.dragHomeY = this.handCardHomePos[idx].y
    this.dragCard.setDepth(60)
    this.dragCard.setScale(1.12)
  }

  private onPointerMove(ptr: Phaser.Input.Pointer) {
    if (!this.dragCard) return
    this.dragCard.setPosition(ptr.worldX, ptr.worldY)
    const nearest = this.getNearestSlot(ptr.worldX, ptr.worldY)
    if (nearest !== this.dragHoveredSlot) {
      if (this.dragHoveredSlot !== null) this.redrawSlot(this.dragHoveredSlot, false)
      if (nearest !== null) this.redrawSlot(nearest, true)
      this.dragHoveredSlot = nearest
    }
  }

  private onPointerUp(ptr: Phaser.Input.Pointer) {
    if (!this.dragCard) return
    const nearest = this.getNearestSlot(ptr.worldX, ptr.worldY)
    if (nearest !== null && this.canPlaceOnSpace(nearest)) {
      this.dropCard(nearest)
    } else {
      this.snapBack()
    }
  }

  private getNearestSlot(px: number, py: number): number | null {
    let best: number | null = null
    let bestDist = DROP_RADIUS * this.boardScale
    for (const [spaceId, pos] of this.slotPositions) {
      if (!this.canPlaceOnSpace(spaceId)) continue
      const d = Math.hypot(px - pos.x, py - pos.y)
      if (d < bestDist) { bestDist = d; best = spaceId }
    }
    return best
  }

  private canPlaceOnSpace(spaceId: number): boolean {
    return !this.placed.find(c => c.spaceId === spaceId)
  }

  private dropCard(spaceId: number) {
    const card  = this.dragCard!
    const idx   = this.dragIdx!
    const phase = this.playerHand[idx]
    const pos   = this.slotPositions.get(spaceId)!

    this.handCards.splice(idx, 1)
    this.handCardHomePos.splice(idx, 1)
    this.playerHand.splice(idx, 1)

    this.dragCard = null
    this.dragIdx  = null
    if (this.dragHoveredSlot !== null) {
      this.redrawSlot(this.dragHoveredSlot, false)
      this.dragHoveredSlot = null
    }
    this.inputLocked = true

    card.setDepth(10)
    this.tweens.add({
      targets: card, x: pos.x, y: pos.y, scaleX: this.boardScale, scaleY: this.boardScale,
      duration: 180, ease: 'Back.Out',
      onComplete: () => {
        card.setDepth(5)
        this.placeCard(spaceId, phase, 'player', card)
        this.doublePlacement = false

        if (this.isBoardFull()) { this.endLevel(); return }

        this.drawForPlayer(1)
        this.renderHand()
        this.cb.onHandUpdate([...this.playerHand], null)

        this.isPlayerTurn = false
        this.cb.onTurnChange(false)
        this.turnText.setText('Half Moon thinks…')

        this.time.delayedCall(AI_THINK_MS, () => this.doAITurn())
      },
    })
  }

  private snapBack() {
    const card = this.dragCard!
    this.dragCard = null
    this.dragIdx  = null
    if (this.dragHoveredSlot !== null) {
      this.redrawSlot(this.dragHoveredSlot, false)
      this.dragHoveredSlot = null
    }
    this.tweens.add({
      targets: card, x: this.dragHomeX, y: this.dragHomeY,
      scaleX: 1, scaleY: 1,
      duration: 220, ease: 'Back.Out',
      onComplete: () => card.setDepth(30),
    })
  }

  // ── Card placement + scoring ──────────────────────────────────────────────

  private placeCard(spaceId: number, phase: Phase, by: 'player' | 'ai', existingCard?: Card) {
    const { ox, oy, scale } = this.boardOffset()
    const space = this.layout.spaces.find(s => s.id === spaceId)!
    const sx    = ox + (space.x + CELL / 2) * scale
    const sy    = oy + (space.y + CELL / 2) * scale

    let card: Card
    if (existingCard) {
      card = existingCard
      card.setPosition(sx, sy)
    } else {
      card = new Card(this, phase, spaceId, sx, sy)
      card.alpha = 0
      this.tweens.add({ targets: card, alpha: 1, duration: 220 })
    }
    card.setScale(scale)
    card.setDepth(5)
    card.setOwner(by)
    this.boardCards.set(spaceId, card)
    this.redrawSlot(spaceId, false)

    const newPlaced: PlacedCard = { spaceId, phase, owner: by, chainId: null }
    this.placed.push(newPlaced)
    audioManager.play(SFX.cardPlace, 0.65)

    const result = runScoringAfterPlacement(
      this.placed, spaceId, by, this.layout, this.scoredPairs, this.doublePlacement,
    )

    this.scores.player += result.playerDelta
    this.scores.ai     += result.aiDelta

    for (const ev of result.events) {
      if (ev.type === 'same-match')         { this.cb.onEvent(`Same Match! +${ev.points}`,         ev.owner === 'player' ? '#88AAFF' : '#FF88BB'); audioManager.play(SFX.match, 0.75) }
      if (ev.type === 'complementary-match') { this.cb.onEvent(`Complementary! +${ev.points}`,      '#FFF8C0'); audioManager.play(SFX.match, 0.75) }
      if (ev.type === 'moon-cycle')          { this.cb.onEvent(`Moon Cycle! +${ev.points}`,         ev.owner === 'player' ? '#AADDFF' : '#FFB0B0'); audioManager.play(SFX.match, 0.75) }
      if (ev.type === 'chain-stolen')        { this.cb.onEvent(`Chain Stolen! +${ev.points}`,       '#FF7744'); audioManager.play(SFX.chain, 0.8) }
    }

    // Sync ownership changes from chain-stealing back to card visuals
    for (const pc of this.placed) {
      this.boardCards.get(pc.spaceId)?.setOwner(pc.owner)
    }

    if (result.stolenChainId !== null || result.playerDelta > 0 || result.aiDelta > 0) {
      card.pulseDelivery(by)
    }

    // Redraw connection lines after every placement
    this.redrawConnections()

    this.refreshScoreHUD()
  }

  private showEndMoon(playerWon: boolean) {
    // playerWon=true → moon lost → sad face; playerWon=false → moon won → smiling face
    if (this.moonImg) {
      const key = playerWon ? MOON_SAD_KEY : MOON_SMILE_KEY
      if (this.textures.exists(key)) this.moonImg.setTexture(key)
      this.tweens.add({
        targets: this.moonImg,
        alpha: 0.92, scaleX: 1.15, scaleY: 1.15,
        duration: 500, ease: 'Back.Out',
        onComplete: () => {
          this.tweens.add({
            targets: this.moonImg,
            scaleX: 1, scaleY: 1,
            duration: 280, ease: 'Sine.Out',
          })
        },
      })
      return
    }

    // Procedural fallback: draw the face then fade in
    this.moonFaceGfx.clear()
    this.moonFaceGfx.fillStyle(0xFFF8C0, 0.12)
    this.moonFaceGfx.fillCircle(VP_W - 80, 80, 70)
    this.moonFaceGfx.lineStyle(1, 0xC8A84B, 0.28)
    this.moonFaceGfx.strokeCircle(VP_W - 80, 80, 70)
    this.moonFaceGfx.fillStyle(0xC8A84B, 0.35)
    this.moonFaceGfx.fillCircle(VP_W - 98, 72, 7)
    this.moonFaceGfx.fillCircle(VP_W - 64, 72, 7)
    this.moonFaceGfx.lineStyle(2, 0xC8A84B, 0.4)
    this.moonFaceGfx.beginPath()
    if (!playerWon) {
      this.moonFaceGfx.arc(VP_W - 80, 82, 16, 0.2, Math.PI - 0.2, false)   // smile
    } else {
      this.moonFaceGfx.arc(VP_W - 80, 96, 16, Math.PI + 0.2, -0.2, false)  // frown
    }
    this.moonFaceGfx.strokePath()
    this.tweens.add({ targets: this.moonFaceGfx, alpha: 1, duration: 500, ease: 'Sine.Out' })
  }

  // ── AI turn ───────────────────────────────────────────────────────────────

  private doAITurn() {
    if (this.shieldActive) {
      this.shieldActive = false
      this.inputLocked = false
      this.isPlayerTurn = true
      this.cb.onTurnChange(true)
      this.turnText.setText('Your turn — drag a card to the board')
      return
    }

    if (this.aiHand.length === 0) this.drawForAI(3)

    // AIOpponent.choosePlacement is async (supports Gemini mode)
    this.ai.choosePlacement(this.aiHand, this.placed, this.layout, this.scoredPairs)
      .then(move => this.executeAIMove(move))
      .catch(() => {
        // Fallback to synchronous local AI on any async error
        const move = this.ai.choosePlacementSync(this.aiHand, this.placed, this.layout, this.scoredPairs)
        this.executeAIMove(move)
      })
  }

  private executeAIMove(move: { spaceId: number; phase: Phase }) {
    const { ox, oy, scale } = this.boardOffset()
    const space   = this.layout.spaces.find(s => s.id === move.spaceId)!
    const targetX = ox + (space.x + CELL / 2) * scale
    const targetY = oy + (space.y + CELL / 2) * scale

    // Fly the card out from its actual visible position in the Half Moon's
    // hand row, so the player can see exactly which card it's playing.
    const handIdx  = this.aiHand.findIndex(p => p === move.phase)
    const originPos = this.aiHandHomePos[handIdx] ?? { x: VP_W - 80, y: 80 }
    this.aiHandCards[handIdx]?.setAlpha(0)

    const flyCard = new Card(this, move.phase, move.spaceId, originPos.x, originPos.y)
    flyCard.setOwner('ai')
    flyCard.setDepth(50)
    flyCard.scaleX = 1
    flyCard.scaleY = 1

    const midX = (originPos.x + targetX) / 2
    const midY = Math.min(oy - 20, (originPos.y + targetY) / 2 - 50)

    this.tweens.add({
      targets: flyCard,
      x: midX, y: midY,
      scaleX: (1 + scale) / 2, scaleY: (1 + scale) / 2,
      duration: 300, ease: 'Quad.Out',
      onComplete: () => {
        this.tweens.add({
          targets: flyCard,
          x: targetX, y: targetY,
          scaleX: scale, scaleY: scale,
          duration: 260, ease: 'Quad.In',
          onComplete: () => {
            flyCard.setDepth(5)
            this.placeCard(move.spaceId, move.phase, 'ai', flyCard)
            this.aiHand.splice(handIdx, 1)

            if (this.isBoardFull()) {
              this.renderAIHand()
              this.time.delayedCall(400, () => this.endLevel())
              return
            }

            this.drawForAI(1)
            this.renderAIHand()
            this.inputLocked  = false
            this.isPlayerTurn = true
            this.cb.onTurnChange(true)
            this.turnText.setText('Your turn — drag a card to the board')
          },
        })
      },
    })
  }

  // ── Level end ─────────────────────────────────────────────────────────────

  private isBoardFull(): boolean {
    return this.placed.length >= this.layout.spaces.length
  }

  private endLevel() {
    this.inputLocked = true
    for (const pc of this.placed) {
      if (pc.owner === 'player') this.scores.player += SCORE_CARD_CONTROL
      else if (pc.owner === 'ai') this.scores.ai    += SCORE_CARD_CONTROL
    }
    this.scores.playerCards = this.placed.filter(c => c.owner === 'player').length
    this.scores.aiCards     = this.placed.filter(c => c.owner === 'ai').length
    this.refreshScoreHUD()
    const won = this.scores.player > this.scores.ai
    audioManager.play(won ? SFX.win : SFX.lose, 0.9)
    this.showEndMoon(won)
    this.time.delayedCall(600, () => {
      this.cb.onLevelEnd({ ...this.scores }, won, this.level)
    })
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  startLevel(level: number, difficulty: Difficulty, aiMode: AIMode = 'local') {
    this.difficulty = difficulty
    this.aiMode     = aiMode
    this.level      = level
    this.ai         = new AIOpponent(difficulty, aiMode)
    this.scene.restart({ ...this.cb, difficulty, aiMode, level })
  }

  create() {
    if (!this.ai) this.ai = new AIOpponent(this.difficulty, this.aiMode)
    this.buildLayout()
    this.drawStarfield()
    this.drawMoonFace()
    this.drawBoard()
    this.buildHUD()
    this.dealHands()
    this.renderHand()
    this.cb.onTurnChange(true)
    this.input.on('pointermove', this.onPointerMove, this)
    this.input.on('pointerup',   this.onPointerUp,   this)
  }
}
