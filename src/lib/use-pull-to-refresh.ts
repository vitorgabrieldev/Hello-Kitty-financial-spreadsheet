import { useEffect, useRef, useState, useCallback } from 'react'

interface Options {
  onRefresh: () => Promise<void>
  threshold?: number
  scrollRef?: React.RefObject<HTMLElement | null>
}

export function usePullToRefresh({ onRefresh, threshold = 72 }: Options) {
  const [pulling, setPulling] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)

  const startY = useRef(0)
  const isDragging = useRef(false)

  const trigger = useCallback(async () => {
    setRefreshing(true)
    setPullDistance(0)
    setPulling(false)
    try {
      await onRefresh()
    } finally {
      setRefreshing(false)
    }
  }, [onRefresh])

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return
      startY.current = e.touches[0].clientY
      isDragging.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!isDragging.current) return
      const delta = e.touches[0].clientY - startY.current
      if (delta <= 0) { setPullDistance(0); return }
      if (window.scrollY > 0) { isDragging.current = false; setPullDistance(0); return }
      setPullDistance(Math.min(delta, threshold * 1.5))
      setPulling(delta >= threshold)
    }

    function onTouchEnd() {
      if (!isDragging.current) return
      isDragging.current = false
      if (pulling) trigger()
      else { setPullDistance(0); setPulling(false) }
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [pulling, threshold, trigger])

  return { pulling, refreshing, pullDistance }
}
