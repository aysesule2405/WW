export type ColorTheme =
  | 'light'
  | 'sapling'
  | 'delivery'
  | 'drift'
  | 'halfmoon'
  | 'ember'
  | 'petal'
  | 'frost'

export const GAME_THEMES: ColorTheme[] = ['light', 'sapling', 'delivery', 'drift', 'halfmoon', 'ember', 'petal', 'frost']

export const THEME_META: Record<ColorTheme, { label: string; icon: string; colors: string[] }> = {
  light:    { label: 'Whisperwind Grove',       icon: '🏕️', colors: ['#e5edd0', '#5A9030', '#ADC178', '#161C11'] },
  sapling:  { label: 'Spirit Sapling',          icon: '🌱',  colors: ['#241c09', '#bcd191', '#d8cca6', '#faefcb'] },
  delivery: { label: 'Delivery on the Wind',    icon: '📦',  colors: ['#762715', '#9eecf8', '#c6cf79', '#fff7e0'] },
  drift:    { label: 'Spirit Drift',            icon: '🌊',  colors: ['#0c1e34', '#4cb7f1', '#aeddd9', '#fffbdc'] },
  halfmoon: { label: 'Rise of the Half Moon',   icon: '🌙',  colors: ['#040307', '#ffafba', '#63e8e7', '#fffce6'] },
  ember:    { label: 'Ember Hollow',            icon: '🔥',  colors: ['#2a1508', '#f0a840', '#d4b870', '#fff8e8'] },
  petal:    { label: 'Petal Rain',              icon: '🌸',  colors: ['#1a0818', '#f0a8c8', '#e878a8', '#fff4fc'] },
  frost:    { label: 'Frost Wisp',              icon: '❄️',  colors: ['#060c18', '#88c8ee', '#d0ecfc', '#f4fbff'] },
}
