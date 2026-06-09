'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from 'antd'
import { ArrowLeft, CreditCard, TrendingDown, Calendar, AlertCircle } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import { useTheme } from '@/lib/theme-context'
import { useUser } from '@/lib/user-context'
import type { Card, Transaction } from '@/types'

function getBillingCycle(closingDay: number): { start: string; end: string; dueDate: string } {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth() // 0-based

  let cycleStart: Date
  let cycleEnd: Date

  if (today.getDate() <= closingDay) {
    // before closing: cycle started last month's closing+1
    cycleStart = new Date(y, m - 1, closingDay + 1)
    cycleEnd   = new Date(y, m, closingDay)
  } else {
    // after closing: cycle started this month's closing+1
    cycleStart = new Date(y, m, closingDay + 1)
    cycleEnd   = new Date(y, m + 1, closingDay)
  }

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  return {
    start: fmt(cycleStart),
    end: fmt(cycleEnd),
    dueDate: fmt(cycleEnd), // simplified: due = closing day
  }
}

const BRAND_LABEL: Record<string, string> = {
  visa: 'VISA', mastercard: 'MC', elo: 'elo', amex: 'AMEX', hipercard: 'HIPER', other: '•••',
}

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useUser()

  const [card, setCard] = useState<Card | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (user) load()
  }, [user, id])

  async function load() {
    if (!user) return
    const supabase = createClient()

    const { data: cardData, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !cardData) { setNotFound(true); setLoading(false); return }
    setCard(cardData)

    const { start, end } = getBillingCycle(cardData.closing_day)

    const { data: txData } = await supabase
      .from('transactions')
      .select('*, category:categories(id,name,icon,color,type,is_default,created_at)')
      .eq('user_id', user.id)
      .eq('card_id', id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    setTransactions(txData ?? [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="page-enter">
        <div className="hk-gradient px-4 pt-10 pb-6">
          <Skeleton.Button active style={{ width: 80, height: 32, borderRadius: 20, marginBottom: 16 }} />
          <Skeleton active paragraph={{ rows: 3 }} title={false} />
        </div>
        <div className="px-4 py-4 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid var(--border-light)' }}>
              <Skeleton active paragraph={{ rows: 1 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !card) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-screen gap-4 px-8">
        <span className="text-6xl">💳</span>
        <p className="font-bold text-lg" style={{ color: 'var(--on-bg)' }}>Cartão não encontrado</p>
        <button onClick={() => router.push('/cards')} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 20, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
          Voltar para cartões
        </button>
      </div>
    )
  }

  const { start, end } = getBillingCycle(card.closing_day)
  const totalBill = transactions.reduce((s, t) => s + t.amount, 0)
  const paid      = transactions.filter(t => t.is_paid).reduce((s, t) => s + t.amount, 0)
  const pending   = totalBill - paid
  const usagePercent = card.limit_amount > 0 ? Math.min((card.current_balance / card.limit_amount) * 100, 100) : 0

  const fmtDate = (iso: string) => {
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="page-enter">
      {/* Card header */}
      <div className="px-4 pt-10 pb-6 relative overflow-hidden"
        style={{ background: card.color || 'var(--primary)' }}>
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: -40, bottom: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -6, right: -2, fontSize: 80, opacity: 0.10, pointerEvents: 'none', lineHeight: 1 }}>{theme.emoji}</div>

        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 20, padding: '5px 14px', cursor: 'pointer', marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} color="white" />
          <span style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>Voltar</span>
        </button>

        {/* Card visual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} color="white" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 20, margin: 0 }}>{card.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>
              {card.bank_name} · {BRAND_LABEL[card.brand] ?? card.brand.toUpperCase()}
              {card.last_four_digits ? ` •••• ${card.last_four_digits}` : ''}
            </p>
          </div>
        </div>

        {/* Billing period info */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <Calendar size={11} color="rgba(255,255,255,0.65)" />
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Período</p>
            </div>
            <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>{fmtDate(start)} – {fmtDate(end)}</p>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <AlertCircle size={11} color="rgba(255,255,255,0.65)" />
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Vencimento</p>
            </div>
            <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>Dia {card.due_day}</p>
          </div>
        </div>

        {/* Bill totals */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px' }}>Total da fatura</p>
              <p style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>{formatCurrency(totalBill)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: '0 0 2px' }}>Limite disponível</p>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 700, margin: 0 }}>{formatCurrency(card.limit_amount - card.current_balance)}</p>
            </div>
          </div>

          {/* Usage bar */}
          <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: usagePercent > 85 ? '#FF6B6B' : usagePercent > 60 ? '#F39C12' : '#A8F5C8',
              width: `${usagePercent}%`, transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, margin: 0 }}>{Math.round(usagePercent)}% do limite usado</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 10, color: '#A8F5C8', fontWeight: 700 }}>✓ {formatCurrency(paid)}</span>
              {pending > 0 && <span style={{ fontSize: 10, color: '#FFD166', fontWeight: 700 }}>⏳ {formatCurrency(pending)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="px-4 py-4">
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-bg-sub)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Transações ({transactions.length})
        </p>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span style={{ fontSize: 48 }}>{theme.hasBow ? '🎀' : '💳'}</span>
            <p style={{ color: 'var(--on-bg)', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>Nenhuma transação neste ciclo</p>
            <p style={{ color: 'var(--on-bg-sub)', fontSize: 13 }}>As compras feitas neste período aparecerão aqui</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map(tx => {
              const isPaid = tx.is_paid
              return (
                <div
                  key={tx.id}
                  className="hk-card-hover"
                  onClick={() => router.push(`/transactions/${tx.id}/edit`)}
                  style={{
                    background: theme.hasBow ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                    border: `1px solid ${theme.hasBow ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: 14, padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', right: -12, bottom: -12, width: 56, height: 56, borderRadius: '50%', background: '#FFF0F0', opacity: 0.6, pointerEvents: 'none' }} />
                  <div style={{
                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                    background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    {tx.category?.icon ?? '💳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--on-bg)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--on-bg-sub)', margin: '2px 0 0' }}>
                      {formatDateShort(tx.date)}{tx.category?.name ? ` · ${tx.category.name}` : ''}
                      {tx.is_installment && tx.installment_total ? ` · ${tx.installment_current}/${tx.installment_total}x` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#FF6B6B', margin: 0 }}>
                      -{formatCurrency(tx.amount)}
                    </p>
                    <p style={{ fontSize: 10, margin: '2px 0 0', color: isPaid ? '#4CAF82' : '#FFB347', fontWeight: 600 }}>
                      {isPaid ? 'Pago' : 'Pendente'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
