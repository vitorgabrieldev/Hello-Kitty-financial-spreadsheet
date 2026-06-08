'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Wallet, Tag, Settings, Plus } from 'lucide-react'
import { useNavigation } from '@/lib/navigation-context'

const navItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Início' },
  { href: '/accounts',     icon: Wallet,           label: 'Contas' },
  { href: '/transactions/new', icon: Plus,         label: 'Novo', center: true },
  { href: '/categories',   icon: Tag,              label: 'Categorias' },
  { href: '/settings',     icon: Settings,         label: 'Config' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { startNav } = useNavigation()
  const [visualActive, setVisualActive] = useState<string | null>(null)

  useEffect(() => {
    const active = navItems.find(
      ({ href, center }) => !center && (pathname === href || pathname.startsWith(href + '/'))
    )
    setVisualActive(active?.href ?? null)
  }, [pathname])

  function handleTap(href: string, isCenter: boolean, isAlreadyActive: boolean) {
    if (!isAlreadyActive) startNav()
    if (!isCenter) setVisualActive(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-bottom"
      style={{
        background: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255, 107, 157, 0.12)',
        boxShadow: '0 -4px 32px rgba(255, 107, 157, 0.08)',
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label, center }) => {
          const isActive = !center && visualActive === href

          if (center) {
            return (
              <Link
                key={href}
                href={href}
                onClick={() => handleTap(href, true, false)}
                className="hk-nav-tab flex flex-col items-center gap-0.5"
                style={{ minWidth: 52 }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B9D, #FF4D8D)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(255, 107, 157, 0.45)',
                    transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                  }}
                >
                  <Icon size={22} color="white" strokeWidth={2.5} />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              onClick={() => handleTap(href, false, isActive)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl"
              style={{
                minWidth: 52,
                WebkitUserSelect: 'none',
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 16,
                  background: 'rgba(255, 107, 157, 0.1)',
                  clipPath: isActive
                    ? 'inset(0% 0% 0% 0% round 16px)'
                    : 'inset(0% 0% 100% 0% round 16px)',
                  transition: 'clip-path 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                style={{
                  color: isActive ? '#FF6B9D' : '#C4A0B0',
                  transition: 'color 0.25s ease',
                  position: 'relative',
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? '#FF6B9D' : '#C4A0B0',
                  transition: 'color 0.25s ease',
                  position: 'relative',
                  lineHeight: 1,
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
