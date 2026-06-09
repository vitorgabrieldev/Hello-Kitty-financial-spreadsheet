'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { useNavigation } from '@/lib/navigation-context'

const OPTIONS = [
  { emoji: '💸', label: 'Gasto',          href: '/transactions/new?type=expense' },
  { emoji: '💰', label: 'Receita',         href: '/transactions/new?type=income' },
  { emoji: '💳', label: 'Pagar dívida',    href: '/transactions/new?type=debt_payment' },
  { emoji: '↔️', label: 'Transferência',   href: '/transactions/new?type=transfer' },
]

export default function QuickAddFab() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { startNav } = useNavigation()

  function go(href: string) {
    setOpen(false)
    startNav()
    router.push(href)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg, var(--dark), color-mix(in srgb, var(--dark) 60%, var(--primary)))'
            : 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px color-mix(in srgb, var(--primary) 45%, transparent)',
          transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          transform: open ? 'rotate(45deg) scale(1.05)' : 'rotate(0deg) scale(1)',
          flexShrink: 0,
        }}
      >
        {open
          ? <X size={22} color="white" strokeWidth={2.5} />
          : <Plus size={22} color="white" strokeWidth={2.5} />
        }
      </button>

      {open && createPortal(
        <>
          {/* backdrop — fica ABAIXO da BottomNav (z-50 = 50) */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'color-mix(in srgb, var(--dark) 22%, transparent)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              zIndex: 48,
              animation: 'fadeIn 0.18s ease both',
            }}
          />
          {/* options — fica ACIMA da BottomNav */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: 0,
            right: 0,
            transform: 'translateY(-50%)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            alignItems: 'center',
          }}>
            {OPTIONS.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(opt.href)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'white', border: 'none', borderRadius: 50,
                  padding: '12px 20px', cursor: 'pointer',
                  boxShadow: '0 4px 20px color-mix(in srgb, var(--dark) 18%, transparent)',
                  fontSize: 15, fontWeight: 700, color: 'var(--dark)',
                  transition: 'transform 0.15s ease',
                  minWidth: 180,
                  animation: `fabIn 0.22s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.05}s both`,
                }}
              >
                <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
