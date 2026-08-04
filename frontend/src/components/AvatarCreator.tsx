/* eslint-disable react-refresh/only-export-components -- artwork and saved config are consumed throughout the app */
import React, { useEffect, useRef, useState } from 'react'
import { bodyFontFamily, readableFontFamily } from '../theme/typography'
import { uiRadius, uiSpace, uiType } from '../theme/uiTokens'
import {
  AVATAR_LABELS,
  AVATAR_OPTIONS,
  AvatarSvg,
  DEFAULT_RICH_AVATAR,
  shade,
  type RichAvatarConfig,
} from './avatar/AvatarArtwork'

export { AvatarSvg, DEFAULT_RICH_AVATAR }
export type { RichAvatarConfig }
export const darkenColor = (hex: string, factor = 0.75) => shade(hex, factor)
export const lightenColor = (hex: string, factor = 1.15) => shade(hex, factor)

type VisualField = 'faceShape' | 'eyeStyle' | 'browStyle' | 'mouth' | 'hairStyle' | 'outfit' | 'accessory'
type Tab = 'face' | 'hair' | 'outfit' | 'extras' | 'background'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'face', label: 'Face', icon: '✦' },
  { id: 'hair', label: 'Hair', icon: '〰' },
  { id: 'outfit', label: 'Outfit', icon: '♧' },
  { id: 'extras', label: 'Extras', icon: '★' },
  { id: 'background', label: 'Scene', icon: '◈' },
]

const PRESETS: { label: string; icon: string; config: Partial<RichAvatarConfig> }[] = [
  { label: 'Grove Hero', icon: '🌿', config: { faceShape: 'soft', hairStyle: 'layered', hairColor: '#3D1C02', eyeStyle: 'anime', eyeColor: '#3A6B3A', mouth: 'soft-smile', outfit: 'grove', outfitColor: '#5A9030', accessory: 'leaf-pin', bgColor: '#ADC178' } },
  { label: 'Moon Dreamer', icon: '🌙', config: { faceShape: 'oval', hairStyle: 'long', hairColor: '#405F86', eyeStyle: 'sleepy', eyeColor: '#74519B', browStyle: 'soft', mouth: 'soft-smile', outfit: 'moon', outfitColor: '#253A73', accessory: 'moon-pin', bgColor: '#8B8BB8' } },
  { label: 'Wind Courier', icon: '📦', config: { faceShape: 'heart', hairStyle: 'ponytail', hairColor: '#A74F34', eyeStyle: 'upturned', eyeColor: '#39758B', browStyle: 'arched', mouth: 'open-smile', outfit: 'delivery', outfitColor: '#C8761A', accessory: 'ribbon', bgColor: '#A8DADC' } },
  { label: 'Forest Mage', icon: '🍄', config: { faceShape: 'round', hairStyle: 'curly', hairColor: '#69402E', eyeStyle: 'sparkle', eyeColor: '#3A6B3A', browStyle: 'bold', mouth: 'pout', outfit: 'forest', outfitColor: '#2E7045', accessory: 'mushroom-hat', bgColor: '#6E9D7D' } },
]

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function randomAvatar(): RichAvatarConfig {
  return {
    skinTone: pick(AVATAR_OPTIONS.skinTones),
    faceShape: pick(AVATAR_OPTIONS.faceShapes),
    hairStyle: pick(AVATAR_OPTIONS.hairStyles),
    hairColor: pick(AVATAR_OPTIONS.hairColors),
    eyeStyle: pick(AVATAR_OPTIONS.eyeStyles),
    eyeColor: pick(AVATAR_OPTIONS.eyeColors),
    browStyle: pick(AVATAR_OPTIONS.browStyles),
    mouth: pick(AVATAR_OPTIONS.mouths),
    outfit: pick(AVATAR_OPTIONS.outfits),
    outfitColor: pick(AVATAR_OPTIONS.outfitColors),
    accessory: pick(AVATAR_OPTIONS.accessories),
    bgColor: pick(AVATAR_OPTIONS.backgroundColors),
  }
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={styles.sectionLabel}><span aria-hidden="true">◆</span>{children}</p>
}

