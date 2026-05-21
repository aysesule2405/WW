import React, { useState } from 'react'
import { bodyFontFamily } from '../theme/typography'
import { uiRadius, uiSpace, uiType } from '../theme/uiTokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export type RichAvatarConfig = {
  skinTone: string
  hairStyle: string
  hairColor: string
  eyeStyle: string
  eyeColor: string
  mouth: string
  outfit: string
  outfitColor: string
  accessory: string
  bgColor: string
}

export const DEFAULT_RICH_AVATAR: RichAvatarConfig = {
  skinTone: '#F5DEB3', hairStyle: 'medium', hairColor: '#3D1C02',
  eyeStyle: 'round', eyeColor: '#3D1C02', mouth: 'smile',
  outfit: 'grove', outfitColor: '#5A9030', accessory: 'none', bgColor: '#ADC178',
}

// ─── Option arrays ────────────────────────────────────────────────────────────

const SKIN_TONES = ['#FDDBB4','#F5C89A','#E8A87C','#C68B56','#A66B3A','#7B4A2A','#4A2C17']
const HAIR_COLORS = [
  '#1A1008','#3D1C02','#6B3A2A','#C8761A','#E8C572','#C8B0C0',
  '#A8A8C0','#4A6B9E','#E87890','#7A4A9E','#3A9E7A','#F0F0F0'
]
const EYE_COLORS = ['#4a2c0a','#3a6b3a','#3a5a9e','#5a6a7a','#6a3a9e','#9e6a1a','#C04040','#1A1008']
const BG_COLORS = [
  '#ADC178','#9EECF8','#FFAFBA','#F2CC8F','#8F8FBA','#C6CF79',
  '#F9C846','#88C8EE','#E8A0B4','#6B9E6B'
]
const HAIR_STYLES = ['buzz','short','bob','medium','long','wavy','curly','ponytail','bun']
const EYE_STYLES  = ['round','almond','wide','sleepy','sparkle']
const MOUTHS      = ['smile','grin','smirk','surprised','neutral','beam']
const OUTFITS     = ['grove','spirit','delivery','forest','moon','cozy']
const OUTFIT_COLORS = [
  '#5A9030','#7a4a9e','#C8761A','#2a6b3a','#1a2a5a','#E87890','#6B3A2A','#4a8a9e'
]
const ACCESSORIES = ['none','leaf-crown','flower-crown','glasses','cat-ears','star-tiara','mushroom-hat','butterfly']

const HAIR_STYLE_LABELS: Record<string, string> = {
  buzz:'Buzz', short:'Short', bob:'Bob', medium:'Medium', long:'Long',
  wavy:'Wavy', curly:'Curly', ponytail:'Ponytail', bun:'Bun'
}
const EYE_STYLE_LABELS: Record<string, string> = {
  round:'Round', almond:'Almond', wide:'Wide', sleepy:'Sleepy', sparkle:'Sparkle'
}
const MOUTH_LABELS: Record<string, string> = {
  smile:'Smile', grin:'Grin', smirk:'Smirk', surprised:'Surprised', neutral:'Neutral', beam:'Beam'
}
const OUTFIT_LABELS: Record<string, string> = {
  grove:'Grove Tee', spirit:'Spirit Robe', delivery:'Delivery Jacket',
  forest:'Forest Cloak', moon:'Moon Robe', cozy:'Cozy Sweater'
}
const ACCESSORY_LABELS: Record<string, string> = {
  none:'None', 'leaf-crown':'Leaf Crown', 'flower-crown':'Flower Crown',
  glasses:'Glasses', 'cat-ears':'Cat Ears', 'star-tiara':'Star Tiara',
  'mushroom-hat':'Mushroom Hat', butterfly:'Butterfly'
}

// ─── Color helpers ────────────────────────────────────────────────────────────

export function darkenColor(hex: string, factor = 0.75): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  const r = Math.round(parseInt(full.slice(0, 2), 16) * factor)
  const g = Math.round(parseInt(full.slice(2, 4), 16) * factor)
  const b = Math.round(parseInt(full.slice(4, 6), 16) * factor)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

// ─── Hair helpers ─────────────────────────────────────────────────────────────

