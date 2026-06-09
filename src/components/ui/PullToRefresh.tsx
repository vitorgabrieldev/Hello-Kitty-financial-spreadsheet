'use client'

import { usePullToRefresh } from '@/lib/use-pull-to-refresh'

interface Props {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export default function PullToRefresh({ onRefresh, children }: Props) {
  const { pulling, refreshing, pullDistance } = usePullToRefresh({ onRefresh })

  const progress = Math.min(pullDistance / 72, 1)
  const visible = pullDistance > 4 || refreshing

  return (
    <div style={{ position: 'relative' }}>
      {/* Indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${visible ? pullDistance - 40 : -40}px)`,
          transition: refreshing || pullDistance === 0 ? 'transform 0.25s ease' : 'none',
          zIndex: 10,
          pointerEvents: 'none',
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--primary)', boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.15s',
        }}>
          {refreshing ? (
            <div style={{
              width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)',
              borderTopColor: 'white', borderRadius: '50%',
              animation: 'ptr-spin 0.7s linear infinite',
            }} />
          ) : (
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: `rotate(${progress * 180}deg)`, transition: 'transform 0.1s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ptr-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{
        transform: `translateY(${refreshing ? 40 : Math.min(pullDistance * 0.4, 28)}px)`,
        transition: refreshing || pullDistance === 0 ? 'transform 0.25s ease' : 'none',
      }}>
        {children}
      </div>
    </div>
  )
}