function ColorSwatches({ colors, selected, onSelect, square = false }: {
  colors: readonly string[]
  selected: string
  onSelect: (color: string) => void
  square?: boolean
}) {
  return <div className="ww-avatar-swatches" style={styles.swatches}>
    {colors.map((color) => <button
      key={color}
      type="button"
      aria-label={`Use color ${color}`}
      aria-pressed={selected === color}
      onClick={() => onSelect(color)}
      style={{
        ...styles.swatch,
        width: square ? 42 : 32,
        height: square ? 42 : 32,
        borderRadius: square ? 12 : 999,
        background: square ? `radial-gradient(circle at 30% 25%, ${shade(color, 1.22)}, ${shade(color, 0.75)})` : color,
        borderColor: selected === color ? 'var(--accent)' : 'var(--border)',
        boxShadow: selected === color ? `0 0 0 2px var(--bg-surface), 0 0 0 4px ${color}77` : '0 2px 5px rgba(0,0,0,.13)',
        transform: selected === color ? 'scale(1.12)' : 'none',
      }}
    >{selected === color && <span style={styles.check}>✓</span>}</button>)}
  </div>
}

function VisualOptions({ field, items, value, onSelect }: {
  field: VisualField
  items: readonly string[]
  value: RichAvatarConfig
  onSelect: (item: string) => void
}) {
  return <div className="ww-avatar-option-grid" style={styles.optionGrid}>
    {items.map((item) => {
      const selected = value[field] === item
      const preview = { ...value, [field]: item }
      return <button
        key={item}
        type="button"
        className="ww-avatar-option"
        aria-pressed={selected}
        onClick={() => onSelect(item)}
        style={{ ...styles.option, ...(selected ? styles.optionSelected : {}) }}
      >
        <span style={styles.optionArt}><AvatarSvg config={preview} size={58}/></span>
        <span style={styles.optionLabel}>{AVATAR_LABELS[item] ?? item}</span>
        {selected && <span style={styles.selectedMark} aria-hidden="true">✓</span>}
      </button>
    })}
  </div>
}