function HairBack({ style, color }: { style: string; color: string }) {
  if (style === 'bob') return <>
    <rect x="27" y="36" width="8" height="52" rx="4" fill={color}/>
    <rect x="85" y="36" width="8" height="52" rx="4" fill={color}/>
  </>
  if (style === 'medium') return <>
    <rect x="27" y="36" width="8" height="68" rx="4" fill={color}/>
    <rect x="85" y="36" width="8" height="68" rx="4" fill={color}/>
  </>
  if (style === 'long') return <>
    <rect x="25" y="36" width="10" height="84" rx="5" fill={color}/>
    <rect x="85" y="36" width="10" height="84" rx="5" fill={color}/>
  </>
  if (style === 'wavy') return <>
    <path d="M27,38 C23,52 25,64 23,76 C21,88 25,102 27,108 L34,108 C32,102 28,88 30,76 C32,64 30,52 34,38 Z" fill={color}/>
    <path d="M93,38 C97,52 95,64 97,76 C99,88 95,102 93,108 L86,108 C88,102 92,88 90,76 C88,64 90,52 86,38 Z" fill={color}/>
  </>
  return null
}

function HairFront({ style, color }: { style: string; color: string }) {
  if (style === 'buzz') return <ellipse cx="60" cy="30" rx="28" ry="9" fill={color}/>
  if (style === 'short') return <ellipse cx="60" cy="28" rx="30" ry="12" fill={color}/>
  if (style === 'bob') return <>
    <ellipse cx="60" cy="30" rx="28" ry="11" fill={color}/>
    <rect x="27" y="34" width="8" height="54" rx="4" fill={color}/>
    <rect x="85" y="34" width="8" height="54" rx="4" fill={color}/>
  </>
  if (style === 'medium') return <>
    <ellipse cx="60" cy="30" rx="28" ry="11" fill={color}/>
    <rect x="27" y="34" width="8" height="66" rx="4" fill={color}/>
    <rect x="85" y="34" width="8" height="66" rx="4" fill={color}/>
  </>
  if (style === 'long') return <>
    <ellipse cx="60" cy="30" rx="28" ry="11" fill={color}/>
    <rect x="25" y="34" width="10" height="84" rx="5" fill={color}/>
    <rect x="85" y="34" width="10" height="84" rx="5" fill={color}/>
  </>
  if (style === 'wavy') return <>
    <ellipse cx="60" cy="30" rx="28" ry="11" fill={color}/>
    <path d="M27,38 C23,52 25,64 23,76 C21,88 25,102 27,108 L34,108 C32,102 28,88 30,76 C32,64 30,52 34,38 Z" fill={color}/>
    <path d="M93,38 C97,52 95,64 97,76 C99,88 95,102 93,108 L86,108 C88,102 92,88 90,76 C88,64 90,52 86,38 Z" fill={color}/>
  </>
  if (style === 'curly') return <>
    <circle cx="60" cy="22" r="20" fill={color}/>
    <circle cx="36" cy="44" r="15" fill={color}/>
    <circle cx="84" cy="44" r="15" fill={color}/>
  </>
  if (style === 'ponytail') return <>
    <ellipse cx="60" cy="30" rx="28" ry="11" fill={color}/>
    <path d="M 62,26 C 66,14 76,10 80,18 C 84,26 80,34 74,30 C 70,28 68,20 64,22 Z" fill={color}/>
  </>
  if (style === 'bun') return <>
    <ellipse cx="60" cy="34" rx="28" ry="11" fill={color}/>
    <circle cx="60" cy="18" r="14" fill={color}/>
    <ellipse cx="60" cy="29" rx="10" ry="5" fill={color}/>
  </>
  return null
}

// ─── Eye helpers ──────────────────────────────────────────────────────────────

