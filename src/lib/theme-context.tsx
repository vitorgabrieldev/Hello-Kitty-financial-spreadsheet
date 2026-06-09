'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type Theme, type ThemeId, DEFAULT_THEME_ID, getTheme } from './themes'

interface ThemeContextValue {
  theme: Theme
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'app-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getTheme(DEFAULT_THEME_ID))

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) setThemeState(getTheme(saved))
  }, [])

  useEffect(() => {
    const root = document.documentElement
    Object.entries(theme.vars).forEach(([key, val]) => root.style.setProperty(key, val))
    root.setAttribute('data-theme', theme.id)
  }, [theme])

  function setTheme(id: ThemeId) {
    const t = getTheme(id)
    setThemeState(t)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
