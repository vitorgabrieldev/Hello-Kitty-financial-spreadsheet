'use client'

import { useEffect, useState } from 'react'
import { App } from 'antd'
import { ArrowLeft, ArrowRight, ArrowLeftRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useTheme } from '@/lib/theme-context'
import { useUser } from '@/lib/user-context'
import type { Account } from '@/types'

const ACCOUNT_EMOJI: Record<string, string> = {
  checking: '🏦', savings: '🐷', investment: '📈', cash: '💵',
}

function CurrencyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [cents, setCents] = useState(() => Math.round(value * 100))
  useEffect(() => { setCents(Math.round(value * 100)) }, [value])

  function formatCents(c: number) {
    const s = String(c).padStart(3, '0')
    return `${s.slice(0, -2).replace(/^0+/, '') || '0'},${s.slice(-2)}`
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    const next = digits === '' ? 0 : Math.min(parseInt(digits, 10), 999999999)
    setCents(next)
    onChange(next / 100)
  }

  return (
    <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>
        Valor a transferir
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)', fontWeight: 700 }}>R$</span>
        <input
          type="text" inputMode="numeric" enterKeyHint="done"
          value={formatCents(cents)} onChange={handleChange}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: 42, fontWeight: 800, color: 'white',
            width: `${Math.max(String(formatCents(cents)).length + 1, 5)}ch`,
            textAlign: 'center', caretColor: 'rgba(255,255,255,0.8)',
          }}
        />
      </div>
    </div>
  )
}

function AccountCard({
  account,
  selected,
  label,
  onSelect,
}: {
  account: Account | null
  selected: boolean
  label: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        flex: 1, border: selected ? '2px solid white' : '2px solid rgba(255,255,255,0.3)',
        borderRadius: 16, padding: '12px 10px', cursor: 'pointer', textAlign: 'left',
        background: selected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
        transition: 'all 0.2s',
      }}
    >
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
        {label}
      </p>
      {account ? (
        <>
          <div style={{ fontSize: 24, marginBottom: 4 }}>{ACCOUNT_EMOJI[account.type] ?? '🏦'}</div>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 2px' }}>{account.name}</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{formatCurrency(account.balance)}</p>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Selecionar</p>
        </div>
      )}
    </button>
  )
}