function Eye({ cx, cy, style, irisColor }: { cx: number; cy: number; style: string; irisColor: string }) {
  if (style === 'round') return <>
    <circle cx={cx} cy={cy} r={6} fill="white"/>
    <circle cx={cx} cy={cy} r={4} fill={irisColor}/>
    <circle cx={cx} cy={cy} r={2.5} fill="#111"/>
    <circle cx={cx+1.5} cy={cy-1.5} r={1.5} fill="white"/>
  </>
  if (style === 'almond') return <>
    <path d={`M${cx-7},${cy} Q${cx-2},${cy-5} ${cx+7},${cy} Q${cx+2},${cy+5} ${cx-7},${cy} Z`} fill="white"/>
    <ellipse cx={cx} cy={cy} rx={3.5} ry={3} fill={irisColor}/>
    <ellipse cx={cx} cy={cy} rx={2} ry={1.8} fill="#111"/>
    <circle cx={cx+1} cy={cy-1} r={1} fill="white"/>
  </>
  if (style === 'wide') return <>
    <circle cx={cx} cy={cy} r={7.5} fill="white"/>
    <circle cx={cx} cy={cy} r={5} fill={irisColor}/>
    <circle cx={cx} cy={cy} r={3} fill="#111"/>
    <circle cx={cx+2} cy={cy-2} r={2} fill="white"/>
  </>
  if (style === 'sleepy') return <>
    <path d={`M${cx-6},${cy} A6,6 0 0,0 ${cx+6},${cy} Z`} fill="white"/>
    <ellipse cx={cx} cy={cy+1} rx={3.5} ry={2} fill={irisColor}/>
    <path d={`M${cx-6},${cy} Q${cx},${cy-5} ${cx+6},${cy}`} stroke={darkenColor(irisColor,0.7)} strokeWidth="2" fill="none" strokeLinecap="round"/>
  </>
  if (style === 'sparkle') return <>
    <circle cx={cx} cy={cy} r={6} fill="white"/>
    <circle cx={cx} cy={cy} r={4} fill={irisColor}/>
    <text x={cx} y={cy+3.5} textAnchor="middle" fontSize="6" fill="white">✦</text>
  </>
  return null
}

// ─── Mouth helpers ────────────────────────────────────────────────────────────

function Mouth({ style }: { style: string }) {
  if (style === 'smile') return <path d="M 50,73 Q 60,81 70,73" stroke="#4a2c17" strokeWidth="2" fill="none" strokeLinecap="round"/>
  if (style === 'grin') return <>
    <path d="M 48,72 Q 60,82 72,72" stroke="#4a2c17" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <rect x="52" y="72" width="16" height="7" rx="2" fill="white" opacity="0.7"/>
    <ellipse cx="40" cy="68" rx="6" ry="4" fill="rgba(255,130,100,0.22)"/>
    <ellipse cx="80" cy="68" rx="6" ry="4" fill="rgba(255,130,100,0.22)"/>
  </>
  if (style === 'smirk') return <path d="M 52,73 Q 60,78 65,72" stroke="#4a2c17" strokeWidth="2" fill="none" strokeLinecap="round"/>
  if (style === 'surprised') return <ellipse cx="60" cy="75" rx="5" ry="6" fill="#4a2c17"/>
  if (style === 'neutral') return <line x1="52" y1="73" x2="68" y2="73" stroke="#4a2c17" strokeWidth="2" strokeLinecap="round"/>
  if (style === 'beam') return <>
    <path d="M 48,72 Q 60,84 72,72" stroke="#4a2c17" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <ellipse cx="40" cy="68" rx="7" ry="4.5" fill="rgba(255,110,90,0.2)"/>
    <ellipse cx="80" cy="68" rx="7" ry="4.5" fill="rgba(255,110,90,0.2)"/>
  </>
  return null
}

// ─── Outfit helpers ───────────────────────────────────────────────────────────

function Outfit({ style, color }: { style: string; color: string }) {
  if (style === 'grove') return (
    <path d="M0,120 L0,98 C18,88 38,84 60,84 C82,84 102,88 120,98 L120,120 Z" fill={color}/>
  )
  if (style === 'spirit') return (
    <path d="M0,120 L0,94 C16,86 36,83 60,83 C84,83 104,86 120,94 L120,120 Z" fill={color}/>
  )
  if (style === 'delivery') return <>
    <path d="M0,120 L0,96 C18,87 38,83 60,83 C82,83 102,87 120,96 L120,120 Z" fill={color}/>
    <path d="M54,83 L54,94 L66,94 L66,83" fill={darkenColor(color, 0.82)} stroke={darkenColor(color,0.7)} strokeWidth="1"/>
  </>
  if (style === 'forest') return <>
    <path d="M0,120 L0,93 C15,84 35,80 60,80 C85,80 105,84 120,93 L120,120 Z" fill={color}/>
    <path d="M30,120 L30,88 C42,83 54,82 60,82 C66,82 78,83 90,88 L90,120 Z" fill={darkenColor(color, 0.88)} opacity="0.5"/>
  </>
  if (style === 'moon') return <>
    <path d="M0,120 L0,92 C18,84 38,81 60,81 C82,81 102,84 120,92 L120,120 Z" fill={color}/>
    <path d="M50,81 Q60,77 70,81 L70,88 Q60,84 50,88 Z" fill={darkenColor(color,0.78)}/>
  </>
  if (style === 'cozy') return (
    <path d="M0,120 L0,99 C20,90 40,86 60,86 C80,86 100,90 120,99 L120,120 Z" fill={color}/>
  )
  return null
}

