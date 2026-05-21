import React, { useRef, useState } from 'react'
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
  '#F9C846','#88C8EE','#E8A0B4','#6B9E6B','#D4A5E8','#A0C4B8'
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

export function lightenColor(hex: string, factor = 1.15): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean
  const r = Math.min(255, Math.round(parseInt(full.slice(0, 2), 16) * factor))
  const g = Math.min(255, Math.round(parseInt(full.slice(2, 4), 16) * factor))
  const b = Math.min(255, Math.round(parseInt(full.slice(4, 6), 16) * factor))
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

// ─── Gradient ID counter (stable per instance) ────────────────────────────────
let _avUid = 0

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
  const lid = darkenColor(irisColor, 0.55)
  if (style === 'round') return <>
    <circle cx={cx} cy={cy} r={6.5} fill="white"/>
    <circle cx={cx} cy={cy} r={4.5} fill={irisColor}/>
    <circle cx={cx} cy={cy} r={2.8} fill="#111"/>
    <circle cx={cx+2} cy={cy-2} r={1.6} fill="rgba(255,255,255,0.92)"/>
    <circle cx={cx-1.2} cy={cy+1.2} r={0.8} fill="rgba(255,255,255,0.45)"/>
    <path d={`M${cx-6.5},${cy} A6.5,6.5 0 0,1 ${cx+6.5},${cy}`} stroke={lid} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.8"/>
  </>
  if (style === 'almond') return <>
    <path d={`M${cx-7},${cy} Q${cx-2},${cy-5} ${cx+7},${cy} Q${cx+2},${cy+5} ${cx-7},${cy} Z`} fill="white"/>
    <ellipse cx={cx} cy={cy} rx={3.5} ry={3} fill={irisColor}/>
    <ellipse cx={cx} cy={cy} rx={2} ry={1.8} fill="#111"/>
    <circle cx={cx+1.2} cy={cy-1} r={1.1} fill="rgba(255,255,255,0.90)"/>
    <path d={`M${cx-7},${cy} Q${cx},${cy-5.5} ${cx+7},${cy}`} stroke={lid} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7"/>
  </>
  if (style === 'wide') return <>
    <circle cx={cx} cy={cy} r={8} fill="white"/>
    <circle cx={cx} cy={cy} r={5.5} fill={irisColor}/>
    <circle cx={cx} cy={cy} r={3.2} fill="#111"/>
    <circle cx={cx+2.2} cy={cy-2.2} r={2} fill="rgba(255,255,255,0.92)"/>
    <circle cx={cx-1.2} cy={cy+1.5} r={0.9} fill="rgba(255,255,255,0.45)"/>
    <path d={`M${cx-8},${cy} A8,8 0 0,1 ${cx+8},${cy}`} stroke={lid} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.75"/>
  </>
  if (style === 'sleepy') return <>
    <path d={`M${cx-6},${cy} A6,6 0 0,0 ${cx+6},${cy} Z`} fill="white"/>
    <ellipse cx={cx} cy={cy+1} rx={3.5} ry={2} fill={irisColor}/>
    <ellipse cx={cx} cy={cy+1} rx={2} ry={1.2} fill="#111"/>
    <circle cx={cx+1.5} cy={cy} r={0.9} fill="rgba(255,255,255,0.80)"/>
    <path d={`M${cx-6},${cy} Q${cx},${cy-5} ${cx+6},${cy}`} stroke={lid} strokeWidth="2" fill="none" strokeLinecap="round"/>
  </>
  if (style === 'sparkle') return <>
    <circle cx={cx} cy={cy} r={6.5} fill="white"/>
    <circle cx={cx} cy={cy} r={4.5} fill={irisColor}/>
    <circle cx={cx} cy={cy} r={2.8} fill="#111"/>
    <text x={cx} y={cy+3.8} textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.95)">✦</text>
    <path d={`M${cx-6.5},${cy} A6.5,6.5 0 0,1 ${cx+6.5},${cy}`} stroke={lid} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
  </>
  return null
}

// ─── Mouth helpers ────────────────────────────────────────────────────────────

