/* eslint-disable react-refresh/only-export-components -- renderer options and color helpers are shared by the avatar studio */
import { useId } from 'react'

export type RichAvatarConfig = {
  skinTone: string
  faceShape: string
  hairStyle: string
  hairColor: string
  eyeStyle: string
  eyeColor: string
  browStyle: string
  mouth: string
  outfit: string
  outfitColor: string
  accessory: string
  bgColor: string
}

export const DEFAULT_RICH_AVATAR: RichAvatarConfig = {
  skinTone: '#F5C89A',
  faceShape: 'soft',
  hairStyle: 'layered',
  hairColor: '#3D1C02',
  eyeStyle: 'anime',
  eyeColor: '#3A6B3A',
  browStyle: 'soft',
  mouth: 'soft-smile',
  outfit: 'grove',
  outfitColor: '#5A9030',
  accessory: 'leaf-pin',
  bgColor: '#ADC178',
}

export const AVATAR_OPTIONS = {
  skinTones: ['#FFE0C2', '#F5C89A', '#E8A87C', '#C9895B', '#A86F46', '#7A4B30', '#4B2D20'],
  hairColors: ['#17110E', '#3D1C02', '#69402E', '#A74F34', '#D9822B', '#E7C979', '#C7B7C4', '#F2F0E9', '#405F86', '#84549D', '#D76E89', '#37816B'],
  eyeColors: ['#302018', '#5B3A24', '#3A6B3A', '#39758B', '#405C9B', '#74519B', '#B07827', '#B44D4D'],
  backgroundColors: ['#ADC178', '#A8DADC', '#F3B6C6', '#E8C78F', '#8B8BB8', '#C6CF79', '#E9B84A', '#78A9D1', '#B594CF', '#6E9D7D', '#C98578', '#758AA8'],
  outfitColors: ['#5A9030', '#6F4A91', '#C8761A', '#2E7045', '#253A73', '#D56F88', '#744534', '#398399'],
  faceShapes: ['soft', 'oval', 'heart', 'round', 'angular'],
  hairStyles: ['pixie', 'short', 'bob', 'layered', 'curtain', 'long', 'wavy', 'curly', 'wolfcut', 'ponytail', 'bun', 'braids', 'twintails', 'buzz', 'medium'],
  eyeStyles: ['anime', 'soft', 'almond', 'upturned', 'downturned', 'wide', 'sleepy', 'sparkle', 'closed', 'round'],
  browStyles: ['soft', 'straight', 'arched', 'bold', 'worried'],
  mouths: ['soft-smile', 'open-smile', 'grin', 'smirk', 'pout', 'surprised', 'neutral', 'beam', 'smile'],
  outfits: ['grove', 'spirit', 'delivery', 'forest', 'moon', 'cozy'],
  accessories: ['none', 'leaf-pin', 'ribbon', 'leaf-crown', 'flower-crown', 'glasses', 'cat-ears', 'star-tiara', 'mushroom-hat', 'butterfly', 'headphones', 'moon-pin'],
} as const

