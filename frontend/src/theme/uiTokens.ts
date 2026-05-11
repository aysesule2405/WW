import type { CSSProperties } from 'react'

export const uiSpace = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  page: 'clamp(18px, 3vw, 32px)',
} as const

export const uiRadius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
} as const

export const uiWidth = {
  form: 760,
  content: 980,
  wide: 1200,
} as const

export const uiType = {
  pageTitle: 'clamp(30px, 3.2vw, 36px)',
  sectionTitle: 22,
  cardTitle: 22,
  body: 15,
  small: 13,
  micro: 11,
} as const

export const pageShell = (maxWidth: number = uiWidth.content): CSSProperties => ({
  width: '100%',
  maxWidth,
  padding: uiSpace.page,
  boxSizing: 'border-box',
})

export const surfaceCard: CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: uiRadius.xl,
  boxShadow: 'var(--shadow-md)',
}

export const compactSurface: CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: uiRadius.lg,
  boxShadow: 'var(--shadow-sm)',
}

export const inputSurface: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  color: 'var(--text-body)',
  background: 'var(--bg-input)',
  border: '1px solid var(--border-strong)',
  borderRadius: uiRadius.md,
  outline: 'none',
}

export const primaryButton: CSSProperties = {
  border: 'none',
  borderRadius: uiRadius.md,
  background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
  color: 'var(--text-on-dark)',
  cursor: 'pointer',
  boxShadow: '0 6px 18px color-mix(in srgb, var(--accent-dark) 34%, transparent)',
}
