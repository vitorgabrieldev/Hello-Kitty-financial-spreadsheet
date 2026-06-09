'use client'

import { useEffect, useState, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { App } from 'antd'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Category, Account, Card, Debt, RecurrenceFrequency } from '@/types'

// ── ATM-style currency input ──────────────────────────────────────────────────
function CurrencyInput({ value, onChange }: { value?: number; onChange?: (v: number) => void }) {
  const [cents, setCents] = useState(() => Math.round((value ?? 0) * 100))

  useEffect(() => { setCents(Math.round((value ?? 0) * 100)) }, [value])

  function formatCents(c: number) {
    const s = String(c).padStart(3, '0')
    const intPart = s.slice(0, -2).replace(/^0+/, '') || '0'
    return `${intPart},${s.slice(-2)}`
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    const next = digits === '' ? 0 : Math.min(parseInt(digits, 10), 999999999)
    setCents(next)
    onChange?.(next / 100)
  }

  function scrollUp(e: React.FocusEvent<HTMLInputElement>) {
    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
  }

  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 14, color: '#8B6B7A', fontWeight: 600, zIndex: 1, pointerEvents: 'none',
      }}>R$</span>
      <input
        type="text" inputMode="numeric" enterKeyHint="done"
        value={formatCents(cents)} onChange={handleChange} onFocus={scrollUp}
        style={{
          width: '100%', height: 46, paddingLeft: 38, paddingRight: 14,
          border: '1px solid #d9d9d9', borderRadius: 8,
          fontSize: 15, fontWeight: 600, color: '#3d1a2e', letterSpacing: 0.5,
          background: 'white', outline: 'none', caretColor: '#FF6B9D',
          cursor: 'text', transition: 'border-color 0.2s', WebkitAppearance: 'none',
        }}
      />
    </div>
  )
}

// ── Styled text input ─────────────────────────────────────────────────────────
function StyledInput({ value, onChange, placeholder, enterKeyHint }: {
  value?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  enterKeyHint?: 'next' | 'done' | 'go' | 'search' | 'send'
}) {
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
  }
  return (
    <input
      type="text" value={value ?? ''} onChange={onChange}
      placeholder={placeholder} enterKeyHint={enterKeyHint} onFocus={handleFocus}
      style={{
        width: '100%', height: 46, padding: '0 14px',
        border: '1px solid #d9d9d9', borderRadius: 8,
        fontSize: 15, fontWeight: 600, color: '#3d1a2e', letterSpacing: 0.5,
        background: 'white', outline: 'none', caretColor: '#FF6B9D',
        transition: 'border-color 0.2s', WebkitAppearance: 'none',
      }}
    />
  )
}

// ── Styled textarea ───────────────────────────────────────────────────────────
function StyledTextarea({ value, onChange, placeholder }: {
  value?: string
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>
  placeholder?: string
}) {
  function handleFocus(e: React.FocusEvent<HTMLTextAreaElement>) {
    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
  }
  return (
    <textarea
      value={value ?? ''} onChange={onChange} placeholder={placeholder}
      rows={2} onFocus={handleFocus}
      style={{
        width: '100%', padding: '10px 14px',
        border: '1px solid #d9d9d9', borderRadius: 8,
        fontSize: 15, fontWeight: 600, color: '#3d1a2e',
        background: 'white', outline: 'none', caretColor: '#FF6B9D',
        resize: 'none', transition: 'border-color 0.2s', WebkitAppearance: 'none',
        fontFamily: 'inherit',
      }}
    />
  )
}