// ─── Accessory helpers ────────────────────────────────────────────────────────

function Accessory({ style, hairColor }: { style: string; hairColor: string }) {
  if (style === 'none') return null
  if (style === 'glasses') return <>
    <circle cx="47" cy="53" r="9" fill="none" stroke="#333" strokeWidth="2"/>
    <circle cx="73" cy="53" r="9" fill="none" stroke="#333" strokeWidth="2"/>
    <line x1="56" y1="53" x2="64" y2="53" stroke="#333" strokeWidth="2"/>
    <line x1="29" y1="53" x2="38" y2="53" stroke="#333" strokeWidth="1.5"/>
    <line x1="82" y1="53" x2="91" y2="53" stroke="#333" strokeWidth="1.5"/>
  </>
  if (style === 'cat-ears') return <>
    <polygon points="35,32 42,18 50,30" fill={hairColor}/>
    <polygon points="70,30 78,18 85,32" fill={hairColor}/>
    <polygon points="38,30 42,22 47,29" fill="#f9a8c9"/>
    <polygon points="73,29 78,22 83,30" fill="#f9a8c9"/>
  </>
  if (style === 'leaf-crown') return <>
    <ellipse cx="60" cy="26" rx="6" ry="10" fill="#5a9e3a" transform="rotate(0,60,26)"/>
    <ellipse cx="44" cy="30" rx="5" ry="9" fill="#4a9030" transform="rotate(-30,44,30)"/>
    <ellipse cx="76" cy="30" rx="5" ry="9" fill="#4a9030" transform="rotate(30,76,30)"/>
    <ellipse cx="34" cy="38" rx="4" ry="8" fill="#5aaa3a" transform="rotate(-55,34,38)"/>
    <ellipse cx="86" cy="38" rx="4" ry="8" fill="#5aaa3a" transform="rotate(55,86,38)"/>
    <ellipse cx="60" cy="22" rx="12" ry="3" fill="#6b3a2a" opacity="0.4"/>
  </>
  if (style === 'flower-crown') return <>
    <circle cx="60" cy="24" r="5" fill="#ffeb9e"/>
    <circle cx="55" cy="19" r="3.5" fill="#ff9eb8"/> <circle cx="65" cy="19" r="3.5" fill="#ff9eb8"/>
    <circle cx="60" cy="17" r="3.5" fill="#ff9eb8"/> <circle cx="57" cy="22" r="3.5" fill="#ffc8e0"/>
    <circle cx="63" cy="22" r="3.5" fill="#ffc8e0"/>
    <circle cx="44" cy="30" r="4" fill="#ffe49e"/>
    <circle cx="39" cy="26" r="3" fill="#ffa0c0"/> <circle cx="49" cy="26" r="3" fill="#ffa0c0"/>
    <circle cx="44" cy="24" r="3" fill="#ffa0c0"/>
    <circle cx="76" cy="30" r="4" fill="#ffe49e"/>
    <circle cx="71" cy="26" r="3" fill="#ffa0c0"/> <circle cx="81" cy="26" r="3" fill="#ffa0c0"/>
    <circle cx="76" cy="24" r="3" fill="#ffa0c0"/>
  </>
  if (style === 'star-tiara') return <>
    <ellipse cx="60" cy="28" rx="22" ry="3" fill={darkenColor(hairColor, 0.9)} opacity="0.5"/>
    <text x="60" y="26" textAnchor="middle" fontSize="10" fill="#f9d71c">★</text>
    <text x="44" y="32" textAnchor="middle" fontSize="8" fill="#f9d71c">★</text>
    <text x="76" y="32" textAnchor="middle" fontSize="8" fill="#f9d71c">★</text>
  </>
  if (style === 'mushroom-hat') return <>
    <rect x="46" y="26" width="28" height="8" rx="3" fill="#e8c8a0"/>
    <ellipse cx="60" cy="26" rx="22" ry="13" fill="#c04040"/>
    <circle cx="52" cy="22" r="3" fill="white" opacity="0.7"/>
    <circle cx="64" cy="18" r="2.5" fill="white" opacity="0.7"/>
    <circle cx="70" cy="24" r="2" fill="white" opacity="0.7"/>
  </>
  if (style === 'butterfly') return <>
    <ellipse cx="88" cy="36" rx="9" ry="6" fill="#a060e0" transform="rotate(-30,88,36)" opacity="0.85"/>
    <ellipse cx="94" cy="44" rx="7" ry="5" fill="#c090f8" transform="rotate(20,94,44)" opacity="0.85"/>
    <line x1="88" y1="40" x2="84" y2="44" stroke="#7a3ab0" strokeWidth="1.5"/>
  </>
  return null
}

