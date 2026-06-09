'use client'

import { Badge } from 'antd'
import { Bell } from 'lucide-react'
import Link from 'next/link'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showNotification?: boolean
  unreadCount?: number
  rightAction?: React.ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  showNotification = false,
  unreadCount = 0,
  rightAction,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-4 pb-2">
      <div>
        <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--on-bg)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--on-bg-sub)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {rightAction}
        {showNotification && (
          <Link href="/notifications">
            <Badge count={unreadCount} size="small" color="#FF6B9D" offset={[-2, 2]}>
              <button
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255, 107, 157, 0.08)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Bell size={20} style={{ color: '#FF6B9D' }} />
              </button>
            </Badge>
          </Link>
        )}
      </div>
    </div>
  )
}
