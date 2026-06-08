'use client'

import { useEffect, useState } from 'react'
import { useNavigation } from '@/lib/navigation-context'

export default function NavigationProgress() {
  const { isNavigating } = useNavigation()
  const [width, setWidth] = useState(0)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    if (isNavigating) {
      setOpacity(1)
      setWidth(0)
      const t1 = setTimeout(() => setWidth(45), 20)
      const t2 = setTimeout(() => setWidth(72), 250)
      const t3 = setTimeout(() => setWidth(88), 600)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    } else {
      setWidth(100)
      const t = setTimeout(() => {
        setOpacity(0)
        setTimeout(() => setWidth(0), 300)
      }, 180)
      return () => clearTimeout(t)
    }
  }, [isNavigating])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity,
        transition: 'opacity 0.3s ease',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, #FF4D8D, #FF6B9D, #FFB3CE)',
          transition: width === 0 ? 'none' : 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '0 2px 2px 0',
          boxShadow: '0 0 12px rgba(255,107,157,0.65), 0 0 4px rgba(255,107,157,0.4)',
        }}
      />
    </div>
  )
}
