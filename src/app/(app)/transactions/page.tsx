'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Tag, Skeleton, App } from 'antd'
import { Plus, Trash2, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import type { Transaction } from '@/types'

dayjs.locale('pt-br')

function formatDateDisplay(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'pending'>('all')
  const [selected, setSelected] = useState<Transaction | null>(null)
  const { message, modal } = App.useApp()
  const router = useRouter()

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

    if (typeFilter === 'pending') {
      query = query.eq('is_paid', false)
    } else if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter)
    }

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
        setSelected(null)
        load()
      },
    })
  }

  async function handleTogglePaid(tx: Transaction) {
    const supabase = createClient()
    const today = new Date()
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const nowPaid = !tx.is_paid
    const { error } = await supabase
      .from('transactions')
      .update({ is_paid: nowPaid, paid_at: nowPaid ? iso : null })
      .eq('id', tx.id)
    if (error) { message.error('Erro ao atualizar'); return }
    message.success(nowPaid ? 'Marcado como pago ✅' : 'Desmarcado como pendente ⏳')
    // Atualiza o item selecionado localmente
    setSelected(prev => prev ? { ...prev, is_paid: nowPaid, paid_at: nowPaid ? iso : undefined } : null)
    load()
  }

  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type !== 'income').reduce((s, t) => s + t.amount, 0)
  const totalPending = transactions.filter(t => !t.is_paid && t.type !== 'income').reduce((s, t) => s + t.amount, 0)

  const grouped = transactions.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = []
    acc[tx.date].push(tx)
    return acc
  }, {})

  const FILTERS = [
    { key: 'all',     label: 'Todos' },
    { key: 'income',  label: 'Receitas' },
    { key: 'expense', label: 'Gastos' },
    { key: 'pending', label: '⏳ Pendentes' },
  ] as const

  // ── Detail Sheet ──────────────────────────────────────────────────────────────
  function DetailSheet({ tx }: { tx: Transaction }) {
    const isPending = !tx.is_paid && tx.type !== 'income'
    return createPortal(
      <div
        onClick={() => setSelected(null)}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(61,26,46,0.55)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          zIndex: 2000, display: 'flex', alignItems: 'flex-end',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'white', width: '100%',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
            animation: 'sheetUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
          }}
        >
          {/* handle + close */}
          <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,107,157,0.25)', margin: '0 auto' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 0' }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#3d1a2e', margin: 0 }}>Detalhes</p>
            <button
              onClick={() => setSelected(null)}
              style={{ background: 'rgba(255,107,157,0.08)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} style={{ color: '#FF6B9D' }} />
            </button>
          </div>

          {/* Icon + description */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              background: tx.type === 'income' ? '#E8F7EF' : isPending ? '#FFF8E8' : '#FFF0F0',
            }}>
              {tx.category?.icon ?? '✨'}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 17, color: '#3d1a2e', margin: 0 }}>{tx.description}</p>
              <p style={{ fontSize: 13, color: '#8B6B7A', margin: '2px 0 0' }}>{tx.category?.name}</p>
            </div>
          </div>

          {/* Amount */}
          <div style={{ margin: '0 20px 16px', background: tx.type === 'income' ? '#E8F7EF' : isPending ? '#FFF8E8' : '#FFF0F0', borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#8B6B7A' }}>Valor</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: tx.type === 'income' ? '#2D7A52' : isPending ? '#B8860B' : '#C0392B' }}>
              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
            </span>
          </div>

          {/* Info rows */}
          <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            <Row label="Data" value={formatDateDisplay(tx.date)} />
            {tx.account && <Row label="Conta" value={tx.account.name} />}
            {tx.card && <Row label="Cartão" value={`💳 ${tx.card.name}`} />}
            {tx.is_installment && tx.installment_total && (
              <Row label="Parcela" value={`${tx.installment_current}/${tx.installment_total}x`} />
            )}
            {tx.is_recurring && tx.recurrence_frequency && (
              <Row label="Recorrência" value={FREQ_LABELS[tx.recurrence_frequency] ?? tx.recurrence_frequency} />
            )}
            {tx.notes && <Row label="Observações" value={tx.notes} />}
          </div>

          {/* Pago toggle — só para gastos */}
          {tx.type !== 'income' && (
            <div
              style={{ margin: '0 20px 20px', background: 'rgba(255,107,157,0.04)', border: '1px solid #FFE8F1', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => handleTogglePaid(tx)}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#3d1a2e', margin: 0 }}>
                  {tx.is_paid ? 'Pago ✅' : 'Pendente ⏳'}
                </p>
                <p style={{ fontSize: 12, color: '#8B6B7A', margin: '2px 0 0' }}>
                  {tx.is_paid ? (tx.paid_at ? `Em ${formatDateDisplay(tx.paid_at)}` : 'Data não registrada') : 'Toque para marcar como pago'}
                </p>
              </div>
              <div style={{
                width: 48, height: 28, borderRadius: 99,
                background: tx.is_paid ? '#4CAF82' : '#e0e0e0',
                position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
              }}>
                <span style={{
                  position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
                  background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s ease', left: tx.is_paid ? 23 : 3,
                }} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ padding: '0 20px', display: 'flex', gap: 10 }}>
            <button
              onClick={() => { setSelected(null); router.push(`/transactions/${tx.id}/edit`) }}
              style={{
                flex: 1, height: 48, borderRadius: 50,
                background: 'rgba(255,107,157,0.08)', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, color: '#FF6B9D',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Pencil size={15} /> Editar
            </button>
            <button
              onClick={() => handleDelete(tx)}
              style={{
                flex: 1, height: 48, borderRadius: 50,
                background: '#FFF0F0', border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 700, color: '#C0392B',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Trash2 size={15} /> Excluir
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

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
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl p-3" style={{ background: '#E8F7EF', border: '1px solid #B2E4CC' }}>
          <p className="text-xs mb-0.5" style={{ color: '#2D7A52' }}>Receitas</p>
          <p className="font-bold text-sm" style={{ color: '#2D7A52' }}>+{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: '#FFF0F0', border: '1px solid #FFCACA' }}>
          <p className="text-xs mb-0.5" style={{ color: '#C0392B' }}>Gastos</p>
          <p className="font-bold text-sm" style={{ color: '#C0392B' }}>-{formatCurrency(totalExpense)}</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: '#FFF8E8', border: '1px solid #FFE0A0' }}>
          <p className="text-xs mb-0.5" style={{ color: '#B8860B' }}>Pendente</p>
          <p className="font-bold text-sm" style={{ color: '#B8860B' }}>{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 pb-3 flex items-center gap-2 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0"
            style={{
              background: typeFilter === f.key ? '#FF6B9D' : 'rgba(255,107,157,0.08)',
              color: typeFilter === f.key ? 'white' : '#FF6B9D',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {f.label}
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
                {txs.map(tx => {
                  const isPending = !tx.is_paid && tx.type !== 'income'
                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => setSelected(tx)}
                      className="rounded-2xl p-4 bg-white flex items-center justify-between hk-card-hover w-full text-left"
                      style={{
                        border: isPending ? '1px solid #FFE0A0' : '1px solid #FFE8F1',
                        opacity: isPending ? 0.92 : 1,
                        cursor: 'pointer',
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-lg flex-shrink-0 relative"
                          style={{ background: tx.type === 'income' ? '#E8F7EF' : isPending ? '#FFF8E8' : '#FFF0F0' }}
                        >
                          {tx.category?.icon ?? '✨'}
                          {isPending && (
                            <span style={{
                              position: 'absolute', bottom: -2, right: -2,
                              width: 14, height: 14, borderRadius: '50%',
                              background: '#F39C12', border: '2px solid white',
                              fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>⏳</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: '#3d1a2e' }}>{tx.description}</p>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="text-xs" style={{ color: '#8B6B7A' }}>{tx.category?.name}</span>
                            {isPending && (
                              <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px', borderRadius: 50, margin: 0 }} color="gold">
                                pendente
                              </Tag>
                            )}
                            {tx.is_paid && tx.type !== 'income' && (
                              <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px', borderRadius: 50, margin: 0, background: '#E8F7EF', borderColor: '#B2E4CC', color: '#2D7A52' }}>
                                pago ✓
                              </Tag>
                            )}
                            {tx.is_installment && tx.installment_total && (
                              <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px', borderRadius: 50, margin: 0 }} color="pink">
                                {tx.installment_current}/{tx.installment_total}x
                              </Tag>
                            )}
                            {tx.card && (
                              <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px', borderRadius: 50, margin: 0 }} color="purple">
                                💳 {tx.card.name}
                              </Tag>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="font-bold text-sm flex-shrink-0 ml-2" style={{ color: tx.type === 'income' ? '#4CAF82' : isPending ? '#B8860B' : '#FF6B6B' }}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <Link href="/transactions/new" className="hk-fab" aria-label="Novo lançamento">
        <Plus size={24} color="white" />
      </Link>

      {selected && <DetailSheet tx={selected} />}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ fontSize: 13, color: '#8B6B7A', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#3d1a2e', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  yearly: 'Anual',
}