export function AvatarCreator({ value, onChange }: { value: RichAvatarConfig; onChange: (config: RichAvatarConfig) => void }) {
  const normalized = { ...DEFAULT_RICH_AVATAR, ...value }
  const [tab, setTab] = useState<Tab>('face')
  const [pulseKey, setPulseKey] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const spinTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (spinTimer.current !== null) window.clearTimeout(spinTimer.current)
  }, [])

  const update = (patch: Partial<RichAvatarConfig>) => {
    onChange({ ...normalized, ...patch })
    setPulseKey((key) => key + 1)
  }

  const randomize = () => {
    onChange(randomAvatar())
    setPulseKey((key) => key + 1)
    setSpinning(true)
    if (spinTimer.current !== null) window.clearTimeout(spinTimer.current)
    spinTimer.current = window.setTimeout(() => setSpinning(false), 500)
  }

  return <div className="ww-avatar-studio" style={styles.studio}>
    <div className="ww-avatar-stage" style={{ ...styles.stage, background: `radial-gradient(circle at 50% 42%, ${normalized.bgColor}55, transparent 62%)` }}>
      <div style={styles.stageSparkles} aria-hidden="true"><span>✦</span><span>·</span><span>✧</span></div>
      <div key={pulseKey} className="ww-avatar-preview-pulse" style={{ ...styles.preview, boxShadow: `0 18px 45px ${normalized.bgColor}77` }}>
        <AvatarSvg config={normalized} size={230}/>
      </div>
      <div style={styles.stageActions}>
        <button type="button" className="ww-avatar-randomize" style={styles.randomButton} onClick={randomize}>
          <span className={spinning ? 'ww-dice-spinning' : ''} style={{ display: 'inline-block' }}>✣</span>
          Surprise me
        </button>
      </div>
      <p style={styles.stageCaption}>Layered vector portrait · crisp at every size</p>
    </div>

    <div style={styles.presetArea}>
      <SectionLabel>Quick looks</SectionLabel>
      <div className="ww-avatar-presets" style={styles.presets}>
        {PRESETS.map((preset) => <button key={preset.label} type="button" style={styles.preset} onClick={() => update(preset.config)}>
          <span>{preset.icon}</span>{preset.label}
        </button>)}
      </div>
    </div>

    <div className="ww-avatar-tabs" style={styles.tabs} role="tablist" aria-label="Avatar customization categories">
      {TABS.map((item) => <button
        key={item.id}
        type="button"
        role="tab"
        aria-selected={tab === item.id}
        className="ww-av-tab"
        onClick={() => setTab(item.id)}
        style={{ ...styles.tab, ...(tab === item.id ? styles.tabActive : {}) }}
      ><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}
    </div>

    <div className="ww-avatar-controls" style={styles.controls}>
      {tab === 'face' && <>
        <SectionLabel>Face shape</SectionLabel>
        <VisualOptions field="faceShape" items={AVATAR_OPTIONS.faceShapes} value={normalized} onSelect={(faceShape) => update({ faceShape })}/>
        <SectionLabel>Skin tone</SectionLabel>
        <ColorSwatches colors={AVATAR_OPTIONS.skinTones} selected={normalized.skinTone} onSelect={(skinTone) => update({ skinTone })}/>
        <SectionLabel>Eye expression</SectionLabel>
        <VisualOptions field="eyeStyle" items={AVATAR_OPTIONS.eyeStyles} value={normalized} onSelect={(eyeStyle) => update({ eyeStyle })}/>
        <SectionLabel>Eye color</SectionLabel>
        <ColorSwatches colors={AVATAR_OPTIONS.eyeColors} selected={normalized.eyeColor} onSelect={(eyeColor) => update({ eyeColor })}/>
        <SectionLabel>Eyebrows</SectionLabel>
        <VisualOptions field="browStyle" items={AVATAR_OPTIONS.browStyles} value={normalized} onSelect={(browStyle) => update({ browStyle })}/>
        <SectionLabel>Mouth</SectionLabel>
        <VisualOptions field="mouth" items={AVATAR_OPTIONS.mouths} value={normalized} onSelect={(mouth) => update({ mouth })}/>
      </>}

      {tab === 'hair' && <>
        <SectionLabel>Hair silhouette</SectionLabel>
        <VisualOptions field="hairStyle" items={AVATAR_OPTIONS.hairStyles} value={normalized} onSelect={(hairStyle) => update({ hairStyle })}/>
        <SectionLabel>Hair color</SectionLabel>
        <ColorSwatches colors={AVATAR_OPTIONS.hairColors} selected={normalized.hairColor} onSelect={(hairColor) => update({ hairColor })}/>
      </>}

      {tab === 'outfit' && <>
        <SectionLabel>Grove role</SectionLabel>
        <VisualOptions field="outfit" items={AVATAR_OPTIONS.outfits} value={normalized} onSelect={(outfit) => update({ outfit })}/>
        <SectionLabel>Cloth color</SectionLabel>
        <ColorSwatches colors={AVATAR_OPTIONS.outfitColors} selected={normalized.outfitColor} onSelect={(outfitColor) => update({ outfitColor })}/>
      </>}

      {tab === 'extras' && <>
        <SectionLabel>Accessories</SectionLabel>
        <VisualOptions field="accessory" items={AVATAR_OPTIONS.accessories} value={normalized} onSelect={(accessory) => update({ accessory })}/>
      </>}

      {tab === 'background' && <>
        <SectionLabel>Portrait atmosphere</SectionLabel>
        <ColorSwatches square colors={AVATAR_OPTIONS.backgroundColors} selected={normalized.bgColor} onSelect={(bgColor) => update({ bgColor })}/>
        <p style={styles.helper}>This atmosphere follows your avatar into the Grove dashboard, community, and leaderboards.</p>
      </>}
    </div>
  </div>
}

