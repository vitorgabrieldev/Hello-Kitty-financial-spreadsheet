'use client'

import { useRef, useState, useCallback } from 'react'

interface Action {
  label: string
  icon: React.ReactNode
  color: string
  onPress: () => void
}

interface Props {
  children: React.ReactNode
  actions: Action[]
  disabled?: boolean
}

const ACTION_WIDTH = 70

export default function SwipeableRow({ children, actions, disabled }: Props) {
  const [offset, setOffset] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const startX = useRef(0)
  const startOffset = useRef(0)
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const maxSwipe = actions.length * ACTION_WIDTH

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    startX.current = e.touches[0].clientX
    startOffset.current = offset
    dragging.current = true
  }, [disabled, offset])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging.current || disabled) return
    const delta = e.touches[0].clientX - startX.current
    const next = Math.max(-maxSwipe, Math.min(0, startOffset.current + delta))
    setOffset(next)
  }, [disabled, maxSwipe])

  const onTouchEnd = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    const snap = offset < -(maxSwipe * 0.4)
    setRevealed(snap)
    setOffset(snap ? -maxSwipe : 0)
  }, [offset, maxSwipe])

  const close = useCallback(() => {
    setRevealed(false)
    setOffset(0)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', overflow: 'hidden', borderRadius: 14 }}>
      {/* Action buttons revealed underneath */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        display: 'flex', alignItems: 'stretch',
        width: maxSwipe,
      }}>
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => { close(); action.onPress() }}
            style={{
              width: ACTION_WIDTH, border: 'none', cursor: 'pointer',
              background: action.color,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              color: 'white', fontSize: 10, fontWeight: 700,
              borderRadius: i === actions.length - 1 ? '0 14px 14px 0' : 0,
            }}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Swipeable content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={revealed ? close : undefined}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
          willChange: 'transform',
          position: 'relative', zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  )
}
