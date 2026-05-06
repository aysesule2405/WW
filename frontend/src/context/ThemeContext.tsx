import { createContext, useContext, useEffect, useState } from 'react'
import { GAME_THEMES, type ColorTheme } from './themeTypes'

type ThemeContextType = {
  theme: ColorTheme
  setTheme: (t: ColorTheme) => void
  toggleTheme: () => void
  toggleMode: () => void   // dark ↔ light within game themes
  isDark: boolean
  mode: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_KEY      = 'ww_theme'
const MODE_STORAGE_KEY = 'ww_theme_mode'

function getInitialTheme(): ColorTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ColorTheme
    const valid: ColorTheme[] = ['light', 'dark', 'sapling', 'delivery', 'drift', 'halfmoon', 'dashboard']
    if (stored && valid.includes(stored)) return stored
  } catch { /* ignore */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialMode(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
  } catch { /* ignore */ }
  return 'dark'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ColorTheme>(getInitialTheme)
  const [mode,  setModeState]  = useState<'dark' | 'light'>(getInitialMode)

  const setTheme = (t: ColorTheme) => {
    setThemeState(t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch { /* ignore */ }
  }

  const setMode = (m: 'dark' | 'light') => {
    setModeState(m)
    try { localStorage.setItem(MODE_STORAGE_KEY, m) } catch { /* ignore */ }
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', mode)
  }, [mode])

  // When on a base theme (light/dark): toggle switches between themes.
  // When on a game theme: toggle switches the dark/light mode.
  const toggleTheme = () => {
    if (GAME_THEMES.includes(theme)) {
      setMode(mode === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light')
    }
  }

  // Explicit mode toggle (always switches dark ↔ light regardless of theme)
  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark')

  const isDark = theme !== 'light'

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, toggleMode, isDark, mode }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