// ── Picker trigger button ─────────────────────────────────────────────────────
function PickerButton({ label, placeholder, onOpen }: { label?: string; placeholder: string; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} style={{
      width: '100%', height: 46,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 14px', border: '1px solid #d9d9d9', borderRadius: 8,
      background: 'white', cursor: 'pointer',
    }}>
      <span style={{ fontSize: 14, color: label ? '#3d1a2e' : '#bfbfbf', fontWeight: label ? 600 : 400 }}>
        {label ?? placeholder}
      </span>
      <ChevronRight size={16} style={{ color: '#C4A0B0', flexShrink: 0 }} />
    </button>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 6 }}>{label}</p>
      {children}
      {error && <p style={{ fontSize: 12, color: '#FF6B6B', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

// ── Picker overlay ────────────────────────────────────────────────────────────
function PickerOverlay({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(61,26,46,0.55)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      zIndex: 2000, display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', width: '100%',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        animation: 'sheetUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
        maxHeight: '70dvh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #FFE8F1', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,107,157,0.25)', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#3d1a2e' }}>{title}</p>
        </div>
        <div style={{ overflowY: 'auto', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

function PickerItem({ label, selected, onClick }: { label: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', padding: '15px 20px',
      background: selected ? '#FFF0F7' : 'white',
      border: 'none', borderTop: '1px solid #FFE8F1',
      cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s ease',
    }}>
      <span style={{ fontSize: 15, color: '#3d1a2e', fontWeight: 500 }}>{label}</span>
      {selected && <span style={{ color: '#FF6B9D', fontWeight: 800, fontSize: 18 }}>✓</span>}
    </button>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateDisplay(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function addFrequency(dateStr: string, freq: RecurrenceFrequency): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  let date: Date
  switch (freq) {
    case 'weekly':    date = new Date(y, m - 1, d + 7); break
    case 'biweekly':  date = new Date(y, m - 1, d + 14); break
    case 'monthly':   date = new Date(y, m, d); break
    case 'bimonthly': date = new Date(y, m + 1, d); break
    case 'quarterly': date = new Date(y, m + 2, d); break
    case 'yearly':    date = new Date(y + 1, m - 1, d); break
    default:          date = new Date(y, m, d)
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly',    label: 'Semanal' },
  { value: 'biweekly',  label: 'Quinzenal' },
  { value: 'monthly',   label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly',    label: 'Anual' },
]

type TxType = 'expense' | 'income' | 'debt_payment' | 'transfer'

const TYPE_OPTIONS: { value: TxType; label: string; color: string }[] = [
  { value: 'expense',      label: '💸 Gasto',           color: '#FF6B6B' },
  { value: 'income',       label: '💰 Receita',          color: '#4CAF82' },
  { value: 'debt_payment', label: '💳 Pagar dívida',     color: '#9B59B6' },
  { value: 'transfer',     label: '↔️ Transferência',    color: '#3498DB' },
]

// ── Main page ─────────────────────────────────────────────────────────────────
export default function NewTransactionPage() {
  return (
    <Suspense>
      <NewTransactionForm />
    </Suspense>
  )
}

function NewTransactionForm() {
  const router = useRouter()
  const { message } = App.useApp()
  const searchParams = useSearchParams()

  function resolveType(p: string | null): TxType {
    return (['expense', 'income', 'debt_payment', 'transfer'] as TxType[]).includes(p as TxType)
      ? (p as TxType)
      : 'expense'
  }

  const [type, setType] = useState<TxType>(() => resolveType(searchParams.get('type')))

  useEffect(() => {
    setType(resolveType(searchParams.get('type')))
  }, [searchParams])
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [toAccountId, setToAccountId] = useState<string | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  const [debtId, setDebtId] = useState<string | null>(null)
  const [installmentTotal, setInstallmentTotal] = useState<number | null>(null)
  const [isInstallment, setIsInstallment] = useState(false)

  const [isPaid, setIsPaid] = useState(false)
  const [paidAt, setPaidAt] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('monthly')

  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [picker, setPicker] = useState<'category' | 'account' | 'to_account' | 'card' | 'installments' | 'date' | 'paid_at' | 'debt' | 'recurrence' | null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [catRes, accRes, cardRes, debtRes] = await Promise.all([
      supabase.from('categories').select('*').or(`is_default.eq.true,user_id.eq.${user.id}`).order('name'),
      supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('cards').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('debts').select('*').eq('user_id', user.id).eq('status', 'active').order('name'),
    ])
    setCategories(catRes.data ?? [])
    setAccounts(accRes.data ?? [])
    setCards(cardRes.data ?? [])
    setDebts(debtRes.data ?? [])
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!amount || amount <= 0) e.amount = 'Informe um valor maior que zero'
    if (type === 'transfer') {
      if (!accountId) e.account = 'Selecione a conta de origem'
      if (!toAccountId) e.to_account = 'Selecione a conta de destino'
      if (accountId && toAccountId && accountId === toAccountId) e.to_account = 'Contas devem ser diferentes'
    } else {
      if (type !== 'debt_payment' && !description.trim()) e.description = 'Informe a descrição'
      if (type !== 'debt_payment' && !categoryId) e.category = 'Selecione uma categoria'
      if (type === 'debt_payment' && !debtId) e.debt = 'Selecione a dívida'
    }
    if (!date) e.date = 'Informe a data'
    if (isInstallment && !installmentTotal) e.installments = 'Selecione o número de parcelas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (type === 'transfer') {
        const defaultCatId = await getDefaultCategoryId(supabase, user.id)
        // Insere saída (expense na conta origem)
        const { data: txOut, error: outErr } = await supabase.from('transactions').insert({
          user_id: user.id, type: 'transfer', amount,
          description: description.trim() || `Transferência para ${accounts.find(a => a.id === toAccountId)?.name ?? ''}`,
          date, category_id: defaultCatId,
          account_id: accountId, is_installment: false, is_recurring: false,
          is_paid: true, paid_at: date, notes: notes.trim() || null,
        }).select('id').single()
        if (outErr) throw outErr

        // Insere entrada (income na conta destino)
        const { data: txIn, error: inErr } = await supabase.from('transactions').insert({
          user_id: user.id, type: 'transfer', amount,
          description: description.trim() || `Transferência de ${accounts.find(a => a.id === accountId)?.name ?? ''}`,
          date, category_id: defaultCatId,
          account_id: toAccountId, is_installment: false, is_recurring: false,
          is_paid: true, paid_at: date, notes: notes.trim() || null,
        }).select('id').single()
        if (inErr) throw inErr

        // Liga as duas via transfer_peer_id
        await Promise.all([
          supabase.from('transactions').update({ transfer_peer_id: txIn!.id }).eq('id', txOut!.id),
          supabase.from('transactions').update({ transfer_peer_id: txOut!.id }).eq('id', txIn!.id),
        ])
        message.success('Transferência registrada! ↔️')
      } else if (type === 'debt_payment') {
        const selectedDebt = debts.find(d => d.id === debtId)!
        const newPaid = Math.min(selectedDebt.paid_amount + amount, selectedDebt.total_amount)
        const newStatus = newPaid >= selectedDebt.total_amount ? 'paid' : 'active'

        // Registra a transação de pagamento
        const { error: txError } = await supabase.from('transactions').insert({
          user_id: user.id,
          type: 'debt_payment',
          amount,
          description: `Pagamento: ${selectedDebt.name}`,
          date,
          category_id: categoryId ?? await getDefaultCategoryId(supabase, user.id),
          debt_id: debtId,
          account_id: accountId ?? null,
          is_installment: false,
          is_recurring: false,
          is_paid: true,
          paid_at: date,
          notes: notes.trim() || null,
        })
        if (txError) throw txError

        // Atualiza a dívida
        const { error: debtError } = await supabase
          .from('debts')
          .update({ paid_amount: newPaid, status: newStatus })
          .eq('id', debtId)
        if (debtError) throw debtError

        if (newStatus === 'paid') {
          message.success(`Dívida "${selectedDebt.name}" quitada! 🎉`)
        } else {
          message.success('Pagamento registrado! 🎀')
        }
      } else {
        const resolvedIsPaid = type === 'income' ? true : isPaid
        const payload = {
          user_id: user.id,
          type,
          amount,
          description: description.trim(),
          date,
          category_id: categoryId,
          account_id: accountId ?? null,
          card_id: cardId ?? null,
          is_installment: isInstallment,
          installment_total: isInstallment ? installmentTotal : null,
          installment_current: isInstallment ? 1 : null,
          notes: notes.trim() || null,
          is_paid: resolvedIsPaid,
          paid_at: resolvedIsPaid ? (paidAt || date) : null,
          is_recurring: isRecurring,
          recurrence_frequency: isRecurring ? recurrenceFrequency : null,
          recurrence_next_date: isRecurring ? addFrequency(date, recurrenceFrequency) : null,
        }

        if (isInstallment && installmentTotal && installmentTotal > 1) {
          const groupId = crypto.randomUUID()
          const [y, m, d] = date.split('-').map(Number)
          const installments = Array.from({ length: installmentTotal }, (_, i) => {
            const dt = new Date(y, m - 1 + i, d)
            const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
            return { ...payload, installment_current: i + 1, installment_group_id: groupId, date: iso }
          })
          const { error } = await supabase.from('transactions').insert(installments)
          if (error) throw error
        } else {
          const { error } = await supabase.from('transactions').insert(payload)
          if (error) throw error
        }

        message.success('Lançamento adicionado! 🎀')
      }

      router.push('/transactions')
    } catch {
      message.error('Erro ao salvar lançamento')
    } finally {
      setLoading(false)
    }
  }

  // Busca categoria "Outros" como fallback para pagamento de dívida
  async function getDefaultCategoryId(supabase: ReturnType<typeof createClient>, userId: string) {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .or(`is_default.eq.true,user_id.eq.${userId}`)
      .eq('name', 'Outros')
      .single()
    return data?.id ?? null
  }

  function switchType(t: TxType) {
    setType(t)
    setCategoryId(null)
    setCardId(null)
    setDebtId(null)
    setToAccountId(null)
    setIsInstallment(false)
    setInstallmentTotal(null)
    setErrors({})
    if (t === 'income' || t === 'transfer') { setIsPaid(true); setPaidAt('') }
    else { setIsPaid(false); setPaidAt('') }
    setIsRecurring(false)
    setRecurrenceFrequency('monthly')
  }

  const filteredCategories = categories.filter(c => {
    if (type === 'income') return c.type === 'income' || c.type === 'both'
    return c.type === 'expense' || c.type === 'both'
  })
  const selectedCategory = categories.find(c => c.id === categoryId)
  const selectedAccount = accounts.find(a => a.id === accountId)
  const selectedToAccount = accounts.find(a => a.id === toAccountId)
  const selectedCard = cards.find(c => c.id === cardId)
  const selectedDebt = debts.find(d => d.id === debtId)
  const activeType = TYPE_OPTIONS.find(t => t.value === type)!

  return (
    <div style={{ minHeight: '100dvh', background: '#FFF5F8' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '52px 16px 12px' }}>
        <button type="button" onClick={() => router.back()} style={{
          width: 40, height: 40, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,107,157,0.08)', border: 'none', cursor: 'pointer', flexShrink: 0,
        }}>
          <ChevronLeft size={20} style={{ color: '#FF6B9D' }} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#3d1a2e', margin: 0 }}>Novo lançamento</h1>
      </div>

      {/* Type toggle */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 8, columnGap: 8 }}>
          {TYPE_OPTIONS.map(t => (
            <button key={t.value} type="button" onClick={() => switchType(t.value)} style={{
              height: 44, borderRadius: 12,
              background: type === t.value ? t.color : 'transparent',
              color: type === t.value ? 'white' : '#8B6B7A',
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              transition: 'all 0.18s ease',
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '0 16px', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>

        {/* Pagamento de dívida */}
        {type === 'debt_payment' && (
          <>
            {debts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <span style={{ fontSize: 40 }}>💸</span>
                <p style={{ fontWeight: 700, color: '#3d1a2e', marginTop: 12 }}>Nenhuma dívida ativa</p>
                <p style={{ fontSize: 13, color: '#8B6B7A' }}>Cadastre uma dívida antes de registrar um pagamento</p>
                <button type="button" onClick={() => router.push('/debts')} style={{
                  marginTop: 12, padding: '10px 20px', borderRadius: 50,
                  background: '#FF6B9D', color: 'white', border: 'none',
                  cursor: 'pointer', fontWeight: 700, fontSize: 14,
                }}>
                  Ir para Dívidas
                </button>
              </div>
            ) : (
              <>
                <Field label="Dívida" error={errors.debt}>
                  <PickerButton
                    label={selectedDebt ? `💸 ${selectedDebt.name}` : undefined}
                    placeholder="Selecione a dívida..."
                    onOpen={() => setPicker('debt')}
                  />
                </Field>

                {selectedDebt && (
                  <div style={{ background: 'rgba(155,89,182,0.06)', border: '1px solid rgba(155,89,182,0.2)', borderRadius: 12, padding: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#8B6B7A', fontWeight: 600 }}>Credor</span>
                      <span style={{ fontSize: 12, color: '#3d1a2e', fontWeight: 700 }}>{selectedDebt.creditor}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#8B6B7A', fontWeight: 600 }}>Restante</span>
                      <span style={{ fontSize: 12, color: '#FF6B6B', fontWeight: 700 }}>
                        {formatCurrency(selectedDebt.total_amount - selectedDebt.paid_amount)}
                      </span>
                    </div>
                    {selectedDebt.installment_amount && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#8B6B7A', fontWeight: 600 }}>Parcela</span>
                        <span style={{ fontSize: 12, color: '#3d1a2e', fontWeight: 700 }}>
                          {formatCurrency(selectedDebt.installment_amount)}
                        </span>
                      </div>
                    )}
                    {/* mini progress */}
                    <div style={{ marginTop: 10, height: 6, borderRadius: 99, background: '#FFE8F1', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99, background: '#9B59B6',
                        width: `${Math.min((selectedDebt.paid_amount / selectedDebt.total_amount) * 100, 100)}%`,
                      }} />
                    </div>
                  </div>
                )}

                <Field label="Valor pago" error={errors.amount}>
                  <CurrencyInput value={amount} onChange={v => { setAmount(v); setErrors(p => ({ ...p, amount: '' })) }} />
                </Field>

                <Field label="Data" error={errors.date}>
                  <PickerButton label={formatDateDisplay(date)} placeholder="Data..." onOpen={() => setPicker('date')} />
                </Field>

                {accounts.length > 0 && (
                  <Field label="Conta debitada (opcional)">
                    <PickerButton
                      label={selectedAccount ? `🏦 ${selectedAccount.name}` : undefined}
                      placeholder="Selecione a conta..."
                      onOpen={() => setPicker('account')}
                    />
                    {selectedAccount && (
                      <button type="button" onClick={() => setAccountId(null)} style={{ marginTop: 6, fontSize: 12, color: '#FF6B9D', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                        × Remover conta
                      </button>
                    )}
                  </Field>
                )}

                <Field label="Observações (opcional)">
                  <StyledTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações extras..." />
                </Field>
              </>
            )}
          </>
        )}

        {/* Transferência entre contas */}
        {type === 'transfer' && (
          <>
            <Field label="Valor" error={errors.amount}>
              <CurrencyInput value={amount} onChange={v => { setAmount(v); setErrors(p => ({ ...p, amount: '' })) }} />
            </Field>
            <Field label="Conta de origem" error={errors.account}>
              <PickerButton
                label={selectedAccount ? `🏦 ${selectedAccount.name}` : undefined}
                placeholder="Selecione a conta de origem..."
                onOpen={() => setPicker('account')}
              />
            </Field>
            <Field label="Conta de destino" error={errors.to_account}>
              <PickerButton
                label={selectedToAccount ? `🏦 ${selectedToAccount.name}` : undefined}
                placeholder="Selecione a conta de destino..."
                onOpen={() => setPicker('to_account')}
              />
            </Field>
            <Field label="Data" error={errors.date}>
              <PickerButton label={formatDateDisplay(date)} placeholder="Data..." onOpen={() => setPicker('date')} />
            </Field>
            <Field label="Descrição (opcional)">
              <StyledInput value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: TED para reserva..." enterKeyHint="done" />
            </Field>
            <Field label="Observações (opcional)">
              <StyledTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações extras..." />
            </Field>
          </>
        )}

        {/* Gasto / Receita */}
        {type !== 'debt_payment' && type !== 'transfer' && (
          <>
            <Field label="Valor" error={errors.amount}>
              <CurrencyInput value={amount} onChange={v => { setAmount(v); setErrors(p => ({ ...p, amount: '' })) }} />
            </Field>

            <Field label="Descrição" error={errors.description}>
              <StyledInput
                value={description}
                onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })) }}
                placeholder="Ex: Mercado, Netflix, Salário..."
                enterKeyHint="next"
              />
            </Field>

            <Field label="Categoria" error={errors.category}>
              <PickerButton
                label={selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : undefined}
                placeholder="Selecione a categoria..."
                onOpen={() => setPicker('category')}
              />
            </Field>

            <Field label="Data" error={errors.date}>
              <PickerButton label={formatDateDisplay(date)} placeholder="Selecione a data..." onOpen={() => setPicker('date')} />
            </Field>

            {type === 'expense' && (
              <>
                {cards.length > 0 && (
                  <Field label="Cartão de crédito (opcional)">
                    <PickerButton
                      label={selectedCard ? `💳 ${selectedCard.name}` : undefined}
                      placeholder="Nenhum (débito / dinheiro)"
                      onOpen={() => setPicker('card')}
                    />
                    {selectedCard && (
                      <button type="button" onClick={() => setCardId(null)} style={{ marginTop: 6, fontSize: 12, color: '#FF6B9D', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                        × Remover cartão
                      </button>
                    )}
                  </Field>
                )}

                {accounts.length > 0 && (
                  <Field label="Conta (opcional)">
                    <PickerButton
                      label={selectedAccount ? `🏦 ${selectedAccount.name}` : undefined}
                      placeholder="Selecione a conta..."
                      onOpen={() => setPicker('account')}
                    />
                    {selectedAccount && (
                      <button type="button" onClick={() => setAccountId(null)} style={{ marginTop: 6, fontSize: 12, color: '#FF6B9D', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                        × Remover conta
                      </button>
                    )}
                  </Field>
                )}

                {/* Parcelamento */}
                <div style={{ background: 'rgba(255,107,157,0.06)', border: '1px solid #FFE8F1', borderRadius: 14, padding: 14, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#3d1a2e', margin: 0 }}>Compra parcelada?</p>
                      <p style={{ fontSize: 12, color: '#8B6B7A', margin: '2px 0 0' }}>Divide em parcelas mensais</p>
                    </div>
                    <button type="button"
                      onClick={() => { setIsInstallment(p => !p); setInstallmentTotal(null) }}
                      style={{
                        width: 48, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer',
                        background: isInstallment ? '#FF6B9D' : '#e0e0e0',
                        position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
                        background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        transition: 'left 0.2s ease', left: isInstallment ? 23 : 3,
                      }} />
                    </button>
                  </div>
                  {isInstallment && (
                    <div style={{ marginTop: 14 }}>
                      <Field label="Número de parcelas" error={errors.installments}>
                        <PickerButton
                          label={installmentTotal ? `${installmentTotal}x` : undefined}
                          placeholder="Quantas parcelas?"
                          onOpen={() => setPicker('installments')}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </>
            )}

            {type === 'income' && accounts.length > 0 && (
              <Field label="Conta de destino (opcional)">
                <PickerButton
                  label={selectedAccount ? `🏦 ${selectedAccount.name}` : undefined}
                  placeholder="Selecione a conta..."
                  onOpen={() => setPicker('account')}
                />
                {selectedAccount && (
                  <button type="button" onClick={() => setAccountId(null)} style={{ marginTop: 6, fontSize: 12, color: '#FF6B9D', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                    × Remover conta
                  </button>
                )}
              </Field>
            )}

            {/* Toggle pago / não pago — só para gastos */}
            {type === 'expense' && (
              <div style={{ background: 'rgba(255,107,157,0.06)', border: '1px solid #FFE8F1', borderRadius: 14, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#3d1a2e', margin: 0 }}>Já foi pago?</p>
                    <p style={{ fontSize: 12, color: '#8B6B7A', margin: '2px 0 0' }}>
                      {isPaid ? 'Pago — saiu da conta' : 'Pendente — ainda vou pagar'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsPaid(p => !p); setPaidAt('') }}
                    style={{
                      width: 48, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer',
                      background: isPaid ? '#4CAF82' : '#e0e0e0',
                      position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
                      background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s ease', left: isPaid ? 23 : 3,
                    }} />
                  </button>
                </div>
                {isPaid && (
                  <div style={{ marginTop: 14 }}>
                    <Field label="Data do pagamento">
                      <PickerButton
                        label={paidAt ? formatDateDisplay(paidAt) : undefined}
                        placeholder={`Hoje (${formatDateDisplay(date)})`}
                        onOpen={() => setPicker('paid_at')}
                      />
                    </Field>
                  </div>
                )}
              </div>
            )}

            {/* Recorrência — só para não-parcelado */}
            {!isInstallment && (
              <div style={{ background: 'rgba(255,107,157,0.06)', border: '1px solid #FFE8F1', borderRadius: 14, padding: 14, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#3d1a2e', margin: 0 }}>Lançamento recorrente?</p>
                    <p style={{ fontSize: 12, color: '#8B6B7A', margin: '2px 0 0' }}>Repete automaticamente todo mês</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRecurring(p => !p)}
                    style={{
                      width: 48, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer',
                      background: isRecurring ? '#FF6B9D' : '#e0e0e0',
                      position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
                      background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      transition: 'left 0.2s ease', left: isRecurring ? 23 : 3,
                    }} />
                  </button>
                </div>
                {isRecurring && (
                  <div style={{ marginTop: 14 }}>
                    <Field label="Frequência">
                      <PickerButton
                        label={RECURRENCE_OPTIONS.find(o => o.value === recurrenceFrequency)?.label}
                        placeholder="Selecione..."
                        onOpen={() => setPicker('recurrence')}
                      />
                    </Field>
                  </div>
                )}
              </div>
            )}

            <Field label="Observações (opcional)">
              <StyledTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anotações extras..." />
            </Field>
          </>
        )}

        {(type !== 'debt_payment' || debts.length > 0) && (
          <button type="button" onClick={handleSubmit} disabled={loading} style={{
            width: '100%', height: 52, borderRadius: 50,
            background: loading ? '#FFB3D1' : activeType.color,
            color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 16, fontWeight: 700, marginTop: 8,
            transition: 'background 0.2s ease',
          }}>
            {loading ? 'Salvando...' : type === 'debt_payment' ? 'Registrar pagamento 💳' : type === 'transfer' ? 'Confirmar transferência ↔️' : 'Salvar lançamento 🎀'}
          </button>
        )}
      </div>

      {/* ── Pickers ── */}
      {picker === 'category' && (
        <PickerOverlay title="Categoria" onClose={() => setPicker(null)}>
          {filteredCategories.map(c => (
            <PickerItem key={c.id}
              label={<><span style={{ fontSize: 20, marginRight: 10 }}>{c.icon}</span>{c.name}</>}
              selected={categoryId === c.id}
              onClick={() => { setCategoryId(c.id); setErrors(p => ({ ...p, category: '' })); setPicker(null) }}
            />
          ))}
        </PickerOverlay>
      )}

      {picker === 'account' && (
        <PickerOverlay title="Conta" onClose={() => setPicker(null)}>
          {accounts.map(a => (
            <PickerItem key={a.id}
              label={<><span style={{ fontSize: 20, marginRight: 10 }}>🏦</span>{a.name}</>}
              selected={accountId === a.id}
              onClick={() => { setAccountId(a.id); setErrors(p => ({ ...p, account: '' })); setPicker(null) }}
            />
          ))}
        </PickerOverlay>
      )}

      {picker === 'to_account' && (
        <PickerOverlay title="Conta de destino" onClose={() => setPicker(null)}>
          {accounts.filter(a => a.id !== accountId).map(a => (
            <PickerItem key={a.id}
              label={<><span style={{ fontSize: 20, marginRight: 10 }}>🏦</span>{a.name}</>}
              selected={toAccountId === a.id}
              onClick={() => { setToAccountId(a.id); setErrors(p => ({ ...p, to_account: '' })); setPicker(null) }}
            />
          ))}
        </PickerOverlay>
      )}

      {picker === 'card' && (
        <PickerOverlay title="Cartão de crédito" onClose={() => setPicker(null)}>
          {cards.map(c => (
            <PickerItem key={c.id}
              label={<><span style={{ fontSize: 20, marginRight: 10 }}>💳</span>{c.name}</>}
              selected={cardId === c.id}
              onClick={() => { setCardId(c.id); setPicker(null) }}
            />
          ))}
        </PickerOverlay>
      )}

      {picker === 'debt' && (
        <PickerOverlay title="Selecione a dívida" onClose={() => setPicker(null)}>
          {debts.map(d => {
            const remaining = d.total_amount - d.paid_amount
            return (
              <PickerItem key={d.id}
                label={
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>{d.name}</span>
                    <span style={{ fontSize: 12, color: '#8B6B7A' }}>
                      {d.creditor} · Falta {formatCurrency(remaining)}
                    </span>
                  </div>
                }
                selected={debtId === d.id}
                onClick={() => { setDebtId(d.id); setErrors(p => ({ ...p, debt: '' })); setPicker(null) }}
              />
            )
          })}
        </PickerOverlay>
      )}

      {picker === 'installments' && (
        <PickerOverlay title="Número de parcelas" onClose={() => setPicker(null)}>
          {Array.from({ length: 23 }, (_, i) => i + 2).map(n => (
            <PickerItem key={n} label={`${n}x`} selected={installmentTotal === n}
              onClick={() => { setInstallmentTotal(n); setErrors(p => ({ ...p, installments: '' })); setPicker(null) }} />
          ))}
        </PickerOverlay>
      )}

      {picker === 'date' && (
        <PickerOverlay title="Data" onClose={() => setPicker(null)}>
          <div style={{ padding: 20 }}>
            <input type="date" value={date}
              onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: '' })); setPicker(null) }}
              style={{
                width: '100%', height: 46, padding: '0 14px',
                border: '1px solid #d9d9d9', borderRadius: 8,
                fontSize: 15, fontWeight: 600, color: '#3d1a2e',
                background: 'white', outline: 'none', WebkitAppearance: 'none',
              }}
            />
          </div>
        </PickerOverlay>
      )}

      {picker === 'recurrence' && (
        <PickerOverlay title="Frequência de repetição" onClose={() => setPicker(null)}>
          {RECURRENCE_OPTIONS.map(o => (
            <PickerItem key={o.value} label={o.label} selected={recurrenceFrequency === o.value}
              onClick={() => { setRecurrenceFrequency(o.value); setPicker(null) }} />
          ))}
        </PickerOverlay>
      )}

      {picker === 'paid_at' && (
        <PickerOverlay title="Data do pagamento" onClose={() => setPicker(null)}>
          <div style={{ padding: 20 }}>
            <input type="date" defaultValue={paidAt || todayISO()}
              onChange={e => { setPaidAt(e.target.value); setPicker(null) }}
              style={{
                width: '100%', height: 46, padding: '0 14px',
                border: '1px solid #d9d9d9', borderRadius: 8,
                fontSize: 15, fontWeight: 600, color: '#3d1a2e',
                background: 'white', outline: 'none', WebkitAppearance: 'none',
              }}
            />
          </div>
        </PickerOverlay>
      )}
    </div>
  )
}
