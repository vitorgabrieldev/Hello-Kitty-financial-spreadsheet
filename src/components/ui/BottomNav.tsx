'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, ListOrdered, Settings, TrendingDown } from 'lucide-react'
import { useNavigation } from '@/lib/navigation-context'
import QuickAddFab from './QuickAddFab'

const navItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Início' },
  { href: '/transactions', icon: ListOrdered,     label: 'Gastos' },
  { center: true },
  { href: '/debts',        icon: TrendingDown,    label: 'Dívidas' },
  { href: '/settings',     icon: Settings,        label: 'Config' },
] as const

export default function BottomNav() {
  const pathname = usePathname()
  const { startNav } = useNavigation()
  const [visualActive, setVisualActive] = useState<string | null>(null)

  useEffect(() => {
    const active = (navItems as unknown as Array<{ href?: string; center?: boolean }>).find(
      (item) => item.href && (pathname === item.href || pathname.startsWith(item.href + '/'))
    )
    setVisualActive((active as { href?: string })?.href ?? null)
  }, [pathname])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid color-mix(in srgb, var(--primary) 12%, transparent)',
        boxShadow: '0 -4px 32px color-mix(in srgb, var(--primary) 8%, transparent)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          if ('center' in item && item.center) {
            return (
              <div key="fab-center" style={{ minWidth: 52, display: 'flex', justifyContent: 'center' }}>
                <QuickAddFab />
              </div>
            )
          }

          const { href, icon: Icon, label } = item as { href: string; icon: React.ElementType; label: string }
          const isActive = visualActive === href

          return (
            <Link
              key={href}
              href={href}
              onClick={() => { if (!isActive) startNav(); setVisualActive(href) }}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl"
              style={{ minWidth: 52, WebkitUserSelect: 'none', userSelect: 'none' }}
            >
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: 16,
                  background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
                  clipPath: isActive
                    ? 'inset(0% 0% 0% 0% round 16px)'
                    : 'inset(0% 0% 100% 0% round 16px)',
                  transition: 'clip-path 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                style={{ color: isActive ? 'var(--primary)' : 'var(--primary-light)', transition: 'color 0.25s ease', position: 'relative' }}
              />
              <span
                style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 400,
                  color: isActive ? 'var(--primary)' : 'var(--primary-light)',
                  transition: 'color 0.25s ease', position: 'relative', lineHeight: 1,
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
