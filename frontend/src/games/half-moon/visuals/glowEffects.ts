// ── Ownership Visual System ───────────────────────────────────────────────────
//
// Two identities:
//   Player  — white shine  (cards shimmer with bright white light)
//   AI/Moon — black shadow (cards radiate a dark absorbing aura)

import type { Owner } from '../data/halfMoonConfig'

// ── Card background fills ─────────────────────────────────────────────────────
// All cards share the same parchment tone — ownership is shown only through
// the white (player) or black (AI) glow rings outside the card edge.

export const CARD_BG_PLAYER  = 0xD6D3A9   // warm parchment
export const CARD_BG_AI      = 0xD6D3A9   // same — black ring provides contrast
export const CARD_BG_EMPTY   = 0xD6D3A9   // unplayed
export const SELECTED_BG     = 0xECE9D0   // slightly lighter for selection highlight

// ── Player: white shine constants ─────────────────────────────────────────────

export const PLAYER_SHINE    = 0xFFFFFF   // main ring
export const PLAYER_PULSE    = 0xFFFFFF   // delivery flash

// ── AI/Moon: black shadow constants ───────────────────────────────────────────

export const AI_SHADOW       = 0x030008   // near-pure black ring
export const AI_PULSE        = 0x220040   // delivery flash — dark violet

// ── Card text colors ──────────────────────────────────────────────────────────

export const PLAYER_NUM_COLOR = '#FFFFFF'
export const AI_NUM_COLOR     = '#998FAA'
export const EMPTY_NUM_COLOR  = '#C8A84B'

// ── Connection line colors ────────────────────────────────────────────────────

export const CONNECTION_PLAYER  = 0xDDDDDD  // near-white  — clear player chains
export const CONNECTION_AI      = 0x3A2455  // dark violet — subtle AI chains
export const CONNECTION_NEUTRAL = 0x2A3A50  // muted slate
export const CONNECTION_VALID   = 0x44EE88  // valid drop target
export const CONNECTION_INVALID = 0xFF4466  // illegal drop

// ── Drop-target slot colors ───────────────────────────────────────────────────

export const SLOT_HOVER_BG      = 0x0D2E18
export const SLOT_HOVER_BORDER  = 0x44EE88
export const SLOT_EMPTY_BG      = 0x111C30
export const SLOT_EMPTY_BORDER  = 0x2A4060

// ── Border for thin card edge line ────────────────────────────────────────────

export const PLAYER_BORDER       = 0xBBB8A0   // warm light gray on parchment
export const PLAYER_BORDER_GLOW  = 0xFFFFFF
export const AI_BORDER           = 0x2A2018   // dark warm brown on parchment
export const AI_BORDER_GLOW      = 0x080400
export const EMPTY_BORDER        = 0xB0AA88   // muted warm for unplayed card

// ── Helpers ───────────────────────────────────────────────────────────────────

export function cardBgForOwner(owner: Owner): number {
  if (owner === 'player') return CARD_BG_PLAYER
  if (owner === 'ai')     return CARD_BG_AI
  return CARD_BG_EMPTY
}

export function borderForOwner(owner: Owner, glowing: boolean): number {
  if (owner === 'player') return glowing ? PLAYER_BORDER_GLOW : PLAYER_BORDER
  if (owner === 'ai')     return glowing ? AI_BORDER_GLOW     : AI_BORDER
  return glowing ? 0x886600 : EMPTY_BORDER
}

export function pulseColorForOwner(owner: Owner): number {
  if (owner === 'player') return PLAYER_PULSE
  if (owner === 'ai')     return AI_PULSE
  return 0x334466
}

export function numColorForOwner(owner: Owner): string {
  if (owner === 'player') return PLAYER_NUM_COLOR
  if (owner === 'ai')     return AI_NUM_COLOR
  return EMPTY_NUM_COLOR
}

export function connectionColorForOwner(owner: Owner): number {
  if (owner === 'player') return CONNECTION_PLAYER
  if (owner === 'ai')     return CONNECTION_AI
  return CONNECTION_NEUTRAL
}
