export type TextSize = 'sm' | 'md' | 'lg'

export type UserSettings = {
  sound: boolean
  music: boolean
  reduceMotion: boolean
  particles: boolean
  sfxVolume: number       // 0–1
  musicVolume: number     // 0–1
  textSize: TextSize
  leaderboardVisible: boolean
}

export const SETTINGS_EVENT = 'ww-settings-change'
export const SETTINGS_KEY = 'ww_settings'
export const DASHBOARD_BG_KEY = 'ww_dashboard_bg'

export const DEFAULT_SETTINGS: UserSettings = {
  sound: true,
  music: true,
  reduceMotion: false,
  particles: true,
  sfxVolume: 0.8,
  musicVolume: 0.35,
  textSize: 'md',
  leaderboardVisible: true,
}

export function loadUserSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveUserSettings(settings: UserSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: settings }))
}

export function loadDashboardBackground(): string {
  try {
    return localStorage.getItem(DASHBOARD_BG_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveDashboardBackground(path: string) {
  localStorage.setItem(DASHBOARD_BG_KEY, path)
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: loadUserSettings() }))
}

export function resetAllSettings() {
  localStorage.removeItem(SETTINGS_KEY)
  localStorage.removeItem(DASHBOARD_BG_KEY)
  window.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: DEFAULT_SETTINGS }))
}