export default function TransferPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useUser()
  const { message } = App.useApp()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [fromId, setFromId] = useState<string | null>(null)
  const [toId, setToId] = useState<string | null>(null)
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('Transferência')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [picking, setPicking] = useState<'from' | 'to' | null>(null)

  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true)
      .then(({ data }) => setAccounts(data ?? []))
  }, [user])

  const fromAccount = accounts.find(a => a.id === fromId) ?? null
  const toAccount = accounts.find(a => a.id === toId) ?? null

  async function handleSave() {
    if (!user) return
    if (!fromId || !toId) { message.error('Selecione as duas contas'); return }
    if (fromId === toId) { message.error('As contas devem ser diferentes'); return }
    if (amount <= 0) { message.error('Informe um valor'); return }

    setSaving(true)
    const supabase = createClient()

    // Create two paired transactions (debit + credit)
    const peerIdPlaceholder = crypto.randomUUID()

    const { data: debit, error: e1 } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'transfer',
      amount,
      description,
      date,
      account_id: fromId,
      is_paid: true,
      is_installment: false,
      is_recurring: false,
      category_id: await getTransferCategoryId(supabase, user.id),
      transfer_peer_id: peerIdPlaceholder,
    }).select().single()

    if (e1 || !debit) { message.error('Erro ao criar transferência'); setSaving(false); return }

    const { data: credit, error: e2 } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'transfer',
      amount,
      description,
      date,
      account_id: toId,
      is_paid: true,
      is_installment: false,
      is_recurring: false,
      category_id: debit.category_id,
      transfer_peer_id: debit.id,
    }).select().single()

    if (e2 || !credit) { message.error('Erro ao criar transferência'); setSaving(false); return }

    // Update peer reference on the debit side
    await supabase.from('transactions').update({ transfer_peer_id: credit.id }).eq('id', debit.id)

    // Update account balances
    await Promise.all([
      supabase.from('accounts').update({ balance: (fromAccount!.balance - amount) }).eq('id', fromId),
      supabase.from('accounts').update({ balance: (toAccount!.balance + amount) }).eq('id', toId),
    ])

    message.success('Transferência realizada!')
    setSaving(false)
    router.back()
  }

  return (
    <div className="page-enter min-h-screen" style={{ background: 'var(--primary)' }}>
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
            borderRadius: 20, padding: '5px 14px', cursor: 'pointer', marginBottom: 12,
          }}
        >
          <ArrowLeft size={14} color="white" />
          <span style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>Voltar</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeftRight size={18} color="white" />
          </div>
          <h1 style={{ color: 'white', fontWeight: 800, fontSize: 22, margin: 0 }}>Transferência</h1>
        </div>

        <CurrencyInput value={amount} onChange={setAmount} />

        {/* From → To selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <AccountCard account={fromAccount} selected={!!fromId} label="De" onSelect={() => setPicking('from')} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <ArrowRight size={22} color="rgba(255,255,255,0.7)" />
          </div>
          <AccountCard account={toAccount} selected={!!toId} label="Para" onSelect={() => setPicking('to')} />
        </div>
      </div>

      {/* Form fields */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-bg-sub)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Descrição</p>
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{
              width: '100%', height: 46, padding: '0 14px',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,
              fontSize: 15, fontWeight: 600, color: 'var(--on-bg)',
              background: 'rgba(255,255,255,0.12)', outline: 'none',
              backdropFilter: 'blur(8px)',
            }}
          />
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-bg-sub)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>Data</p>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              width: '100%', height: 46, padding: '0 14px',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10,
              fontSize: 15, fontWeight: 600, color: 'var(--on-bg)',
              background: 'rgba(255,255,255,0.12)', outline: 'none',
              backdropFilter: 'blur(8px)',
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !fromId || !toId || amount <= 0}
          style={{
            width: '100%', height: 52, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: saving || !fromId || !toId || amount <= 0 ? 'rgba(255,255,255,0.2)' : 'white',
            color: saving || !fromId || !toId || amount <= 0 ? 'rgba(255,255,255,0.5)' : 'var(--primary)',
            fontWeight: 800, fontSize: 16, transition: 'all 0.2s', marginTop: 8,
          }}
        >
          {saving ? 'Transferindo...' : `Transferir ${amount > 0 ? formatCurrency(amount) : ''}`}
        </button>
      </div>

      {/* Account picker sheet */}
      {picking && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setPicking(null)}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'white', borderRadius: '20px 20px 0 0',
              padding: '20px 16px 40px',
              maxHeight: '60vh', overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E0D0D8', margin: '0 auto 20px' }} />
            <p style={{ fontWeight: 800, fontSize: 16, color: '#3d1a2e', margin: '0 0 16px' }}>
              {picking === 'from' ? 'Conta de origem' : 'Conta de destino'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {accounts.map(acc => {
                const isOtherSide = picking === 'from' ? acc.id === toId : acc.id === fromId
                return (
                  <button
                    key={acc.id}
                    type="button"
                    disabled={isOtherSide}
                    onClick={() => {
                      if (picking === 'from') setFromId(acc.id)
                      else setToId(acc.id)
                      setPicking(null)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 14, border: '1px solid #FFE8F1',
                      background: isOtherSide ? '#F5F5F5' : 'white', cursor: isOtherSide ? 'not-allowed' : 'pointer',
                      opacity: isOtherSide ? 0.4 : 1,
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: acc.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {ACCOUNT_EMOJI[acc.type] ?? '🏦'}
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#3d1a2e', margin: 0 }}>{acc.name}</p>
                      <p style={{ fontSize: 12, color: '#8B6B7A', margin: 0 }}>{acc.bank_name} · {formatCurrency(acc.balance)}</p>
                    </div>
                    {(picking === 'from' ? acc.id === fromId : acc.id === toId) && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: 12 }}>✓</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

async function getTransferCategoryId(supabase: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Transferência')
    .limit(1)
    .single()

  if (data) return data.id

  const { data: created } = await supabase
    .from('categories')
    .insert({ name: 'Transferência', icon: '↔️', color: '#3498DB', type: 'both', is_default: true, user_id: userId })
    .select('id')
    .single()

  return created?.id ?? ''
}