export const AVATAR_LABELS: Record<string, string> = {
  soft: 'Soft', oval: 'Oval', heart: 'Heart', round: 'Round', angular: 'Sculpted',
  pixie: 'Pixie', short: 'Tousled', bob: 'Soft Bob', layered: 'Layered', curtain: 'Curtain',
  long: 'Long', wavy: 'Waves', curly: 'Curls', wolfcut: 'Wolf Cut', ponytail: 'Ponytail',
  bun: 'Soft Bun', braids: 'Braids', twintails: 'Twin Tails', buzz: 'Buzz', medium: 'Classic',
  anime: 'Luminous', almond: 'Almond', upturned: 'Upturned', downturned: 'Gentle', wide: 'Wonder',
  sleepy: 'Dreamy', sparkle: 'Starlit', closed: 'Joyful',
  straight: 'Straight', arched: 'Arched', bold: 'Bold', worried: 'Tender',
  'soft-smile': 'Soft Smile', 'open-smile': 'Open Smile', grin: 'Grin', smirk: 'Smirk',
  pout: 'Pout', surprised: 'Surprised', neutral: 'Calm', beam: 'Beaming', smile: 'Classic Smile',
  grove: 'Grove Keeper', spirit: 'Spirit Robe', delivery: 'Wind Courier', forest: 'Forest Cloak',
  moon: 'Moon Weaver', cozy: 'Cozy Knit', none: 'None', 'leaf-pin': 'Leaf Pin', ribbon: 'Ribbon',
  'leaf-crown': 'Leaf Crown', 'flower-crown': 'Flower Crown', glasses: 'Round Glasses',
  'cat-ears': 'Cat Ears', 'star-tiara': 'Star Tiara', 'mushroom-hat': 'Mushroom Cap',
  butterfly: 'Butterfly', headphones: 'Headphones', 'moon-pin': 'Moon Pin',
}

function normalizeHex(hex: string) {
  const clean = hex.replace('#', '')
  if (/^[0-9a-f]{3}$/i.test(clean)) return clean.split('').map((c) => c + c).join('')
  return /^[0-9a-f]{6}$/i.test(clean) ? clean : '888888'
}

