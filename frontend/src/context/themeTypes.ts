export type ColorTheme =
  | 'light'
  | 'dark'
  | 'sapling'
  | 'delivery'
  | 'drift'
  | 'halfmoon'
  | 'dashboard'

export const GAME_THEMES: ColorTheme[] = ['sapling', 'delivery', 'drift', 'halfmoon', 'dashboard']

export const THEME_META: Record<ColorTheme, { label: string; icon: string; colors: string[] }> = {
  light:     { label: 'Grove Light',            icon: '☀️',  colors: ['#e5edd0', '#5A9030', '#ADC178', '#F0EAD2'] },
  dark:      { label: 'Grove Dark',             icon: '🌙',  colors: ['#161C11', '#ADC178', '#3E6820', '#E8DFC8'] },
  sapling:   { label: 'Spirit Sapling',         icon: '🌱',  colors: ['#241c09', '#bcd191', '#d8cca6', '#faefcb'] },
  delivery:  { label: 'Delivery on the Wind',   icon: '📦',  colors: ['#762715', '#9eecf8', '#c6cf79', '#fff7e0'] },
  drift:     { label: 'Spirit Drift',           icon: '🌊',  colors: ['#0c1e34', '#4cb7f1', '#aeddd9', '#fffbdc'] },
  halfmoon:  { label: 'Rise of the Half Moon',  icon: '🌙',  colors: ['#040307', '#ffafba', '#63e8e7', '#fffce6'] },
  dashboard: { label: 'Dashboard',              icon: '🏡',  colors: ['#f5f2e8', '#80925b', '#a8b88a', '#2a3618'] },
}
