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
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return getTheme(DEFAULT_THEME_ID)
    const saved = localStorage.getItem(STORAGE_KEY)
    const t = saved ? getTheme(saved) : getTheme(DEFAULT_THEME_ID)
    // Apply immediately so gradient and vars are correct on first paint
    const root = document.documentElement
    Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v))
    root.setAttribute('data-theme', t.id)
    return t
  })

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