export function shade(hex: string, factor: number) {
  const clean = normalizeHex(hex)
  const channel = (start: number) => Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(start, start + 2), 16) * factor)))
  return `#${[channel(0), channel(2), channel(4)].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

const FACE_PATHS: Record<string, string> = {
  soft: 'M60 27 C42 27 31 38 32 57 C33 74 42 85 60 89 C78 85 87 74 88 57 C89 38 78 27 60 27 Z',
  oval: 'M60 26 C44 26 33 37 34 56 C35 76 45 88 60 91 C75 88 85 76 86 56 C87 37 76 26 60 26 Z',
  heart: 'M60 28 C42 24 30 38 32 56 C34 72 43 83 60 91 C77 83 86 72 88 56 C90 38 78 24 60 28 Z',
  round: 'M60 28 C42 28 31 39 31 58 C31 76 42 87 60 88 C78 87 89 76 89 58 C89 39 78 28 60 28 Z',
  angular: 'M60 27 C43 27 32 38 33 56 L37 73 L49 85 L60 90 L71 85 L83 73 L87 56 C88 38 77 27 60 27 Z',
}

function HairBack({ style, color }: { style: string; color: string }) {
  const dark = shade(color, 0.7)
  if (['long', 'medium', 'layered', 'curtain'].includes(style)) return <>
    <path d="M31 40 C22 55 24 91 20 112 C31 117 42 112 45 101 L42 42 Z" fill={dark}/>
    <path d="M89 40 C98 55 96 91 100 112 C89 117 78 112 75 101 L78 42 Z" fill={dark}/>
  </>
  if (style === 'wavy' || style === 'wolfcut') return <>
    <path d="M34 35 C22 44 27 57 20 68 C29 76 19 90 27 103 C22 111 28 117 39 113 C47 96 42 67 44 41 Z" fill={dark}/>
    <path d="M86 35 C98 44 93 57 100 68 C91 76 101 90 93 103 C98 111 92 117 81 113 C73 96 78 67 76 41 Z" fill={dark}/>
  </>
  if (style === 'bob') return <path d="M29 36 C21 48 24 77 31 91 C38 94 43 90 45 82 L43 39 Z M91 36 C99 48 96 77 89 91 C82 94 77 90 75 82 L77 39 Z" fill={dark}/>
  if (style === 'curly') return <>
    <path d="M25 42 C16 55 24 77 21 96 C27 109 40 112 47 102 L43 45 Z" fill={dark}/>
    <path d="M95 42 C104 55 96 77 99 96 C93 109 80 112 73 102 L77 45 Z" fill={dark}/>
    {[30, 38, 82, 90].map((cx, i) => <circle key={cx} cx={cx} cy={48 + (i % 2) * 13} r="12" fill={color}/>)}
  </>
  if (style === 'ponytail') return <>
    <path d="M78 32 C99 34 105 48 93 62 C104 75 95 91 79 86 C86 69 80 50 72 40 Z" fill={dark}/>
    <path d="M82 37 C96 41 98 49 90 59 C96 68 90 77 82 76 C87 61 82 48 76 42 Z" fill={color}/>
  </>
  if (style === 'bun') return <>
    <circle cx="62" cy="18" r="17" fill={dark}/>
    <path d="M49 18 C52 7 69 3 77 14 C73 8 59 10 55 23 Z" fill={color}/>
  </>
  if (style === 'braids') return <>
    <path d="M31 46 C23 59 25 80 29 96 C24 102 29 109 35 105 C30 98 39 94 34 88 C41 82 33 77 38 70 C42 59 40 49 41 42 Z" fill={dark}/>
    <path d="M89 46 C97 59 95 80 91 96 C96 102 91 109 85 105 C90 98 81 94 86 88 C79 82 87 77 82 70 C78 59 80 49 79 42 Z" fill={dark}/>
    <path d="M31 60 Q40 65 31 70 Q40 75 31 80 Q40 85 31 91" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round"/>
    <path d="M89 60 Q80 65 89 70 Q80 75 89 80 Q80 85 89 91" stroke={color} strokeWidth="7" fill="none" strokeLinecap="round"/>
  </>
  if (style === 'twintails') return <>
    <path d="M34 38 C15 42 12 61 25 73 C13 84 20 103 39 96 C32 77 36 59 44 44 Z" fill={dark}/>
    <path d="M86 38 C105 42 108 61 95 73 C107 84 100 103 81 96 C88 77 84 59 76 44 Z" fill={dark}/>
  </>
  return null
}

function HairFront({ style, color }: { style: string; color: string }) {
  const dark = shade(color, 0.72)
  const light = shade(color, 1.18)
  if (style === 'buzz') return <>
    <path d="M34 43 C33 22 49 15 62 16 C77 16 88 27 86 44 C70 34 50 34 34 43 Z" fill={color}/>
    <path d="M40 32 Q58 20 78 31" stroke={light} strokeWidth="2.5" fill="none" opacity="0.35"/>
  </>
  if (style === 'pixie') return <>
    <path d="M31 45 C29 28 40 17 57 18 C73 14 88 25 88 43 L80 38 L75 47 L67 35 L60 45 L51 34 L43 45 L38 36 Z" fill={color}/>
    <path d="M38 29 Q55 17 72 23" stroke={light} strokeWidth="3" fill="none" opacity="0.28"/>
  </>
  if (style === 'short') return <>
    <path d="M31 45 C27 31 38 17 53 19 C62 12 80 20 86 32 L91 43 L82 40 L78 48 L69 37 L61 46 L51 36 L42 47 L39 38 Z" fill={color}/>
    <path d="M39 29 Q58 16 78 27" stroke={light} strokeWidth="3" fill="none" opacity="0.28"/>
  </>

  const crown = <>
    <path d="M29 47 C26 28 39 15 59 16 C79 15 93 29 90 49 C82 42 76 36 68 32 C61 42 51 47 38 49 L34 56 Z" fill={color}/>
    <path d="M38 30 C49 20 67 17 81 29" stroke={light} strokeWidth="3.2" fill="none" opacity="0.27" strokeLinecap="round"/>
  </>
  if (style === 'curly') return <>
    {[38, 49, 61, 73, 83].map((cx, i) => <circle key={cx} cx={cx} cy={27 + (i % 2) * 3} r="13" fill={color}/>)}
    <circle cx="32" cy="43" r="12" fill={color}/><circle cx="88" cy="43" r="12" fill={color}/>
    <path d="M38 24 Q55 13 76 23" stroke={light} strokeWidth="3" fill="none" opacity="0.25"/>
  </>
  if (style === 'curtain' || style === 'long' || style === 'medium' || style === 'braids') return <>
    {crown}
    <path d="M59 17 C50 26 44 35 37 48 C46 45 54 40 60 31" fill={dark}/>
    <path d="M61 17 C70 26 77 35 84 48 C74 44 67 39 60 31" fill={color}/>
    <path d="M60 19 L60 37" stroke={light} strokeWidth="1.5" opacity="0.24"/>
  </>
  if (style === 'layered' || style === 'wolfcut') return <>
    {crown}
    <path d="M30 43 L38 53 L43 42 L49 50 L55 37 L61 46 L68 34 L73 45 L81 36 L90 48 C84 30 75 22 61 20 C46 21 36 29 30 43 Z" fill={color}/>
    {style === 'wolfcut' && <path d="M32 52 L25 65 L38 61 L31 76 L45 68 M88 52 L95 65 L82 61 L89 76 L75 68" stroke={dark} strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>}
  </>
  if (style === 'wavy') return <>
    {crown}
    <path d="M32 42 C42 39 42 50 51 44 C58 39 57 31 63 29 C69 36 70 44 79 47 C85 49 87 43 91 40 L87 31 C71 16 45 16 32 31 Z" fill={color}/>
  </>
  if (style === 'ponytail' || style === 'bun') return <>
    {crown}
    <path d="M34 45 C49 41 60 31 70 20 C72 34 80 41 87 46 C76 42 66 37 61 30 C54 39 46 45 34 50 Z" fill={dark}/>
  </>
  if (style === 'twintails') return <>
    {crown}
    <path d="M31 44 C44 42 52 34 58 22 C55 37 67 44 88 47 C83 27 72 18 59 18 C44 18 34 27 31 44 Z" fill={color}/>
  </>
  if (style === 'bob') return <>
    {crown}
    <path d="M30 42 C27 57 29 74 36 84 L42 78 L40 48 Z M90 42 C93 57 91 74 84 84 L78 78 L80 48 Z" fill={color}/>
    <path d="M37 43 Q48 41 58 27 Q61 41 84 46" stroke={dark} strokeWidth="5" fill="none" strokeLinecap="round"/>
  </>
  return crown
}

function Eye({ cx, style, irisColor }: { cx: number; style: string; irisColor: string }) {
  const cy = 55
  const outer = cx < 60 ? -1 : 1
  const ink = '#3A2824'
  if (style === 'closed') return <>
    <path d={`M${cx - 7} ${cy} Q${cx} ${cy + 6} ${cx + 7} ${cy}`} stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    <path d={`M${cx + outer * 6} ${cy + 1} l${outer * 3} 2`} stroke={ink} strokeWidth="1.3" strokeLinecap="round"/>
  </>

  let eyePath = `M${cx - 8} ${cy} Q${cx} ${cy - 8} ${cx + 8} ${cy} Q${cx} ${cy + 7} ${cx - 8} ${cy} Z`
  let irisRy = 5.3
  if (style === 'almond') eyePath = `M${cx - 8} ${cy} Q${cx} ${cy - 5.5} ${cx + 8} ${cy} Q${cx} ${cy + 4.5} ${cx - 8} ${cy} Z`
  if (style === 'upturned') eyePath = `M${cx - 8} ${cy + 1} Q${cx} ${cy - 6} ${cx + 8} ${cy - 2} Q${cx} ${cy + 5} ${cx - 8} ${cy + 1} Z`
  if (style === 'downturned') eyePath = `M${cx - 8} ${cy - 2} Q${cx} ${cy - 6} ${cx + 8} ${cy + 1} Q${cx} ${cy + 6} ${cx - 8} ${cy - 2} Z`
  if (style === 'sleepy') { eyePath = `M${cx - 8} ${cy} Q${cx} ${cy - 4} ${cx + 8} ${cy} Q${cx} ${cy + 3} ${cx - 8} ${cy} Z`; irisRy = 3.5 }
  if (style === 'wide') { eyePath = `M${cx - 8} ${cy} Q${cx} ${cy - 10} ${cx + 8} ${cy} Q${cx} ${cy + 9} ${cx - 8} ${cy} Z`; irisRy = 6.4 }
  if (style === 'round') { eyePath = `M${cx - 7} ${cy} Q${cx} ${cy - 8} ${cx + 7} ${cy} Q${cx} ${cy + 8} ${cx - 7} ${cy} Z`; irisRy = 5.8 }

  const irisRx = style === 'anime' || style === 'sparkle' ? 4.8 : 4.1
  return <>
    <path d={eyePath} fill="#FFFCF6" stroke={ink} strokeWidth="1.45" strokeLinejoin="round"/>
    <ellipse cx={cx} cy={cy + 0.5} rx={irisRx} ry={irisRy} fill={irisColor}/>
    <ellipse cx={cx} cy={cy + 1} rx="2.35" ry={Math.max(2.7, irisRy - 1.8)} fill="#171312"/>
    <ellipse cx={cx - 1.5} cy={cy - 1.7} rx="1.55" ry="1.9" fill="#fff" opacity="0.96"/>
    <circle cx={cx + 1.7} cy={cy + 2.2} r="0.8" fill="#fff" opacity="0.68"/>
    {(style === 'anime' || style === 'sparkle') && <path d={`M${cx - 3.5} ${cy + 4} Q${cx} ${cy + 6.5} ${cx + 3.5} ${cy + 4}`} stroke={shade(irisColor, 1.45)} strokeWidth="1" fill="none" opacity="0.75"/>}
    {style === 'sparkle' && <path d={`M${cx + 1} ${cy - 4} v4 M${cx - 1} ${cy - 2} h4`} stroke="#fff" strokeWidth="1" strokeLinecap="round"/>}
    <path d={`M${cx - 8} ${cy} Q${cx} ${cy - (style === 'wide' ? 10 : 7)} ${cx + 8} ${cy + (style === 'upturned' ? -2 : 0)}`} stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d={`M${cx + outer * 7} ${cy - 1} l${outer * 3} -2 M${cx + outer * 7} ${cy} l${outer * 3} 0`} stroke={ink} strokeWidth="1.15" strokeLinecap="round"/>
  </>
}

function Brows({ style, color }: { style: string; color: string }) {
  const strokeWidth = style === 'bold' ? 3.2 : 2.2
  const paths: Record<string, [string, string]> = {
    soft: ['M39 46 Q47 42 54 46', 'M66 46 Q73 42 81 46'],
    straight: ['M39 45 Q47 44 54 45', 'M66 45 Q73 44 81 45'],
    arched: ['M39 47 Q47 39 54 45', 'M66 45 Q73 39 81 47'],
    bold: ['M38 46 Q47 41 55 45', 'M65 45 Q73 41 82 46'],
    worried: ['M39 44 Q47 43 54 48', 'M66 48 Q73 43 81 44'],
  }
  const [left, right] = paths[style] ?? paths.soft
  return <><path d={left} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round"/><path d={right} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round"/></>
}

function Mouth({ style }: { style: string }) {
  const ink = '#713D3D'
  const lip = '#B85F68'
  if (style === 'soft-smile' || style === 'smile') return <>
    <path d="M51 74 Q60 80 69 74" stroke={ink} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <path d="M55 78 Q60 80 65 78" stroke={lip} strokeWidth="1" opacity="0.65" fill="none"/>
  </>
  if (style === 'open-smile' || style === 'beam') return <>
    <path d="M49 73 Q60 85 71 73 Q60 78 49 73 Z" fill="#7A3E43"/>
    <path d="M51 74 Q60 78 69 74" fill="#FFF8ED"/>
    <path d="M55 81 Q60 78 65 81" fill="#E88B93"/>
  </>
  if (style === 'grin') return <>
    <path d="M49 73 Q60 83 71 73 Q60 78 49 73 Z" fill="#FFF9EF" stroke={ink} strokeWidth="1.2"/>
    <path d="M51 74 Q60 78 69 74" stroke="#D6C3B5" strokeWidth="0.7" fill="none"/>
  </>
  if (style === 'smirk') return <path d="M52 76 Q61 79 68 72" stroke={ink} strokeWidth="1.9" fill="none" strokeLinecap="round"/>
  if (style === 'pout') return <>
    <path d="M53 75 Q60 70 67 75 Q60 81 53 75 Z" fill={lip} opacity="0.85"/>
    <path d="M54 75 Q60 76 66 75" stroke={ink} strokeWidth="0.8" fill="none"/>
  </>
  if (style === 'surprised') return <ellipse cx="60" cy="76" rx="4.7" ry="6" fill="#733D42"/>
  if (style === 'neutral') return <path d="M53 75 Q60 74 67 75" stroke={ink} strokeWidth="1.7" fill="none" strokeLinecap="round"/>
  return null
}

function Outfit({ style, color }: { style: string; color: string }) {
  const dark = shade(color, 0.72)
  const light = shade(color, 1.2)
  const shoulders = <path d="M2 120 V103 C14 91 37 87 50 86 H70 C83 87 106 91 118 103 V120 Z" fill={color}/>
  if (style === 'spirit') return <>{shoulders}<path d="M43 88 Q60 102 77 88 L83 120 H37 Z" fill={light} opacity="0.28"/><path d="M50 88 Q60 96 70 88" stroke="#F5E8CE" strokeWidth="2" fill="none"/></>
  if (style === 'delivery') return <>{shoulders}<path d="M39 91 L55 104 L51 120 H31 Z M81 91 L65 104 L69 120 H89 Z" fill={dark}/><path d="M55 88 L60 101 L65 88" fill="#F1D8B5"/><circle cx="60" cy="108" r="2" fill="#E8C25B"/></>
  if (style === 'forest') return <>{shoulders}<path d="M22 101 Q60 77 98 101 L91 120 H29 Z" fill={dark} opacity="0.78"/><path d="M50 90 Q60 99 70 90" stroke="#D8C39C" strokeWidth="3" fill="none"/><path d="M60 98 q7 6 0 13 q-7-7 0-13" fill="#8FC66A"/></>
  if (style === 'moon') return <>{shoulders}<path d="M42 91 Q60 102 78 91 L82 120 H38 Z" fill={dark} opacity="0.48"/><path d="M58 103 a7 7 0 1 0 7 -7 a5.5 5.5 0 1 1 -7 7" fill="#F5DA79"/><circle cx="45" cy="107" r="1" fill="#fff"/><circle cx="77" cy="111" r="1.2" fill="#fff"/></>
  if (style === 'cozy') return <>{shoulders}<path d="M44 88 Q60 99 76 88" stroke={dark} strokeWidth="6" fill="none" strokeLinecap="round"/><path d="M25 106 H95 M28 114 H92" stroke={light} strokeWidth="1.5" opacity="0.45"/></>
  return <>{shoulders}<path d="M49 88 Q60 98 71 88" stroke={dark} strokeWidth="2.5" fill="none"/><path d="M60 101 C67 94 73 98 69 104 C66 108 62 110 60 112 C58 110 54 108 51 104 C47 98 53 94 60 101 Z" fill="#CFE79C" opacity="0.85"/></>
}

function Accessory({ style, hairColor }: { style: string; hairColor: string }) {
  if (style === 'none') return null
  if (style === 'leaf-pin') return <><path d="M80 35 Q91 27 94 39 Q85 43 80 35 Z" fill="#77B45B"/><path d="M81 36 L91 33" stroke="#3E7D43" strokeWidth="1"/></>
  if (style === 'ribbon') return <><circle cx="87" cy="38" r="3" fill="#F5C7D6"/><path d="M86 39 Q76 33 77 45 Q84 44 87 40 M89 39 Q99 33 98 45 Q91 44 88 40" fill="#DB708D"/></>
  if (style === 'glasses') return <><path d="M37 55 Q46 48 55 55 Q54 65 46 65 Q38 64 37 55 Z M65 55 Q74 48 83 55 Q82 65 74 65 Q66 64 65 55 Z" fill="rgba(170,215,235,.12)" stroke="#493A38" strokeWidth="1.8"/><path d="M55 55 Q60 52 65 55 M37 55 L30 52 M83 55 L90 52" stroke="#493A38" strokeWidth="1.6" fill="none"/></>
  if (style === 'cat-ears') return <><path d="M34 34 L40 15 L52 31 Z M68 31 L80 15 L87 35 Z" fill={hairColor} stroke={shade(hairColor,.65)} strokeWidth="1.4"/><path d="M39 29 L41 21 L47 29 M73 29 L79 21 L82 30" fill="#E9A9B1"/></>
  if (style === 'leaf-crown') return <>{[[-24,-35,-28],[-12,-42,-16],[0,-45,0],[12,-42,16],[24,-35,28]].map(([x,y,r]) => <ellipse key={x} cx={60+x} cy={60+y} rx="4.5" ry="9" fill={x % 24 === 0 ? '#5F9C4B' : '#83B85D'} transform={`rotate(${r} ${60+x} ${60+y})`}/>)}</>
  if (style === 'flower-crown') return <><path d="M37 31 Q60 18 83 31" stroke="#54884A" strokeWidth="3" fill="none"/>{[42,60,78].map((cx,i) => <g key={cx}><circle cx={cx-3} cy={27-i%2*3} r="4" fill="#F59BB8"/><circle cx={cx+3} cy={27-i%2*3} r="4" fill="#F4C0D2"/><circle cx={cx} cy={23-i%2*3} r="4" fill="#FFADC6"/><circle cx={cx} cy={27-i%2*3} r="2" fill="#F5D867"/></g>)}</>
  if (style === 'star-tiara') return <><path d="M38 33 Q60 20 82 33" stroke="#E8B94A" strokeWidth="2" fill="none"/><path d="M60 16 L63 23 L71 24 L65 29 L67 37 L60 33 L53 37 L55 29 L49 24 L57 23 Z" fill="#F6D56C" stroke="#C38A2D" strokeWidth="1"/></>
  if (style === 'mushroom-hat') return <><path d="M45 31 Q60 39 75 31 L72 39 H48 Z" fill="#EAC99E"/><path d="M35 29 C38 9 82 7 87 29 Q60 37 35 29 Z" fill="#C95852"/><circle cx="51" cy="20" r="4" fill="#F9E5D0"/><circle cx="68" cy="15" r="3" fill="#F9E5D0"/><circle cx="76" cy="25" r="2.5" fill="#F9E5D0"/></>
  if (style === 'butterfly') return <><path d="M87 35 C80 24 72 27 78 38 C71 43 78 50 87 41 C96 50 103 43 96 38 C102 27 94 24 87 35 Z" fill="#A878D4" opacity=".9"/><path d="M87 34 V45" stroke="#60417A" strokeWidth="1.5"/></>
  if (style === 'headphones') return <><path d="M29 58 C27 25 93 25 91 58" stroke="#394252" strokeWidth="4" fill="none"/><rect x="25" y="53" width="10" height="22" rx="5" fill="#5D6D87"/><rect x="85" y="53" width="10" height="22" rx="5" fill="#5D6D87"/><path d="M28 57 V70 M92 57 V70" stroke="#A8C4DF" strokeWidth="2"/></>
  if (style === 'moon-pin') return <><path d="M84 34 a8 8 0 1 0 7 -7 a6 6 0 1 1 -7 7" fill="#F4D572"/><circle cx="95" cy="26" r="1.4" fill="#fff"/></>
  return null
}

export function AvatarSvg({ config, size }: { config: RichAvatarConfig; size: number }) {
  const uid = useId().replace(/:/g, '')
  const cfg = { ...DEFAULT_RICH_AVATAR, ...config }
  const skinDark = shade(cfg.skinTone, 0.87)
  const skinLight = shade(cfg.skinTone, 1.1)
  const hairDark = shade(cfg.hairColor, 0.68)
  const bgLight = shade(cfg.bgColor, 1.23)
  const bgDark = shade(cfg.bgColor, 0.7)
  const facePath = FACE_PATHS[cfg.faceShape] ?? FACE_PATHS.soft

  return <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Custom grove avatar" style={{ display: 'block', maxWidth: '100%', height: 'auto', flexShrink: 0 }}>
    <defs>
      <radialGradient id={`${uid}bg`} cx="35%" cy="25%" r="78%"><stop offset="0" stopColor={bgLight}/><stop offset="1" stopColor={bgDark}/></radialGradient>
      <radialGradient id={`${uid}skin`} cx="38%" cy="25%" r="75%"><stop offset="0" stopColor={skinLight}/><stop offset="1" stopColor={skinDark}/></radialGradient>
      <linearGradient id={`${uid}halo`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" stopOpacity=".36"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
    </defs>
    <circle cx="60" cy="60" r="60" fill={`url(#${uid}bg)`}/>
    <circle cx="60" cy="56" r="49" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="1"/>
    <path d="M13 91 Q31 75 45 91 T77 89 T110 91 V120 H9 Z" fill={shade(cfg.bgColor,.58)} opacity=".25"/>
    <circle cx="24" cy="26" r="2" fill="#fff" opacity=".45"/><circle cx="95" cy="37" r="1.5" fill="#fff" opacity=".55"/><circle cx="101" cy="23" r=".9" fill="#fff" opacity=".7"/>
    <Outfit style={cfg.outfit} color={cfg.outfitColor}/>
    <path d="M52 79 C53 87 51 91 47 94 Q60 102 73 94 C69 91 67 87 68 79 Z" fill={cfg.skinTone}/>
    <HairBack style={cfg.hairStyle} color={cfg.hairColor}/>
    <path d="M31 59 C25 54 26 68 32 72 C37 73 38 65 35 61 Z M89 59 C95 54 94 68 88 72 C83 73 82 65 85 61 Z" fill={cfg.skinTone}/>
    <path d={facePath} fill={`url(#${uid}skin)`} stroke={skinDark} strokeWidth=".65" strokeOpacity=".45"/>
    <path d="M40 69 Q45 65 50 69" stroke="#E77E7D" strokeWidth="4.5" opacity=".16" strokeLinecap="round"/><path d="M70 69 Q75 65 80 69" stroke="#E77E7D" strokeWidth="4.5" opacity=".16" strokeLinecap="round"/>
    <Brows style={cfg.browStyle} color={hairDark}/>
    <Eye cx={47} style={cfg.eyeStyle} irisColor={cfg.eyeColor}/><Eye cx={73} style={cfg.eyeStyle} irisColor={cfg.eyeColor}/>
    <path d="M59 60 C57 65 57 68 60 69 C62 69 63 68 64 67" stroke={shade(cfg.skinTone,.7)} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".48"/>
    <Mouth style={cfg.mouth}/>
    <HairFront style={cfg.hairStyle} color={cfg.hairColor}/>
    <Accessory style={cfg.accessory} hairColor={cfg.hairColor}/>
    <path d="M35 23 Q51 9 72 17" stroke={`url(#${uid}halo)`} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".5"/>
  </svg>
}
