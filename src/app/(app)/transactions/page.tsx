'use client'

import { useEffect, useState } from 'react'
import { Tag, Skeleton, App } from 'antd'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import type { Transaction } from '@/types'

dayjs.locale('pt-br')

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const { message, modal } = App.useApp()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [currentMonth, typeFilter])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const start = currentMonth.startOf('month').format('YYYY-MM-DD')
    const end = currentMonth.endOf('month').format('YYYY-MM-DD')

    let query = supabase
      .from('transactions')
      .select('*, category:categories(*), account:accounts(name), card:cards(name)')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false })

    if (typeFilter !== 'all') query = query.eq('type', typeFilter)

    const { data } = await query
    setTransactions(data ?? [])
    setLoading(false)
  }

  async function handleDelete(tx: Transaction) {
    modal.confirm({
      title: 'Excluir lançamento?',
      content: `"${tx.description}" — ${formatCurrency(tx.amount)}`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        const supabase = createClient()
        await supabase.from('transactions').delete().eq('id', tx.id)
        message.success('Lançamento excluído')
        load()
      },
    })
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // Group by date
  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    const key = tx.date
    if (!acc[key]) acc[key] = []
    acc[key].push(tx)
    return acc
  }, {})

  return (
    <div className="page-enter">
      <PageHeader title="Lançamentos" showNotification />

      {/* Month navigation */}
      <div className="px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,107,157,0.08)', border: 'none', cursor: 'pointer' }}
        >
          <ChevronLeft size={18} style={{ color: '#FF6B9D' }} />
        </button>
        <p className="font-bold text-sm capitalize" style={{ color: '#3d1a2e' }}>
          {currentMonth.format('MMMM [de] YYYY')}
        </p>
        <button
          onClick={() => setCurrentMonth(m => m.add(1, 'month'))}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,107,157,0.08)', border: 'none', cursor: 'pointer' }}
        >
          <ChevronRight size={18} style={{ color: '#FF6B9D' }} />
        </button>
      </div>

      {/* Summary */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3" style={{ background: '#E8F7EF', border: '1px solid #B2E4CC' }}>
          <p className="text-xs mb-0.5" style={{ color: '#2D7A52' }}>Receitas</p>
          <p className="font-bold text-sm" style={{ color: '#2D7A52' }}>+{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: '#FFF0F0', border: '1px solid #FFCACA' }}>
          <p className="text-xs mb-0.5" style={{ color: '#C0392B' }}>Gastos</p>
          <p className="font-bold text-sm" style={{ color: '#C0392B' }}>-{formatCurrency(totalExpense)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 pb-3 flex items-center gap-2">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button
            key={f}
            onClick={() => setTypeFilter(f)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: typeFilter === f ? '#FF6B9D' : 'rgba(255,107,157,0.08)',
              color: typeFilter === f ? 'white' : '#FF6B9D',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : 'Gastos'}
          </button>
        ))}
      </div>

      {/* Transactions grouped by date */}
      <div className="px-4 flex flex-col gap-4 pb-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #FFE8F1' }}>
              <Skeleton active avatar paragraph={{ rows: 1 }} />
            </div>
          ))
        ) : Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-3">🎀</span>
            <p className="font-semibold text-sm" style={{ color: '#3d1a2e' }}>Nenhum lançamento</p>
            <p className="text-xs mt-1 mb-4" style={{ color: '#8B6B7A' }}>Toque no + para adicionar</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#C4A0B0' }}>
                {formatDateShort(date)}
              </p>
              <div className="flex flex-col gap-2">
                {txs.map(tx => (
                  <div
                    key={tx.id}
                    className="rounded-2xl p-4 bg-white flex items-center justify-between hk-card-hover"
                    style={{ border: '1px solid #FFE8F1' }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: tx.type === 'income' ? '#E8F7EF' : '#FFF0F0' }}
                      >
                        {tx.category?.icon ?? '✨'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#3d1a2e' }}>{tx.description}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs" style={{ color: '#8B6B7A' }}>{tx.category?.name}</span>
                          {tx.is_installment && tx.installment_total && (
                            <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px', borderRadius: 50 }} color="pink">
                              {tx.installment_current}/{tx.installment_total}x
                            </Tag>
                          )}
                          {tx.card && (
                            <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px', borderRadius: 50 }} color="purple">
                              💳 {tx.card.name}
                            </Tag>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: tx.type === 'income' ? '#4CAF82' : '#FF6B6B' }}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <button onClick={() => handleDelete(tx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={15} style={{ color: '#FFAAAA' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/transactions/new" className="hk-fab" aria-label="Novo lançamento">
        <Plus size={24} color="white" />
      </Link>
    </div>
  )
}
