import Phaser from 'phaser'
import {
  BOARD_LAYOUTS, CELL, SCORE_CARD_CONTROL,
  buildDeck, shuffle, runScoringAfterPlacement, resetChainIds,
} from './data/halfMoonConfig'
import type {
  Phase, PlacedCard, BoardLayout, Difficulty,
  ScoreState, WildCardType,
} from './data/halfMoonConfig'
import { Card, CARD_W, CARD_H } from './entities/Card'
import { AIOpponent } from './entities/AIOpponent'

// ── Callback contract with React ──────────────────────────────────────────────

export type SceneCallbacks = {
  onLevelEnd:    (scores: ScoreState, won: boolean, level: number) => void
  onScoreUpdate: (scores: ScoreState) => void
  onEvent:       (msg: string, color: string) => void
  onHandUpdate:  (hand: Phase[], activeIdx: number | null) => void
  onTurnChange:  (isPlayerTurn: boolean) => void
}

// ── Scene ─────────────────────────────────────────────────────────────────────

const VP_W = 960
const VP_H = 620
const AI_THINK_MS  = 820
const DROP_RADIUS  = CARD_W * 0.7   // snap-to-slot distance threshold

export class HalfMoonScene extends Phaser.Scene {
  private cb!: SceneCallbacks
  private difficulty: Difficulty = 'medium'
  private level = 1

  private layout!: BoardLayout
  private placed: PlacedCard[] = []
  private scoredPairs = new Set<string>()

  private deck: Phase[] = []
  private playerHand: Phase[] = []
  private aiHand:     Phase[] = []

  private scores: ScoreState = { player: 0, ai: 0, playerCards: 0, aiCards: 0 }

  private boardCards: Map<number, Card> = new Map()
  private handCards:  Card[] = []
  private handCardHomePos: { x: number; y: number }[] = []

  // Slot visuals
  private slotGraphics:  Map<number, Phaser.GameObjects.Graphics> = new Map()
  private slotPositions: Map<number, { x: number; y: number }>    = new Map()

  // Drag state
  private dragIdx:         number | null = null
  private dragCard:        Card   | null = null
  private dragHomeX = 0
  private dragHomeY = 0
  private dragHoveredSlot: number | null = null

  private ai!: AIOpponent
  private isPlayerTurn  = true
  private inputLocked   = false
  private doublePlacement = false

  private moonFaceGfx!: Phaser.GameObjects.Graphics
  private scoreText!: Phaser.GameObjects.Text
  private turnText!:  Phaser.GameObjects.Text

  constructor() { super({ key: 'HalfMoonScene' }) }

  init(data: SceneCallbacks & { difficulty?: Difficulty; level?: number }) {
    this.cb         = data
    this.difficulty = data.difficulty ?? 'medium'
    this.level      = data.level ?? 1
    this.placed     = []
    this.scoredPairs = new Set()
    this.scores     = { player: 0, ai: 0, playerCards: 0, aiCards: 0 }
    this.playerHand = []
    this.aiHand     = []
    this.boardCards = new Map()
    this.handCards  = []
    this.handCardHomePos = []
    this.slotGraphics    = new Map()
    this.slotPositions   = new Map()
    this.dragIdx         = null
    this.dragCard        = null
    this.dragHoveredSlot = null
    this.isPlayerTurn    = true
    this.inputLocked     = false
    this.doublePlacement = false
    resetChainIds()
    // Remove stale listeners from previous scene run
    this.input.off('pointermove', this.onPointerMove, this)
    this.input.off('pointerup',   this.onPointerUp,   this)
  }

  preload() {}

  // ── Wild cards (called from React) ────────────────────────────────────────

