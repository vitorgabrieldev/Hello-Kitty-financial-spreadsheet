'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Skeleton } from 'antd'
import { ArrowLeft, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateShort, getAccountTypeLabel } from '@/lib/utils'
import type { Account, Transaction } from '@/types'

const TYPE_EMOJI: Record<string, string> = {
  checking:   '🏦',
  savings:    '🐷',
  investment: '📈',
  cash:       '💵',
}

function TxIcon({ type }: { type: string }) {
  const bg = type === 'income' ? '#E8F7EF' : type === 'transfer' ? '#EBF5FF' : '#FFF0F0'
  const Icon = type === 'income' ? TrendingUp : type === 'transfer' ? ArrowLeftRight : TrendingDown
  const color = type === 'income' ? '#4CAF82' : type === 'transfer' ? '#3498DB' : '#FF6B6B'
  return (
    <div style={{ width: 38, height: 38, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={17} color={color} strokeWidth={2} />
    </div>
  )
}

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const [accountRes, txRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase
        .from('transactions')
        .select('*, category:categories(id,name,icon,color,type,is_default,created_at)')
        .eq('account_id', id)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100),
    ])

    if (accountRes.error || !accountRes.data) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setAccount(accountRes.data)
    setTransactions(txRes.data ?? [])
    setLoading(false)
  }

  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense' || t.type === 'debt_payment').reduce((s, t) => s + t.amount, 0)

  if (loading) {
    return (
      <div className="page-enter">
        <div className="hk-gradient px-4 pt-10 pb-6">
          <Skeleton.Button active style={{ width: 80, height: 32, borderRadius: 20, marginBottom: 16 }} />
          <Skeleton active paragraph={{ rows: 2 }} title={false} />
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

  if (notFound) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-screen gap-4 px-8">
        <span className="text-6xl">🏦</span>
        <p className="font-bold text-lg" style={{ color: 'var(--dark)' }}>Conta não encontrada</p>
        <Button type="primary" shape="round" onClick={() => router.push('/accounts')}>
          Voltar para contas
        </Button>
      </div>
    )
  }

  const typeEmoji = TYPE_EMOJI[account!.type] ?? '🏦'

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="hk-gradient px-4 pt-10 pb-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 text-8xl flex items-end justify-end pr-4 pb-2 pointer-events-none">
          {typeEmoji}
        </div>

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26,
          }}>
            {typeEmoji}
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">{account!.name}</p>
            <p className="text-white/70 text-sm">{account!.bank_name} · {getAccountTypeLabel(account!.type)}</p>
          </div>
        </div>

        {/* Balance + mini stats */}
        <div style={{
          marginTop: 20, background: 'rgba(255,255,255,0.15)', borderRadius: 16,
          padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              Saldo atual
            </p>
            <p style={{ color: 'white', fontSize: 30, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
              {formatCurrency(account!.balance)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px' }}>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 2px' }}>Entradas</p>
              <p style={{ color: '#A8F5C8', fontSize: 15, fontWeight: 700, margin: 0 }}>+{formatCurrency(income)}</p>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 12px' }}>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 2px' }}>Saídas</p>
              <p style={{ color: '#FFB3B3', fontSize: 15, fontWeight: 700, margin: 0 }}>-{formatCurrency(expense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="px-4 py-4">
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Transações ({transactions.length})
        </p>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <span style={{ fontSize: 48 }}>📭</span>
            <p style={{ color: 'var(--dark)', fontWeight: 600, marginTop: 12, marginBottom: 4 }}>Nenhuma transação</p>
            <p style={{ color: 'var(--gray)', fontSize: 13 }}>Esta conta ainda não tem movimentações</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transactions.map(tx => {
              const amountColor = tx.type === 'income' ? '#4CAF82' : tx.type === 'transfer' ? '#3498DB' : '#FF6B6B'
              const amountSign  = tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'
              const isPaid = tx.type === 'income' || tx.is_paid

              return (
                <div
                  key={tx.id}
                  className="hk-card-hover"
                  onClick={() => router.push(`/transactions/${tx.id}/edit`)}
                  style={{
                    background: 'white', borderRadius: 14, padding: '12px 14px',
                    border: '1px solid var(--border-light)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <TxIcon type={tx.type} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tx.description}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--gray)', margin: '2px 0 0' }}>
                      {formatDateShort(tx.date)}
                      {tx.type !== 'transfer' && tx.category?.name ? ` · ${tx.category.name}` : ''}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: amountColor, margin: 0 }}>
                      {amountSign}{formatCurrency(tx.amount)}
                    </p>
                    {tx.type !== 'income' && tx.type !== 'transfer' && (
                      <p style={{ fontSize: 10, margin: '2px 0 0', color: isPaid ? '#4CAF82' : '#FFB347', fontWeight: 600 }}>
                        {isPaid ? 'Pago' : 'Pendente'}
                      </p>
                    )}
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