// ─── AvatarSvg ────────────────────────────────────────────────────────────────

export function AvatarSvg({ config, size }: { config: RichAvatarConfig; size: number }) {
  const { skinTone, hairStyle, hairColor, eyeStyle, eyeColor, mouth, outfit, outfitColor, accessory, bgColor } = config
  const skinDark = darkenColor(skinTone, 0.88)
  const noseTone = darkenColor(skinTone, 0.78)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* 1. Background */}
      <circle cx="60" cy="60" r="60" fill={bgColor}/>

      {/* 2. Outfit / collar — behind head */}
      <Outfit style={outfit} color={outfitColor}/>

      {/* 3. Neck */}
      <rect x="53" y="80" width="14" height="10" rx="3" fill={skinTone}/>

      {/* 4. Ears */}
      <ellipse cx="33" cy="63" rx="6" ry="7" fill={skinTone}/>
      <ellipse cx="87" cy="63" rx="6" ry="7" fill={skinTone}/>
      <ellipse cx="33" cy="63" rx="3.5" ry="4" fill={skinDark}/>
      <ellipse cx="87" cy="63" rx="3.5" ry="4" fill={skinDark}/>

      {/* 5. Hair back — behind head */}
      <HairBack style={hairStyle} color={hairColor}/>

      {/* 6. Head */}
      <ellipse cx="60" cy="57" rx="26" ry="27" fill={skinTone}/>

      {/* Blush cheeks — subtle, on head */}
      <ellipse cx="40" cy="63" rx="8" ry="5" fill="rgba(255,120,100,0.12)"/>
      <ellipse cx="80" cy="63" rx="8" ry="5" fill="rgba(255,120,100,0.12)"/>

      {/* 7. Eyes */}
      <Eye cx={47} cy={53} style={eyeStyle} irisColor={eyeColor}/>
      <Eye cx={73} cy={53} style={eyeStyle} irisColor={eyeColor}/>

      {/* 8. Eyebrows */}
      <path d="M 42,47 Q 47,43 53,47" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M 67,47 Q 73,43 78,47" stroke={hairColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* 9. Nose */}
      <circle cx="57" cy="65" r="1.5" fill={noseTone}/>
      <circle cx="63" cy="65" r="1.5" fill={noseTone}/>

      {/* 10. Mouth */}
      <Mouth style={mouth}/>

      {/* 11. Hair front */}
      <HairFront style={hairStyle} color={hairColor}/>

      {/* 12. Accessories */}
      <Accessory style={accessory} hairColor={hairColor}/>
    </svg>
  )
}

// ─── Editor sub-components ────────────────────────────────────────────────────

function ColorSwatch({ color, selected, onSelect }: { color: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      aria-label={`Color ${color}`}
      onClick={onSelect}
      style={{
        width: 28, height: 28, borderRadius: 999,
        background: color, cursor: 'pointer',
        border: selected ? '2px solid var(--accent)' : '2px solid var(--border)',
        transform: selected ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.1s, border-color 0.1s',
        flexShrink: 0,
        padding: 0,
      }}
    />
  )
}

