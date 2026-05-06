export type ColorTheme =
  | 'light'
  | 'dark'
  | 'sapling'
  | 'delivery'
  | 'drift'
  | 'halfmoon'

export const GAME_THEMES: ColorTheme[] = ['sapling', 'delivery', 'drift', 'halfmoon']

export const THEME_META: Record<ColorTheme, { label: string; icon: string; colors: string[] }> = {
  light:    { label: 'Grove Light',             icon: '☀️',  colors: ['#e5edd0', '#5A9030', '#ADC178', '#F0EAD2'] },
  dark:     { label: 'Grove Dark',              icon: '🌙',  colors: ['#161C11', '#ADC178', '#3E6820', '#E8DFC8'] },
  sapling:  { label: 'Spirit Sapling',          icon: '🌱',  colors: ['#1a1506', '#779248', '#bcd191', '#faefcb'] },
  delivery: { label: 'Delivery on the Wind',    icon: '📦',  colors: ['#120903', '#9aa253', '#c6cf79', '#fff7e0'] },
  drift:    { label: 'Spirit Drift',            icon: '🌊',  colors: ['#09141f', '#2c8dc2', '#4cb7f1', '#fffbdc'] },
  halfmoon: { label: 'Rise of the Half Moon',   icon: '🌙',  colors: ['#040307', '#e08491', '#ffafba', '#fffce6'] },
}