function Mouth({ style }: { style: string }) {
  const line = '#5a3020'
  if (style === 'smile') return <path d="M 50,73 Q 60,81 70,73" stroke={line} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
  if (style === 'grin') return <>
    <path d="M 48,72 Q 60,83 72,72" stroke={line} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <path d="M 50.5,72 Q 60,82 69.5,72" fill="white" opacity="0.75"/>
    <ellipse cx="40" cy="68" rx="7" ry="4.5" fill="rgba(255,120,90,0.20)"/>
    <ellipse cx="80" cy="68" rx="7" ry="4.5" fill="rgba(255,120,90,0.20)"/>
  </>
  if (style === 'smirk') return <path d="M 52,74 Q 61,79 66,72" stroke={line} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
  if (style === 'surprised') return <>
    <ellipse cx="60" cy="75" rx="5.5" ry="6.5" fill={line}/>
    <ellipse cx="60" cy="75" rx="3.5" ry="4.5" fill="rgba(80,30,15,0.85)"/>
  </>
  if (style === 'neutral') return <line x1="52" y1="73" x2="68" y2="73" stroke={line} strokeWidth="2.2" strokeLinecap="round"/>
  if (style === 'beam') return <>
    <path d="M 47,72 Q 60,85 73,72" stroke={line} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M 49.5,72 Q 60,84 70.5,72" fill="white" opacity="0.70"/>
    <ellipse cx="40" cy="67" rx="8" ry="5" fill="rgba(255,100,80,0.18)"/>
    <ellipse cx="80" cy="67" rx="8" ry="5" fill="rgba(255,100,80,0.18)"/>
  </>
  return null
}

// ─── Outfit helpers ───────────────────────────────────────────────────────────

function Outfit({ style, color, solidColor }: { style: string; color: string; solidColor: string }) {
  const dark = darkenColor(solidColor, 0.80)
  const mid  = darkenColor(solidColor, 0.88)
  if (style === 'grove') return (
    <path d="M0,120 L0,98 C18,88 38,84 60,84 C82,84 102,88 120,98 L120,120 Z" fill={color}/>
  )
  if (style === 'spirit') return (
    <path d="M0,120 L0,94 C16,86 36,83 60,83 C84,83 104,86 120,94 L120,120 Z" fill={color}/>
  )
  if (style === 'delivery') return <>
    <path d="M0,120 L0,96 C18,87 38,83 60,83 C82,83 102,87 120,96 L120,120 Z" fill={color}/>
    <path d="M54,83 L54,95 L66,95 L66,83" fill={mid} stroke={dark} strokeWidth="1"/>
    <circle cx="60" cy="90" r="2" fill={dark} opacity="0.6"/>
  </>
  if (style === 'forest') return <>
    <path d="M0,120 L0,93 C15,84 35,80 60,80 C85,80 105,84 120,93 L120,120 Z" fill={color}/>
    <path d="M30,120 L30,88 C42,83 54,82 60,82 C66,82 78,83 90,88 L90,120 Z" fill={mid} opacity="0.45"/>
  </>
  if (style === 'moon') return <>
    <path d="M0,120 L0,92 C18,84 38,81 60,81 C82,81 102,84 120,92 L120,120 Z" fill={color}/>
    <path d="M50,81 Q60,77 70,81 L70,89 Q60,85 50,89 Z" fill={dark} opacity="0.7"/>
    <circle cx="53" cy="95" r="1.5" fill="rgba(255,255,255,0.5)"/>
    <circle cx="60" cy="92" r="1.5" fill="rgba(255,255,255,0.5)"/>
    <circle cx="67" cy="95" r="1.5" fill="rgba(255,255,255,0.5)"/>
  </>
  if (style === 'cozy') return <>
    <path d="M0,120 L0,99 C20,90 40,86 60,86 C80,86 100,90 120,99 L120,120 Z" fill={color}/>
    <path d="M 46,86 L 44,96 M 50,85 L 48,97 M 54,84 L 53,97" stroke={mid} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <path d="M 74,86 L 76,96 M 70,85 L 72,97 M 66,84 L 67,97" stroke={mid} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
  </>
  return null
}

// ─── Accessory helpers ────────────────────────────────────────────────────────