function Chip({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: '6px 11px',
        borderRadius: uiRadius.pill,
        border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
        background: selected ? 'var(--bg-accent-soft)' : 'var(--bg-surface)',
        color: selected ? 'var(--accent-dark)' : 'var(--text-body)',
        cursor: 'pointer',
        fontSize: uiType.small,
        fontFamily: bodyFontFamily,
        fontWeight: selected ? 700 : 400,
        transition: 'all 0.1s',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '10px 0 4px',
      fontSize: uiType.micro,
      fontWeight: 700,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontFamily: bodyFontFamily,
    }}>
      {children}
    </p>
  )
}

function SwatchRow({ colors, selected, onSelect }: { colors: string[]; selected: string; onSelect: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {colors.map(c => <ColorSwatch key={c} color={c} selected={selected === c} onSelect={() => onSelect(c)}/>)}
    </div>
  )
}

function ChipRow<T extends string>({ items, selected, labels, onSelect }: {
  items: T[]; selected: T; labels: Record<string, string>; onSelect: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map(item => <Chip key={item} label={labels[item] ?? item} selected={selected === item} onSelect={() => onSelect(item)}/>)}
    </div>
  )
}

// ─── Randomize helper ─────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }

function randomAvatar(): RichAvatarConfig {
  return {
    skinTone: pick(SKIN_TONES),
    hairStyle: pick(HAIR_STYLES),
    hairColor: pick(HAIR_COLORS),
    eyeStyle: pick(EYE_STYLES),
    eyeColor: pick(EYE_COLORS),
    mouth: pick(MOUTHS),
    outfit: pick(OUTFITS),
    outfitColor: pick(OUTFIT_COLORS),
    accessory: pick(ACCESSORIES),
    bgColor: pick(BG_COLORS),
  }
}

// ─── CSS animation injection ──────────────────────────────────────────────────