  activateWild(type: WildCardType) {
    switch (type) {
      case 'eclipse-shield':
        ;(this as any)._shieldActive = true
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

  // ── Layout & board ────────────────────────────────────────────────────────

  private buildLayout() {
    const idx   = Math.min(this.level - 1, BOARD_LAYOUTS.length - 1)
    this.layout = BOARD_LAYOUTS[idx]
  }

  private drawStarfield() {
    const g = this.add.graphics()
    g.fillStyle(0x060C1A)
    g.fillRect(0, 0, VP_W, VP_H)
    g.fillStyle(0xFFFFFF)
    for (let i = 0; i < 200; i++) {
      const sx = Math.random() * VP_W
      const sy = Math.random() * VP_H * 0.88
      const sr = Math.random() < 0.8 ? 0.8 : 1.5
      g.fillCircle(sx, sy, sr)
      if (Math.random() < 0.12) g.fillStyle(0xDDE5FF, 0.6)
      else g.fillStyle(0xFFFFFF, 0.6 + Math.random() * 0.4)
    }
  }

  private drawMoonFace() {
    const gfx = this.add.graphics()
    gfx.fillStyle(0xFFF8C0, 0.08)
    gfx.fillCircle(VP_W - 80, 80, 70)
    gfx.lineStyle(1, 0xC8A84B, 0.2)
    gfx.strokeCircle(VP_W - 80, 80, 70)
    gfx.fillStyle(0xC8A84B, 0.25)
    gfx.fillCircle(VP_W - 98, 72, 7)
    gfx.fillCircle(VP_W - 64, 72, 7)
    gfx.lineStyle(2, 0xC8A84B, 0.3)
    gfx.beginPath()
    gfx.arc(VP_W - 80, 82, 16, 0.2, Math.PI - 0.2, false)
    gfx.strokePath()
    this.moonFaceGfx = gfx
  }

  private boardOffset() {
    const spaces = this.layout.spaces
    const maxX   = Math.max(...spaces.map(s => s.x)) + CELL
    const maxY   = Math.max(...spaces.map(s => s.y)) + CELL
    return {
      ox: (VP_W - maxX) / 2,
      oy: 70 + (VP_H - 160 - maxY) / 2,
    }
  }

  private drawBoard() {
    const { ox, oy } = this.boardOffset()
    const g = this.add.graphics().setDepth(1)

    g.lineStyle(1, 0x2A4060, 0.5)
    for (const space of this.layout.spaces) {
      for (const adjId of space.adjacentIds) {
        if (adjId > space.id) continue
        const adj = this.layout.spaces.find(s => s.id === adjId)!
        g.strokeLineShape(new Phaser.Geom.Line(
          ox + space.x + CELL / 2, oy + space.y + CELL / 2,
          ox + adj.x   + CELL / 2, oy + adj.y   + CELL / 2,
        ))
      }
    }

    for (const space of this.layout.spaces) {
      const sx = ox + space.x + CELL / 2
      const sy = oy + space.y + CELL / 2
      this.slotPositions.set(space.id, { x: sx, y: sy })
      const slotG = this.add.graphics().setDepth(2)
      this.slotGraphics.set(space.id, slotG)
      this.redrawSlot(space.id, false)
    }
  }

  private redrawSlot(spaceId: number, dropTarget: boolean) {
    const slotG = this.slotGraphics.get(spaceId)
    if (!slotG) return
    const { x: sx, y: sy } = this.slotPositions.get(spaceId)!
    const occupied = !!this.placed.find(c => c.spaceId === spaceId)
    slotG.clear()
    if (dropTarget && !occupied) {
      slotG.fillStyle(0x0D2E18, 1)
      slotG.fillRoundedRect(sx - CARD_W / 2, sy - CARD_H / 2, CARD_W, CARD_H, 10)
      slotG.lineStyle(2, 0x44EE88, 0.9)
      slotG.strokeRoundedRect(sx - CARD_W / 2, sy - CARD_H / 2, CARD_W, CARD_H, 10)
    } else {
      slotG.fillStyle(0x111C30, 1)
      slotG.fillRoundedRect(sx - CARD_W / 2, sy - CARD_H / 2, CARD_W, CARD_H, 10)
      slotG.lineStyle(1, 0x2A4060, 0.8)
      slotG.strokeRoundedRect(sx - CARD_W / 2, sy - CARD_H / 2, CARD_W, CARD_H, 10)
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
      color: '#F0EAD2', fontFamily: 'Georgia, serif',
    }).setOrigin(0.5, 0.5).setDepth(21).setScrollFactor(0)

    this.turnText = this.add.text(14, 24, 'Your turn — drag a card to the board', {
      fontSize: '13px', color: '#ADC178', fontFamily: 'Georgia, serif',
    }).setOrigin(0, 0.5).setDepth(21).setScrollFactor(0)

    this.add.text(VP_W - 14, 24, `Level ${this.level}: ${this.layout.label}`, {
      fontSize: '12px', color: '#C8A84B', fontFamily: 'Georgia, serif',
    }).setOrigin(1, 0.5).setDepth(21).setScrollFactor(0)
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
    let bestDist = DROP_RADIUS
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

    // Remove from hand tracking before renderHand so it won't be destroyed
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

    card.setScale(1)
    card.setDepth(10)
    this.tweens.add({
      targets: card, x: pos.x, y: pos.y,
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

  // ── Placement (shared logic + scoring) ───────────────────────────────────

  private placeCard(spaceId: number, phase: Phase, by: 'player' | 'ai', existingCard?: Card) {
    const { ox, oy } = this.boardOffset()
    const space = this.layout.spaces.find(s => s.id === spaceId)!
    const sx    = ox + space.x + CELL / 2
    const sy    = oy + space.y + CELL / 2

    let card: Card
    if (existingCard) {
      card = existingCard
    } else {
      card = new Card(this, phase, spaceId, sx, sy)
      card.alpha = 0
      this.tweens.add({ targets: card, alpha: 1, duration: 220 })
    }
    card.setDepth(5)
    card.setOwner(by)
    this.boardCards.set(spaceId, card)
    this.redrawSlot(spaceId, false)   // hide slot graphic under placed card

    const newPlaced: PlacedCard = { spaceId, phase, owner: by, chainId: null }
    this.placed.push(newPlaced)

    const result = runScoringAfterPlacement(
      this.placed, spaceId, by, this.layout, this.scoredPairs, this.doublePlacement,
    )

    this.scores.player += result.playerDelta
    this.scores.ai     += result.aiDelta

    for (const ev of result.events) {
      if (ev.type === 'phase-pair')     this.cb.onEvent(`Phase Pair! +${ev.points}`, ev.owner === 'player' ? '#88AAFF' : '#FF88BB')
      if (ev.type === 'full-moon-pair') this.cb.onEvent(`Full Moon Pair! +${ev.points}`, '#FFF8C0')
      if (ev.type === 'lunar-cycle')    this.cb.onEvent(`Lunar Cycle! +${ev.points}`, ev.owner === 'player' ? '#AADDFF' : '#FFB0B0')
      if (ev.type === 'chain-stolen')   this.cb.onEvent(`Chain Stolen! +${ev.points}`, '#FF7744')
    }

    for (const pc of this.placed) {
      this.boardCards.get(pc.spaceId)?.setOwner(pc.owner)
    }

    if (result.stolenChainId !== null || result.playerDelta > 0 || result.aiDelta > 0) {
      card.pulseDelivery(by)
    }

    this.moonFaceReact(result.aiDelta > result.playerDelta)
    this.refreshScoreHUD()
  }

  private moonFaceReact(aiWinning: boolean) {
    this.moonFaceGfx.clear()
    this.moonFaceGfx.fillStyle(0xFFF8C0, aiWinning ? 0.14 : 0.06)
    this.moonFaceGfx.fillCircle(VP_W - 80, 80, 70)
    this.moonFaceGfx.lineStyle(1, 0xC8A84B, aiWinning ? 0.35 : 0.2)
    this.moonFaceGfx.strokeCircle(VP_W - 80, 80, 70)
    this.moonFaceGfx.fillStyle(0xC8A84B, aiWinning ? 0.45 : 0.2)
    this.moonFaceGfx.fillCircle(VP_W - 98, 72, 7)
    this.moonFaceGfx.fillCircle(VP_W - 64, 72, 7)
    this.moonFaceGfx.lineStyle(2, 0xC8A84B, aiWinning ? 0.5 : 0.3)
    this.moonFaceGfx.beginPath()
    if (aiWinning) {
      this.moonFaceGfx.arc(VP_W - 80, 82, 16, 0.2, Math.PI - 0.2, false)
    } else {
      this.moonFaceGfx.arc(VP_W - 80, 96, 16, Math.PI + 0.2, -0.2, false)
    }
    this.moonFaceGfx.strokePath()
  }

  // ── AI turn — animated card fly-in ────────────────────────────────────────

  private doAITurn() {
    if ((this as any)._shieldActive) {
      ;(this as any)._shieldActive = false
      this.inputLocked = false
      this.isPlayerTurn = true
      this.cb.onTurnChange(true)
      this.turnText.setText('Your turn — drag a card to the board')
      return
    }

    if (this.aiHand.length === 0) this.drawForAI(3)

    const move = this.ai
      ? this.ai.choosePlacement(this.aiHand, this.placed, this.layout, this.scoredPairs)
      : { spaceId: this.layout.spaces.find(s => !this.placed.find(c => c.spaceId === s.id))!.id, phase: this.aiHand[0] }

    const { ox, oy } = this.boardOffset()
    const space   = this.layout.spaces.find(s => s.id === move.spaceId)!
    const targetX = ox + space.x + CELL / 2
    const targetY = oy + space.y + CELL / 2

    // Spawn card at the moon face (top-right) — AI's "deck"
    const deckX = VP_W - 80
    const deckY = 80
    const flyCard = new Card(this, move.phase, move.spaceId, deckX, deckY)
    flyCard.setOwner('ai')
    flyCard.setDepth(50)
    flyCard.alpha  = 0.15
    flyCard.scaleX = 0.6
    flyCard.scaleY = 0.6

    // Arc midpoint rises above the straight line between deck and target
    const midX = (deckX + targetX) / 2
    const midY = Math.min(oy - 20, (deckY + targetY) / 2 - 50)

    // Phase 1: rise toward arc peak
    this.tweens.add({
      targets: flyCard,
      x: midX, y: midY,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 300, ease: 'Quad.Out',
      onComplete: () => {
        // Phase 2: drop into target slot with a slight bounce
        this.tweens.add({
          targets: flyCard,
          x: targetX, y: targetY,
          duration: 260, ease: 'Quad.In',
          onComplete: () => {
            flyCard.setDepth(5)
            this.placeCard(move.spaceId, move.phase, 'ai', flyCard)
            this.aiHand.splice(this.aiHand.findIndex(p => p === move.phase), 1)

            if (this.isBoardFull()) {
              this.time.delayedCall(400, () => this.endLevel())
              return
            }

            this.drawForAI(1)
            this.inputLocked  = false
            this.isPlayerTurn = true
            this.cb.onTurnChange(true)
            this.turnText.setText('Your turn — drag a card to the board')
          },
        })
      },
    })
  }

  // ── Board full / level end ────────────────────────────────────────────────

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
    this.time.delayedCall(600, () => {
      this.cb.onLevelEnd({ ...this.scores }, won, this.level)
    })
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  startLevel(level: number, difficulty: Difficulty) {
    this.difficulty = difficulty
    this.level      = level
    this.ai         = new AIOpponent(difficulty)
    this.scene.restart({ ...this.cb, difficulty, level } as any)
  }

  create() {
    if (!this.ai) this.ai = new AIOpponent(this.difficulty)
    this.drawStarfield()
    this.drawMoonFace()
    this.buildLayout()
    this.drawBoard()
    this.buildHUD()
    this.dealHands()
    this.renderHand()
    this.cb.onTurnChange(true)
    this.input.on('pointermove', this.onPointerMove, this)
    this.input.on('pointerup',   this.onPointerUp,   this)
  }
}