const styles: Record<string, React.CSSProperties> = {
  studio: { display: 'flex', flexDirection: 'column', gap: uiSpace.md, minWidth: 0 },
  stage: {
    position: 'relative', overflow: 'hidden', minHeight: 292, borderRadius: uiRadius.xl,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: '20px 14px 14px', border: '1px solid var(--border-muted)',
    backgroundColor: 'var(--bg-badge)',
  },
  stageSparkles: {
    position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start',
    padding: '18px 30px', color: 'var(--text-muted)', opacity: 0.45, pointerEvents: 'none', fontSize: 18,
  },
  preview: { borderRadius: 999, overflow: 'hidden', lineHeight: 0, border: '4px solid rgba(255,255,255,.42)', transition: 'box-shadow .3s ease', zIndex: 1 },
  stageActions: { display: 'flex', justifyContent: 'center', zIndex: 1 },
  randomButton: {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: uiRadius.pill,
    border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-body)',
    fontFamily: bodyFontFamily, fontWeight: 750, fontSize: uiType.small, cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
  },
  stageCaption: { margin: 0, color: 'var(--text-muted)', fontFamily: readableFontFamily, fontSize: uiType.micro, zIndex: 1 },
  presetArea: { minWidth: 0 },
  presets: { display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 2px 5px', scrollbarWidth: 'none' },
  preset: {
    flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: uiRadius.pill,
    border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-body)',
    fontFamily: bodyFontFamily, fontSize: 11, fontWeight: 700, cursor: 'pointer',
  },
  tabs: { display: 'flex', gap: 5, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' },
  tab: {
    flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 11px',
    borderRadius: uiRadius.pill, border: '1px solid var(--border)', background: 'var(--bg-surface)',
    color: 'var(--text-secondary)', fontFamily: bodyFontFamily, fontSize: 11, fontWeight: 700, cursor: 'pointer',
  },
  tabActive: { borderColor: 'var(--border-focus)', background: 'var(--bg-accent-soft)', color: 'var(--accent-dark)', boxShadow: '0 1px 6px rgba(0,0,0,.1)' },
  controls: {
    maxHeight: 520, overflowY: 'auto', overscrollBehavior: 'contain', padding: '0 5px 10px 1px',
    scrollbarColor: 'var(--border) transparent',
  },
  sectionLabel: {
    margin: '13px 0 7px', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)',
    fontFamily: readableFontFamily, fontSize: 10, fontWeight: 850, textTransform: 'uppercase', letterSpacing: '.08em',
  },
  swatches: { display: 'flex', flexWrap: 'wrap', gap: 9, padding: '3px 4px' },
  swatch: { position: 'relative', padding: 0, border: '2px solid', cursor: 'pointer', transition: 'transform .14s, box-shadow .14s' },
  check: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12, fontWeight: 900, textShadow: '0 1px 3px rgba(0,0,0,.7)' },
  optionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 7 },
  option: {
    position: 'relative', minWidth: 0, padding: '6px 4px 7px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', color: 'var(--text-body)',
  },
  optionSelected: { borderColor: 'var(--border-focus)', background: 'var(--bg-accent-soft)', boxShadow: '0 0 0 1px var(--border-focus)' },
  optionArt: { width: 58, height: 58, overflow: 'hidden', borderRadius: 999, lineHeight: 0, border: '1px solid var(--border-muted)' },
  optionLabel: { maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: bodyFontFamily, fontSize: 10, fontWeight: 700 },
  selectedMark: { position: 'absolute', top: 5, right: 5, width: 17, height: 17, borderRadius: 999, display: 'grid', placeItems: 'center', background: 'var(--accent)', color: '#fff', fontSize: 10, fontWeight: 900 },
  helper: { margin: '12px 0 2px', color: 'var(--text-muted)', fontFamily: readableFontFamily, fontSize: 11, lineHeight: 1.45 },
}