const STYLE_ID = 'ww-avatar-creator-styles'
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes ww-avatar-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(173,193,120,0.55); }
      50%  { box-shadow: 0 0 0 12px rgba(173,193,120,0); }
      100% { box-shadow: 0 0 0 0 rgba(173,193,120,0); }
    }
    .ww-avatar-preview-pulse { animation: ww-avatar-pulse 0.55s ease-out; }
    @keyframes ww-dice-spin {
      0%   { transform: rotate(0deg) scale(1); }
      40%  { transform: rotate(180deg) scale(1.15); }
      100% { transform: rotate(360deg) scale(1); }
    }
    .ww-dice-spinning { animation: ww-dice-spin 0.45s ease-in-out; }
  `
  document.head.appendChild(el)
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab = 'face' | 'hair' | 'outfit' | 'extras' | 'background'
const TABS: { id: Tab; label: string }[] = [
  { id: 'face', label: 'Face' },
  { id: 'hair', label: 'Hair' },
  { id: 'outfit', label: 'Outfit' },
  { id: 'extras', label: 'Extras' },
  { id: 'background', label: 'Background' },
]

// ─── AvatarCreator ────────────────────────────────────────────────────────────

export function AvatarCreator({ value, onChange }: { value: RichAvatarConfig; onChange: (cfg: RichAvatarConfig) => void }) {
  const [tab, setTab] = useState<Tab>('face')
  const [pulseKey, setPulseKey] = useState(0)
  const [diceClass, setDiceClass] = useState('')

  const update = (patch: Partial<RichAvatarConfig>) => {
    onChange({ ...value, ...patch })
    setPulseKey(k => k + 1)
  }

  const handleRandomize = () => {
    onChange(randomAvatar())
    setPulseKey(k => k + 1)
    setDiceClass('ww-dice-spinning')
    setTimeout(() => setDiceClass(''), 500)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: uiSpace.lg,
      padding: uiSpace.md,
      borderRadius: uiRadius.lg,
      background: 'var(--bg-badge)',
      border: '1px solid var(--border-muted)',
    }}>
      {/* Top: Preview + Randomize */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: uiSpace.md,
      }}>
        <div
          key={pulseKey}
          className="ww-avatar-preview-pulse"
          style={{ borderRadius: 999, overflow: 'hidden', lineHeight: 0 }}
        >
          <AvatarSvg config={value} size={200}/>
        </div>
        <button
          onClick={handleRandomize}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px',
            borderRadius: uiRadius.pill,
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-body)',
            cursor: 'pointer',
            fontFamily: bodyFontFamily,
            fontSize: uiType.small,
            fontWeight: 700,
          }}
        >
          <span className={diceClass} style={{ display: 'inline-block', fontSize: 18 }}>🎲</span>
          Randomize
        </button>
        <p style={{
          margin: 0,
          color: 'var(--text-muted)',
          fontSize: uiType.micro,
          textAlign: 'center',
          fontFamily: bodyFontFamily,
          maxWidth: 180,
        }}>
          Mix and match to find your grove look
        </p>
      </div>

      {/* Bottom: Tabs + Options */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: uiSpace.sm }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 13px',
                borderRadius: uiRadius.pill,
                border: tab === t.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: tab === t.id ? 'var(--bg-accent-soft)' : 'var(--bg-surface)',
                color: tab === t.id ? 'var(--accent-dark)' : 'var(--text-body)',
                cursor: 'pointer',
                fontSize: uiType.small,
                fontFamily: bodyFontFamily,
                fontWeight: tab === t.id ? 700 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Options panel */}
        <div style={{
          maxHeight: 380,
          overflowY: 'auto',
          padding: '4px 2px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {tab === 'face' && <>
            <SectionLabel>Skin Tone</SectionLabel>
            <SwatchRow colors={SKIN_TONES} selected={value.skinTone} onSelect={c => update({ skinTone: c })}/>
            <SectionLabel>Eye Style</SectionLabel>
            <ChipRow items={EYE_STYLES as unknown as string[]} selected={value.eyeStyle} labels={EYE_STYLE_LABELS} onSelect={(v: string) => update({ eyeStyle: v })}/>
            <SectionLabel>Eye Color</SectionLabel>
            <SwatchRow colors={EYE_COLORS} selected={value.eyeColor} onSelect={c => update({ eyeColor: c })}/>
            <SectionLabel>Mouth</SectionLabel>
            <ChipRow items={MOUTHS as unknown as string[]} selected={value.mouth} labels={MOUTH_LABELS} onSelect={(v: string) => update({ mouth: v })}/>
          </>}
          {tab === 'hair' && <>
            <SectionLabel>Hair Style</SectionLabel>
            <ChipRow items={HAIR_STYLES as unknown as string[]} selected={value.hairStyle} labels={HAIR_STYLE_LABELS} onSelect={(v: string) => update({ hairStyle: v })}/>
            <SectionLabel>Hair Color</SectionLabel>
            <SwatchRow colors={HAIR_COLORS} selected={value.hairColor} onSelect={c => update({ hairColor: c })}/>
          </>}
          {tab === 'outfit' && <>
            <SectionLabel>Outfit Style</SectionLabel>
            <ChipRow items={OUTFITS as unknown as string[]} selected={value.outfit} labels={OUTFIT_LABELS} onSelect={(v: string) => update({ outfit: v })}/>
            <SectionLabel>Outfit Color</SectionLabel>
            <SwatchRow colors={OUTFIT_COLORS} selected={value.outfitColor} onSelect={c => update({ outfitColor: c })}/>
          </>}
          {tab === 'extras' && <>
            <SectionLabel>Accessory</SectionLabel>
            <ChipRow items={ACCESSORIES as unknown as string[]} selected={value.accessory} labels={ACCESSORY_LABELS} onSelect={(v: string) => update({ accessory: v })}/>
          </>}
          {tab === 'background' && <>
            <SectionLabel>Background Color</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {BG_COLORS.map(c => (
                <button
                  key={c}
                  aria-label={`Background ${c}`}
                  onClick={() => update({ bgColor: c })}
                  style={{
                    width: 40, height: 40, borderRadius: uiRadius.md,
                    background: c, cursor: 'pointer', padding: 0,
                    border: value.bgColor === c ? '3px solid var(--accent)' : '2px solid var(--border)',
                    transform: value.bgColor === c ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.1s, border-color 0.1s',
                  }}
                />
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}
