'use client'

import { useEffect, useState } from 'react'
import { App } from 'antd'
import { ArrowLeft, RefreshCcw, Trash2, Pause } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useTheme } from '@/lib/theme-context'
import { useUser } from '@/lib/user-context'
import type { Transaction } from '@/types'

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Toda semana',
  biweekly: 'A cada 2 semanas',
  monthly: 'Todo mês',
  bimonthly: 'A cada 2 meses',
  quarterly: 'A cada 3 meses',
  yearly: 'Todo ano',
}

function nextDateLabel(iso: string | undefined) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function RecurringPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useUser()
  const { message, modal } = App.useApp()

  const [recurrings, setRecurrings] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) load()
  }, [user])

  async function load() {
    if (!user) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(id,name,icon,color,type,is_default,created_at)')
      .eq('user_id', user.id)
      .eq('is_recurring', true)
      .order('recurrence_next_date', { ascending: true })

    if (error) message.error('Erro ao carregar recorrentes')
    setRecurrings(data ?? [])
    setLoading(false)
  }

  async function handleCancel(tx: Transaction) {
    modal.confirm({
      title: 'Cancelar recorrência?',
      content: `"${tx.description}" não vai mais gerar novas cobranças. As transações já geradas continuam.`,
      okText: 'Cancelar recorrência',
      okButtonProps: { danger: true },
      cancelText: 'Manter',
      onOk: async () => {
        const supabase = createClient()
        const { error } = await supabase
          .from('transactions')
          .update({ is_recurring: false, recurrence_frequency: null, recurrence_next_date: null })
          .eq('id', tx.id)
          .eq('user_id', user!.id)
        if (error) { message.error('Erro ao cancelar'); return }
        message.success('Recorrência cancelada')
        load()
      },
    })
  }

  async function handleDelete(tx: Transaction) {
    modal.confirm({
      title: 'Excluir recorrência e histórico?',
      content: `Vai excluir "${tx.description}" e todas as transações geradas por ela.`,
      okText: 'Excluir tudo',
      okButtonProps: { danger: true },
      cancelText: 'Voltar',
      onOk: async () => {
        const supabase = createClient()
        await supabase.from('transactions').delete().eq('recurrence_origin_id', tx.id).eq('user_id', user!.id)
        await supabase.from('transactions').delete().eq('id', tx.id).eq('user_id', user!.id)
        message.success('Excluído com sucesso')
        load()
      },
    })
  }

  const typeColor = (type: string) => type === 'income' ? '#4CAF82' : '#FF6B6B'
  const typeSign  = (type: string) => type === 'income' ? '+' : '−'

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="hk-gradient px-4 pt-10 pb-6 relative overflow-hidden">
        <div style={{ position: 'absolute', right: -60, top: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.09)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: -40, bottom: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 55%)', pointerEvents: 'none' }} />

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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCcw size={20} color="white" />
          </div>
          <div>
            <h1 style={{ color: 'white', fontWeight: 800, fontSize: 22, margin: 0 }}>Recorrentes</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: 0 }}>
              {recurrings.length} ativo{recurrings.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              height: 80, borderRadius: 16,
              background: 'rgb(255 255 255 / 26%)',
              border: '1px solid rgba(255,255,255,0.2)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))
        ) : recurrings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <span style={{ fontSize: 52 }}>{theme.hasBow ? '🎀' : '🔄'}</span>
            <p style={{ color: 'var(--on-bg)', fontWeight: 700, fontSize: 16, marginTop: 16 }}>
              Nenhum lançamento recorrente
            </p>
            <p style={{ color: 'var(--on-bg-sub)', fontSize: 13, marginTop: 4 }}>
              Ao criar um lançamento, marque-o como recorrente
            </p>
          </div>
        ) : (
          recurrings.map(tx => (
            <div
              key={tx.id}
              style={{
                background: 'rgb(255 255 255 / 26%)',
                backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
                border: '1px solid rgba(255,255,255,0.13)',
                borderRadius: 16, overflow: 'hidden',
              }}
            >
              {/* Main row */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: tx.type === 'income' ? 'rgba(76,175,130,0.18)' : 'rgba(255,107,107,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {tx.category?.icon ?? '🔄'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--on-bg)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--on-bg-sub)', margin: 0 }}>
                    {FREQ_LABEL[tx.recurrence_frequency ?? ''] ?? tx.recurrence_frequency}
                    {' · '}próxima em {nextDateLabel(tx.recurrence_next_date ?? undefined)}
                  </p>
                </div>

                <p style={{ fontWeight: 800, fontSize: 15, color: 'white', flexShrink: 0 }}>
                  {typeSign(tx.type)}{formatCurrency(tx.amount)}
                </p>
              </div>

              {/* Action bar */}
              <div style={{
                display: 'flex',
                borderTop: '1px solid rgba(255,255,255,0.10)',
              }}>
                <button
                  type="button"
                  onClick={() => handleCancel(tx)}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontSize: 12, fontWeight: 700, color: 'white',
                    borderRight: theme.hasBow ? '1px solid #FFE8F1' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <Pause size={14} />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tx)}
                  style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                    background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontSize: 12, fontWeight: 700, color: 'white',
                  }}
                >
                  <Trash2 size={14} />
                  Excluir tudo
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