function Accessory({ style, hairColor }: { style: string; hairColor: string }) {
  if (style === 'none') return null
  if (style === 'glasses') return <>
    <circle cx="47" cy="53" r="9" fill="none" stroke="#444" strokeWidth="2"/>
    <circle cx="73" cy="53" r="9" fill="none" stroke="#444" strokeWidth="2"/>
    <circle cx="47" cy="53" r="9" fill="rgba(160,200,255,0.12)"/>
    <circle cx="73" cy="53" r="9" fill="rgba(160,200,255,0.12)"/>
    <line x1="56" y1="53" x2="64" y2="53" stroke="#444" strokeWidth="2"/>
    <line x1="29" y1="53" x2="38" y2="53" stroke="#444" strokeWidth="1.5"/>
    <line x1="82" y1="53" x2="91" y2="53" stroke="#444" strokeWidth="1.5"/>
  </>
  if (style === 'cat-ears') return <>
    <polygon points="35,32 42,18 50,30" fill={hairColor}/>
    <polygon points="70,30 78,18 85,32" fill={hairColor}/>
    <polygon points="38,30 42,23 47,29" fill="#f9a8c9"/>
    <polygon points="73,29 78,23 83,30" fill="#f9a8c9"/>
  </>
  if (style === 'leaf-crown') return <>
    <ellipse cx="60" cy="26" rx="6" ry="10" fill="#5a9e3a" transform="rotate(0,60,26)"/>
    <ellipse cx="44" cy="30" rx="5" ry="9" fill="#4a9030" transform="rotate(-30,44,30)"/>
    <ellipse cx="76" cy="30" rx="5" ry="9" fill="#4a9030" transform="rotate(30,76,30)"/>
    <ellipse cx="34" cy="38" rx="4" ry="8" fill="#5aaa3a" transform="rotate(-55,34,38)"/>
    <ellipse cx="86" cy="38" rx="4" ry="8" fill="#5aaa3a" transform="rotate(55,86,38)"/>
    <path d="M60,26 L60,32 M44,30 L46,36 M76,30 L74,36" stroke="#3a8020" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
    <ellipse cx="60" cy="22" rx="12" ry="3" fill="#6b3a2a" opacity="0.35"/>
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
    {/* center dots */}
    <circle cx="60" cy="24" r="2" fill="#f9d040"/>
    <circle cx="44" cy="30" r="1.8" fill="#f9d040"/>
    <circle cx="76" cy="30" r="1.8" fill="#f9d040"/>
  </>
  if (style === 'star-tiara') return <>
    <ellipse cx="60" cy="28" rx="22" ry="3" fill={darkenColor(hairColor, 0.90)} opacity="0.45"/>
    <text x="60" y="27" textAnchor="middle" fontSize="11" fill="#f9d71c">★</text>
    <text x="44" y="33" textAnchor="middle" fontSize="9" fill="#f9d71c">★</text>
    <text x="76" y="33" textAnchor="middle" fontSize="9" fill="#f9d71c">★</text>
    {/* tiny sparkles */}
    <text x="60" y="27" textAnchor="middle" fontSize="11" fill="rgba(255,255,200,0.6)">★</text>
  </>
  if (style === 'mushroom-hat') return <>
    <rect x="46" y="26" width="28" height="8" rx="3" fill="#e8c8a0"/>
    <ellipse cx="60" cy="26" rx="22" ry="13" fill="#c04040"/>
    <ellipse cx="60" cy="15" rx="14" ry="4" fill="rgba(255,80,60,0.30)"/>
    <circle cx="52" cy="22" r="3.5" fill="rgba(255,255,255,0.75)"/>
    <circle cx="65" cy="18" r="2.8" fill="rgba(255,255,255,0.75)"/>
    <circle cx="70" cy="25" r="2.2" fill="rgba(255,255,255,0.75)"/>
  </>
  if (style === 'butterfly') return <>
    <ellipse cx="88" cy="35" rx="10" ry="7" fill="#a060e0" transform="rotate(-30,88,35)" opacity="0.88"/>
    <ellipse cx="94" cy="44" rx="8" ry="5.5" fill="#c090f8" transform="rotate(20,94,44)" opacity="0.88"/>
    <ellipse cx="88" cy="35" rx="6" ry="4" fill="rgba(255,255,255,0.25)" transform="rotate(-30,88,35)"/>
    <line x1="88" y1="40" x2="84" y2="44" stroke="#7a3ab0" strokeWidth="1.5"/>
    <line x1="88" y1="40" x2="86" y2="45" stroke="#7a3ab0" strokeWidth="1.5"/>
  </>
  return null
}

