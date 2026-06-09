'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { App } from 'antd'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Category, Account, Card, RecurrenceFrequency, Transaction } from '@/types'

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

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 6 }}>{label}</p>
      {children}
      {error && <p style={{ fontSize: 12, color: '#FF6B6B', marginTop: 4 }}>{error}</p>}
    </div>
  )
}

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

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateDisplay(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'weekly',    label: 'Semanal' },
  { value: 'biweekly',  label: 'Quinzenal' },
  { value: 'monthly',   label: 'Mensal' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly',    label: 'Anual' },
]

export default function EditTransactionPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { message } = App.useApp()

  const [original, setOriginal] = useState<Transaction | null>(null)
  const [amount, setAmount] = useState(0)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(todayISO())
  const [notes, setNotes] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [cardId, setCardId] = useState<string | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [paidAt, setPaidAt] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>('monthly')

  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [picker, setPicker] = useState<'category' | 'account' | 'card' | 'date' | 'paid_at' | 'recurrence' | null>(null)

  useEffect(() => { init() }, [id])

  async function init() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [txRes, catRes, accRes, cardRes] = await Promise.all([
      supabase.from('transactions').select('*, category:categories(*), account:accounts(name), card:cards(name)').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('categories').select('*').or(`is_default.eq.true,user_id.eq.${user.id}`).order('name'),
      supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('cards').select('*').eq('user_id', user.id).eq('is_active', true),
    ])

    if (!txRes.data) { message.error('Lançamento não encontrado'); router.back(); return }

    const tx = txRes.data as Transaction
    setOriginal(tx)
    setAmount(tx.amount)
    setDescription(tx.description)
    setDate(tx.date)
    setNotes(tx.notes ?? '')
    setCategoryId(tx.category_id)
    setAccountId(tx.account_id ?? null)
    setCardId(tx.card_id ?? null)
    setIsPaid(tx.is_paid)
    setPaidAt(tx.paid_at ?? '')
    setIsRecurring(tx.is_recurring)
    setRecurrenceFrequency(tx.recurrence_frequency ?? 'monthly')
    setCategories(catRes.data ?? [])
    setAccounts(accRes.data ?? [])
    setCards(cardRes.data ?? [])
    setInitializing(false)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!amount || amount <= 0) e.amount = 'Informe um valor maior que zero'
    if (!description.trim()) e.description = 'Informe a descrição'
    if (!categoryId) e.category = 'Selecione uma categoria'
    if (!date) e.date = 'Informe a data'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      const supabase = createClient()
      const resolvedIsPaid = original?.type === 'income' ? true : isPaid
      const { error } = await supabase
        .from('transactions')
        .update({
          amount,
          description: description.trim(),
          date,
          category_id: categoryId,
          account_id: accountId ?? null,
          card_id: cardId ?? null,
          notes: notes.trim() || null,
          is_paid: resolvedIsPaid,
          paid_at: resolvedIsPaid ? (paidAt || date) : null,
          is_recurring: isRecurring,
          recurrence_frequency: isRecurring ? recurrenceFrequency : null,
        })
        .eq('id', id)
      if (error) throw error
      message.success('Lançamento atualizado 🎀')
      router.push('/transactions')
    } catch {
      message.error('Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(c => {
    if (original?.type === 'income') return c.type === 'income' || c.type === 'both'
    return c.type === 'expense' || c.type === 'both'
  })
  const selectedCategory = categories.find(c => c.id === categoryId)
  const selectedAccount = accounts.find(a => a.id === accountId)
  const selectedCard = cards.find(c => c.id === cardId)

  if (initializing) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFF5F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 32 }}>🎀</span>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFF5F8' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 12px' }}>
        <button type="button" onClick={() => router.back()} style={{
          width: 40, height: 40, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,107,157,0.08)', border: 'none', cursor: 'pointer', flexShrink: 0,
        }}>
          <ChevronLeft size={20} style={{ color: '#FF6B9D' }} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#3d1a2e', margin: 0 }}>Editar lançamento</h1>
      </div>

      {/* Form */}
      <div style={{ padding: '0 16px', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 32px)' }}>

        {/* Tipo não editável — badge informativo */}
        {original?.type === 'debt_payment' && (
          <div style={{ background: 'rgba(155,89,182,0.06)', border: '1px solid rgba(155,89,182,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>💳</span>
            <span style={{ fontSize: 13, color: '#9B59B6', fontWeight: 600 }}>Pagamento de dívida</span>
          </div>
        )}
        {original?.type === 'transfer' && (
          <div style={{ background: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>↔️</span>
            <span style={{ fontSize: 13, color: '#3498DB', fontWeight: 600 }}>Transferência entre contas</span>
          </div>
        )}

        <Field label="Valor" error={errors.amount}>
          <CurrencyInput value={amount} onChange={v => { setAmount(v); setErrors(p => ({ ...p, amount: '' })) }} />
        </Field>

        {original?.type !== 'debt_payment' && original?.type !== 'transfer' && (
          <Field label="Descrição" error={errors.description}>
            <StyledInput
              value={description}
              onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })) }}
              placeholder="Ex: Mercado, Netflix, Salário..."
              enterKeyHint="next"
            />
          </Field>
        )}

        {original?.type !== 'debt_payment' && original?.type !== 'transfer' && (
          <Field label="Categoria" error={errors.category}>
            <PickerButton
              label={selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : undefined}
              placeholder="Selecione a categoria..."
              onOpen={() => setPicker('category')}
            />
          </Field>
        )}

        <Field label="Data" error={errors.date}>
          <PickerButton label={formatDateDisplay(date)} placeholder="Selecione a data..." onOpen={() => setPicker('date')} />
        </Field>

        {original?.type === 'expense' && cards.length > 0 && (
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
          <Field label={original?.type === 'income' ? 'Conta de destino (opcional)' : 'Conta (opcional)'}>
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

        {/* Toggle pago — só para gastos */}
        {original?.type === 'expense' && (
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

        {/* Recorrência — só para expense/income não parcelado */}
        {!original?.is_installment && original?.type !== 'debt_payment' && original?.type !== 'transfer' && (
          <div style={{ background: 'rgba(255,107,157,0.06)', border: '1px solid #FFE8F1', borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#3d1a2e', margin: 0 }}>Lançamento recorrente?</p>
                <p style={{ fontSize: 12, color: '#8B6B7A', margin: '2px 0 0' }}>Repete automaticamente</p>
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

        <button type="button" onClick={handleSubmit} disabled={loading} style={{
          width: '100%', height: 52, borderRadius: 50,
          background: loading ? '#FFB3D1' : '#FF6B9D',
          color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 16, fontWeight: 700, marginTop: 8,
          transition: 'background 0.2s ease',
        }}>
          {loading ? 'Salvando...' : 'Salvar alterações 🎀'}
        </button>
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
              onClick={() => { setAccountId(a.id); setPicker(null) }}
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
