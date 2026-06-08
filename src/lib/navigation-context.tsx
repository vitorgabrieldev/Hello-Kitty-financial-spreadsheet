'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface NavContextType {
  isNavigating: boolean
  startNav: () => void
}

const NavContext = createContext<NavContextType>({ isNavigating: false, startNav: () => {} })

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const t = setTimeout(() => setIsNavigating(false), 50)
    return () => clearTimeout(t)
  }, [pathname])

  const startNav = useCallback(() => setIsNavigating(true), [])

  return (
    <NavContext.Provider value={{ isNavigating, startNav }}>
      {children}
    </NavContext.Provider>
  )
}

export const useNavigation = () => useContext(NavContext)