// ─── AvatarSvg ────────────────────────────────────────────────────────────────

export function AvatarSvg({ config, size }: { config: RichAvatarConfig; size: number }) {
  const uid = useRef(`av${++_avUid}`).current
  const { skinTone, hairStyle, hairColor, eyeStyle, eyeColor, mouth, outfit, outfitColor, accessory, bgColor } = config
  const skinDark  = darkenColor(skinTone, 0.87)
  const skinShine = lightenColor(skinTone, 1.10)
  const noseTone  = darkenColor(skinTone, 0.76)
  const bgShine   = lightenColor(bgColor, 1.20)
  const bgDeep    = darkenColor(bgColor, 0.78)
  const hairDark  = darkenColor(hairColor, 0.72)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        {/* Background radial gradient — bright upper-left to deep lower-right */}
        <radialGradient id={`${uid}bg`} cx="38%" cy="30%" r="68%">
          <stop offset="0%"   stopColor={bgShine}/>
          <stop offset="100%" stopColor={bgDeep}/>
        </radialGradient>
        {/* Vignette inner shadow */}
        <radialGradient id={`${uid}vg`} cx="50%" cy="50%" r="50%">
          <stop offset="70%"  stopColor="rgba(0,0,0,0)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0.20)"/>
        </radialGradient>
        {/* Face radial gradient — warm highlight at brow, cool at jaw */}
        <radialGradient id={`${uid}fc`} cx="42%" cy="26%" r="72%">
          <stop offset="0%"   stopColor={skinShine}/>
          <stop offset="100%" stopColor={skinDark}/>
        </radialGradient>
        {/* Hair shine overlay */}
        <radialGradient id={`${uid}hs`} cx="46%" cy="18%" r="58%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.32)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>
        {/* Outfit vertical gradient */}
        <linearGradient id={`${uid}ot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={lightenColor(outfitColor, 1.14)}/>
          <stop offset="100%" stopColor={darkenColor(outfitColor, 0.78)}/>
        </linearGradient>
        {/* Ear inner gradient */}
        <radialGradient id={`${uid}er`} cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor={darkenColor(skinTone, 0.82)}/>
          <stop offset="100%" stopColor={darkenColor(skinTone, 0.68)}/>
        </radialGradient>
      </defs>

      {/* 1. Background */}
      <circle cx="60" cy="60" r="60" fill={`url(#${uid}bg)`}/>
      {/* Vignette */}
      <circle cx="60" cy="60" r="60" fill={`url(#${uid}vg)`}/>

      {/* 2. Outfit — rendered twice: base gradient then detail layer */}
      <Outfit style={outfit} color={`url(#${uid}ot)`} solidColor={outfitColor}/>

      {/* 3. Neck */}
      <rect x="53" y="80" width="14" height="12" rx="4" fill={skinTone}/>
      <rect x="53" y="87" width="14" height="5" rx="2" fill={darkenColor(skinTone, 0.84)} opacity="0.35"/>

      {/* 4. Ears */}
      <ellipse cx="33" cy="63" rx="6.5" ry="7.5" fill={skinTone}/>
      <ellipse cx="87" cy="63" rx="6.5" ry="7.5" fill={skinTone}/>
      <ellipse cx="33" cy="63" rx="4"   ry="5"   fill={`url(#${uid}er)`}/>
      <ellipse cx="87" cy="63" rx="4"   ry="5"   fill={`url(#${uid}er)`}/>
      <ellipse cx="33" cy="62" rx="2.2" ry="2.8" fill={darkenColor(skinTone, 0.70)} opacity="0.6"/>
      <ellipse cx="87" cy="62" rx="2.2" ry="2.8" fill={darkenColor(skinTone, 0.70)} opacity="0.6"/>

      {/* 5. Hair back */}
      <HairBack style={hairStyle} color={hairColor}/>

      {/* 6. Head with gradient */}
      <ellipse cx="60" cy="57" rx="26" ry="27" fill={`url(#${uid}fc)`}/>

      {/* Jaw shadow */}
      <ellipse cx="60" cy="81" rx="18" ry="4.5" fill={darkenColor(skinTone, 0.80)} opacity="0.22"/>

      {/* Blush cheeks */}
      <ellipse cx="40" cy="65" rx="9"   ry="5.5" fill="rgba(255,110,85,0.14)"/>
      <ellipse cx="80" cy="65" rx="9"   ry="5.5" fill="rgba(255,110,85,0.14)"/>

      {/* 7. Eyes */}
      <Eye cx={47} cy={53} style={eyeStyle} irisColor={eyeColor}/>
      <Eye cx={73} cy={53} style={eyeStyle} irisColor={eyeColor}/>

      {/* 8. Eyebrows — slightly arched */}
      <path d="M 40,47 Q 47,42.5 53,46" stroke={hairDark} strokeWidth="2.6" fill="none" strokeLinecap="round"/>
      <path d="M 67,46 Q 73,42.5 80,47" stroke={hairDark} strokeWidth="2.6" fill="none" strokeLinecap="round"/>

      {/* 9. Nose — subtle curved bridge */}
      <path d="M 58,63 Q 55.5,68 58,70.5 Q 60,71.5 62,70.5 Q 64.5,68 62,63"
        stroke={noseTone} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.55"/>

      {/* 10. Mouth */}
      <Mouth style={mouth}/>

      {/* 11. Hair front */}
      <HairFront style={hairStyle} color={hairColor}/>
      {/* Hair shine overlay */}
      <HairFront style={hairStyle} color={`url(#${uid}hs)`}/>

      {/* 12. Accessories */}
      <Accessory style={accessory} hairColor={hairColor}/>

      {/* 13. Rim highlight — soft upper-left catch light */}
      <ellipse cx="43" cy="35" rx="13" ry="7" fill="rgba(255,255,255,0.17)" transform="rotate(-28,43,35)"/>
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
        width: 30, height: 30, borderRadius: 999,
        background: color, cursor: 'pointer', padding: 0,
        border: selected ? '3px solid var(--accent)' : '2px solid var(--border)',
        boxShadow: selected ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${color}44` : '0 1px 3px rgba(0,0,0,0.15)',
        transform: selected ? 'scale(1.18)' : 'scale(1)',
        transition: 'transform 0.12s, box-shadow 0.12s, border-color 0.12s',
        flexShrink: 0, position: 'relative',
      }}
    >
      {selected && (
        <span style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, color: 'rgba(255,255,255,0.9)',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>✓</span>
      )}
    </button>
  )
}

function Chip({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        padding: '5px 12px',
        borderRadius: uiRadius.pill,
        border: selected ? '2px solid var(--accent)' : '1.5px solid var(--border)',
        background: selected
          ? 'linear-gradient(135deg, var(--bg-accent-soft), var(--bg-badge))'
          : 'var(--bg-surface)',
        color: selected ? 'var(--accent-dark)' : 'var(--text-body)',
        cursor: 'pointer',
        fontSize: uiType.small,
        fontFamily: bodyFontFamily,
        fontWeight: selected ? 700 : 500,
        boxShadow: selected ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
        transition: 'all 0.12s',
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
      margin: '12px 0 6px',
      fontSize: uiType.micro,
      fontWeight: 800,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      fontFamily: bodyFontFamily,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <span style={{ opacity: 0.45, fontSize: 8 }}>◆</span>
      {children}
    </p>
  )
}

function SwatchRow({ colors, selected, onSelect }: { colors: string[]; selected: string; onSelect: (c: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
      0%   { box-shadow: 0 0 0 0 rgba(173,193,120,0.60); }
      50%  { box-shadow: 0 0 0 14px rgba(173,193,120,0); }
      100% { box-shadow: 0 0 0 0 rgba(173,193,120,0); }
    }
    .ww-avatar-preview-pulse { animation: ww-avatar-pulse 0.55s ease-out; }
    @keyframes ww-dice-spin {
      0%   { transform: rotate(0deg) scale(1); }
      40%  { transform: rotate(180deg) scale(1.2); }
      100% { transform: rotate(360deg) scale(1); }
    }
    .ww-dice-spinning { animation: ww-dice-spin 0.45s ease-in-out; }
    .ww-av-tab:hover { opacity: 0.85; }
    .ww-av-chip:hover { filter: brightness(1.05); }
  `
  document.head.appendChild(el)
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab = 'face' | 'hair' | 'outfit' | 'extras' | 'background'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'face',       label: 'Face',       icon: '✦' },
  { id: 'hair',       label: 'Hair',       icon: '✿' },
  { id: 'outfit',     label: 'Outfit',     icon: '☘' },
  { id: 'extras',     label: 'Extras',     icon: '★' },
  { id: 'background', label: 'Background', icon: '◈' },
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

  // Glow ring color derived from avatar bg
  const glowColor = value.bgColor + '88'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: uiSpace.md,
      padding: uiSpace.md,
      borderRadius: uiRadius.lg,
      background: 'var(--bg-badge)',
      border: '1px solid var(--border-muted)',
    }}>

      {/* ── Preview ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        paddingTop: 4,
      }}>
        {/* Glow ring around avatar */}
        <div style={{
          borderRadius: 999,
          padding: 5,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 75%)`,
          transition: 'background 0.4s ease',
        }}>
          <div
            key={pulseKey}
            className="ww-avatar-preview-pulse"
            style={{
              borderRadius: 999,
              overflow: 'hidden',
              lineHeight: 0,
              boxShadow: `0 4px 24px ${glowColor}, 0 2px 8px rgba(0,0,0,0.18)`,
              transition: 'box-shadow 0.4s ease',
            }}
          >
            <AvatarSvg config={value} size={210}/>
          </div>
        </div>

        {/* Randomize button */}
        <button
          onClick={handleRandomize}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 20px',
            borderRadius: uiRadius.pill,
            border: '1.5px solid var(--border)',
            background: 'linear-gradient(135deg, var(--bg-surface), var(--bg-badge))',
            color: 'var(--text-body)',
            cursor: 'pointer',
            fontFamily: bodyFontFamily,
            fontSize: uiType.small,
            fontWeight: 700,
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            transition: 'box-shadow 0.15s',
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
          letterSpacing: '0.02em',
        }}>
          Mix and match to craft your grove look
        </p>
      </div>

      {/* ── Divider ── */}
      <div style={{ width: '100%', height: 1, background: 'var(--border-muted)', borderRadius: 1 }}/>

      {/* ── Tabs + Options ── */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: uiSpace.sm }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className="ww-av-tab"
              onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px',
                borderRadius: uiRadius.pill,
                border: tab === t.id ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                background: tab === t.id
                  ? 'linear-gradient(135deg, var(--bg-accent-soft), var(--bg-badge))'
                  : 'var(--bg-surface)',
                color: tab === t.id ? 'var(--accent-dark)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: uiType.small,
                fontFamily: bodyFontFamily,
                fontWeight: tab === t.id ? 700 : 500,
                boxShadow: tab === t.id ? '0 1px 6px rgba(0,0,0,0.12)' : 'none',
                transition: 'all 0.12s',
              }}
            >
              <span style={{ fontSize: 10, opacity: tab === t.id ? 1 : 0.6 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Options panel */}
        <div style={{
          maxHeight: 360,
          overflowY: 'auto',
          padding: '2px 4px 6px',
          display: 'flex',
          flexDirection: 'column',
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 2 }}>
              {BG_COLORS.map(c => (
                <button
                  key={c}
                  aria-label={`Background ${c}`}
                  onClick={() => update({ bgColor: c })}
                  style={{
                    width: 42, height: 42,
                    borderRadius: uiRadius.md,
                    background: `radial-gradient(circle at 35% 30%, ${lightenColor(c, 1.20)}, ${darkenColor(c, 0.82)})`,
                    cursor: 'pointer', padding: 0,
                    border: value.bgColor === c ? '3px solid var(--accent)' : '2px solid var(--border)',
                    boxShadow: value.bgColor === c
                      ? `0 0 0 2px var(--bg-surface), 0 2px 8px ${c}66`
                      : '0 1px 3px rgba(0,0,0,0.12)',
                    transform: value.bgColor === c ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform 0.12s, box-shadow 0.12s, border-color 0.12s',
                    position: 'relative',
                  }}
                >
                  {value.bgColor === c && (
                    <span style={{
                      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 13, color: 'rgba(255,255,255,0.9)',
                      textShadow: '0 1px 3px rgba(0,0,0,0.55)', pointerEvents: 'none',
                    }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}
