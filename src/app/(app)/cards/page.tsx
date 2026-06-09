'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Drawer, App, Skeleton } from 'antd'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getCardBrandLabel } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import { useTheme } from '@/lib/theme-context'
import type { Card } from '@/types'

const COLORS = ['#FF6B9D', '#6C63FF', '#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#1ABC9C', '#9B59B6']
const CARD_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const BRANDS = ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other']

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

function StyledInput({ value, onChange, placeholder, maxLength, inputMode }: {
  value?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  maxLength?: number
  inputMode?: 'text' | 'numeric'
}) {
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
  }
  return (
    <input
      type="text" inputMode={inputMode ?? 'text'} value={value ?? ''} onChange={onChange}
      placeholder={placeholder} maxLength={maxLength} onFocus={handleFocus}
      style={{
        width: '100%', height: 46, padding: '0 14px',
        border: '1px solid #d9d9d9', borderRadius: 8,
        fontSize: 15, fontWeight: 600, color: '#3d1a2e',
        background: 'white', outline: 'none', caretColor: '#FF6B9D',
        transition: 'border-color 0.2s', WebkitAppearance: 'none',
      }}
    />
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
      <ChevronRight size={16} style={{ color: '#C4A0B0' }} />
    </button>
  )
}

function PickerOverlay({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(61,26,46,0.55)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      zIndex: 3000, display: 'flex', alignItems: 'flex-end',
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

// ── Card chip visual ──────────────────────────────────────────────────────────
function CardChip() {
  return (
    <div style={{
      width: 38, height: 28, borderRadius: 6,
      background: 'linear-gradient(135deg, #F5E642 0%, #E8A020 50%, #F5D742 100%)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
        gap: 3, padding: 6,
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.18)', borderRadius: 2 }} />
        ))}
      </div>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)',
        height: 1, background: 'rgba(0,0,0,0.12)',
      }} />
    </div>
  )
}

// ── Brand badge ───────────────────────────────────────────────────────────────
function BrandBadge({ brand }: { brand: string }) {
  const map: Record<string, { text: string; style?: React.CSSProperties }> = {
    visa:       { text: 'VISA',   style: { letterSpacing: 2, fontStyle: 'italic', fontWeight: 900 } },
    mastercard: { text: 'MC',     style: { letterSpacing: 1 } },
    elo:        { text: 'elo',    style: { fontStyle: 'italic' } },
    amex:       { text: 'AMEX',   style: { letterSpacing: 1 } },
    hipercard:  { text: 'HIPER',  style: {} },
    other:      { text: '•••',    style: {} },
  }
  const b = map[brand] ?? map.other
  return (
    <div style={{
      background: 'rgba(255,255,255,0.22)',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      borderRadius: 8, padding: '4px 10px',
      fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.95)',
      border: '1px solid rgba(255,255,255,0.3)',
      ...b.style,
    }}>
      {b.text}
    </div>
  )
}

// ── Card visual component ─────────────────────────────────────────────────────
function CardVisual({ card, onEdit, onDelete, emoji }: {
  card: Card
  onEdit: () => void
  onDelete: () => void
  emoji: string
}) {
  const color = card.color || '#FF6B9D'
  const used = card.limit_amount > 0 ? (card.current_balance / card.limit_amount) * 100 : 0

  return (
    <div className="hk-card-hover" style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
      {/* Card face */}
      <div style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}BB 100%)`,
        minHeight: 168, position: 'relative', overflow: 'hidden', padding: '18px 18px 16px',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', right: -50, top: -50, width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.10)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: -80, bottom: -30, width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }} />
        {/* Shine */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 55%)',
        }} />
        {/* Watermark emoji */}
        <div style={{
          position: 'absolute', bottom: -8, right: -4,
          fontSize: 80, opacity: 0.10, pointerEvents: 'none', lineHeight: 1,
        }}>{emoji}</div>

        {/* Row 1: chip + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <CardChip />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onEdit} style={{
              background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 10, padding: '7px 8px', cursor: 'pointer', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Pencil size={13} color="white" />
            </button>
            <button onClick={onDelete} style={{
              background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 10, padding: '7px 8px', cursor: 'pointer', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Trash2 size={13} color="white" />
            </button>
          </div>
        </div>

        {/* Card number */}
        {card.last_four_digits ? (
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, letterSpacing: 4, marginBottom: 10, fontFamily: 'monospace' }}>
            •••• •••• •••• {card.last_four_digits}
          </p>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, letterSpacing: 4, marginBottom: 10, fontFamily: 'monospace' }}>
            •••• •••• •••• ••••
          </p>
        )}

        {/* Row 3: name + brand */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, marginBottom: 2 }}>{card.bank_name}</p>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>{card.name}</p>
          </div>
          <BrandBadge brand={card.brand} />
        </div>
      </div>

      {/* Card info strip */}
      <div style={{ background: 'white', border: '1px solid #F0E0EA', borderTop: 'none', padding: '12px 16px 14px' }}>
        {/* Balance row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 11, color: '#C4A0B0', marginBottom: 2 }}>Fatura atual</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: used > 80 ? '#C0392B' : '#3d1a2e', lineHeight: 1 }}>
              {formatCurrency(card.current_balance)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: '#C4A0B0', marginBottom: 2 }}>Limite total</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#8B6B7A' }}>{formatCurrency(card.limit_amount)}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#C4A0B0', marginBottom: 4 }}>
            <span>Limite usado</span>
            <span style={{ fontWeight: 700, color: used > 80 ? '#C0392B' : used > 60 ? '#E67E22' : '#27AE60' }}>
              {used.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: '#F5E8F0', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${Math.min(used, 100)}%`,
              background: used > 80 ? 'linear-gradient(90deg, #FF6B6B, #C0392B)' : used > 60 ? 'linear-gradient(90deg, #FFD166, #E67E22)' : 'linear-gradient(90deg, #6EDDB0, #27AE60)',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Dates row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8B6B7A' }}>
          <span>🗓️ Fecha dia <strong>{card.closing_day}</strong></span>
          <span>💳 Vence dia <strong>{card.due_day}</strong></span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const [picker, setPicker] = useState<'brand' | 'closing' | 'due' | null>(null)
  const { message, modal } = App.useApp()
  const { theme } = useTheme()

  // form state
  const [name, setName] = useState('')
  const [bankName, setBankName] = useState('')
  const [brand, setBrand] = useState('visa')
  const [lastFour, setLastFour] = useState('')
  const [limitAmount, setLimitAmount] = useState(0)
  const [currentBalance, setCurrentBalance] = useState(0)
  const [closingDay, setClosingDay] = useState(1)
  const [dueDay, setDueDay] = useState(10)
  const [color, setColor] = useState('#FF6B9D')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('cards').select('*').eq('user_id', user.id).order('created_at')
    setCards(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setName(''); setBankName(''); setBrand('visa'); setLastFour('')
    setLimitAmount(0); setCurrentBalance(0); setClosingDay(1); setDueDay(10)
    setColor('#FF6B9D'); setErrors({})
  }

  function openNew() {
    setEditing(null)
    resetForm()
    setDrawerOpen(true)
  }

  function openEdit(card: Card) {
    setEditing(card)
    setName(card.name)
    setBankName(card.bank_name ?? '')
    setBrand(card.brand ?? 'visa')
    setLastFour(card.last_four_digits ?? '')
    setLimitAmount(card.limit_amount ?? 0)
    setCurrentBalance(card.current_balance ?? 0)
    setClosingDay(card.closing_day ?? 1)
    setDueDay(card.due_day ?? 10)
    setColor(card.color ?? '#FF6B9D')
    setErrors({})
    setDrawerOpen(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Informe o nome do cartão'
    if (!bankName.trim()) e.bankName = 'Informe o banco/emissor'
    if (!limitAmount || limitAmount <= 0) e.limitAmount = 'Informe o limite'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        name: name.trim(),
        bank_name: bankName.trim(),
        brand,
        last_four_digits: lastFour.trim() || null,
        limit_amount: limitAmount,
        current_balance: currentBalance,
        closing_day: closingDay,
        due_day: dueDay,
        color,
      }

      if (editing) {
        const { error } = await supabase.from('cards').update(payload).eq('id', editing.id).eq('user_id', user.id)
        if (error) throw error
        message.success(`Cartão atualizado!${theme.hasBow ? ' 🎀' : ''}`)
      } else {
        const { error } = await supabase.from('cards').insert({ ...payload, user_id: user.id })
        if (error) throw error
        message.success(`Cartão criado!${theme.hasBow ? ' 🎀' : ''}`)
      }

      setDrawerOpen(false)
      load()
    } catch {
      message.error('Erro ao salvar cartão')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(card: Card) {
    modal.confirm({
      title: 'Excluir cartão?',
      content: `Deseja excluir "${card.name}"?`,
      okText: 'Excluir', okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { error } = await supabase.from('cards').delete().eq('id', card.id).eq('user_id', user.id)
        if (error) { message.error('Erro ao excluir cartão'); return }
        message.success('Cartão excluído')
        load()
      },
    })
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Cartões"
        subtitle={`${cards.length} cartão${cards.length !== 1 ? 'ões' : ''} cadastrado${cards.length !== 1 ? 's' : ''}`}
        rightAction={
          <Button type="primary" shape="round" icon={<Plus size={16} />} onClick={openNew} size="middle">
            Novo
          </Button>
        }
      />

      <div className="px-4 py-2 flex flex-col gap-5">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #F0E0EA', minHeight: 180 }}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          ))
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-3">{theme.hasBow ? '🎀' : '💳'}</span>
            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--on-bg)' }}>Nenhum cartão ainda</p>
            <p className="text-xs mb-4 text-center" style={{ color: 'var(--on-bg-sub)' }}>Adicione seus cartões de crédito!</p>
            <Button type="primary" shape="round" onClick={openNew} icon={<Plus size={14} />}>
              Adicionar cartão
            </Button>
          </div>
        ) : (
          cards.map(card => (
            <CardVisual
              key={card.id}
              card={card}
              emoji={theme.emoji}
              onEdit={() => openEdit(card)}
              onDelete={() => handleDelete(card)}
            />
          ))
        )}
      </div>

      {/* Pickers */}
      {picker === 'brand' && (
        <PickerOverlay title="Bandeira do cartão" onClose={() => setPicker(null)}>
          {BRANDS.map(b => (
            <PickerItem key={b} label={getCardBrandLabel(b)} selected={brand === b}
              onClick={() => { setBrand(b); setPicker(null) }} />
          ))}
        </PickerOverlay>
      )}
      {picker === 'closing' && (
        <PickerOverlay title="Dia de fechamento" onClose={() => setPicker(null)}>
          {CARD_DAYS.map(d => (
            <PickerItem key={d} label={`Dia ${d}`} selected={closingDay === d}
              onClick={() => { setClosingDay(d); setPicker(null) }} />
          ))}
        </PickerOverlay>
      )}
      {picker === 'due' && (
        <PickerOverlay title="Dia de vencimento" onClose={() => setPicker(null)}>
          {CARD_DAYS.map(d => (
            <PickerItem key={d} label={`Dia ${d}`} selected={dueDay === d}
              onClick={() => { setDueDay(d); setPicker(null) }} />
          ))}
        </PickerOverlay>
      )}

      <Drawer
        title={editing ? 'Editar cartão' : 'Novo cartão'}
        placement="bottom"
        height="auto"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { paddingBottom: 'env(safe-area-inset-bottom, 16px)' } }}
        extra={
          <Button type="primary" shape="round" onClick={handleSave} loading={saving}>
            Salvar
          </Button>
        }
      >
        <Field label="Nome do cartão" error={errors.name}>
          <StyledInput value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank Roxinho..." />
        </Field>

        <Field label="Banco / Emissor" error={errors.bankName}>
          <StyledInput value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ex: Nubank, Itaú..." />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 6 }}>Bandeira</p>
            <PickerButton label={getCardBrandLabel(brand)} placeholder="Selecionar" onOpen={() => setPicker('brand')} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 6 }}>Últimos 4 dígitos</p>
            <StyledInput
              value={lastFour} onChange={e => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234" maxLength={4} inputMode="numeric"
            />
          </div>
        </div>

        <Field label="Limite do cartão" error={errors.limitAmount}>
          <CurrencyInput value={limitAmount} onChange={setLimitAmount} />
        </Field>

        <Field label="Fatura atual">
          <CurrencyInput value={currentBalance} onChange={setCurrentBalance} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 6 }}>Dia de fechamento</p>
            <PickerButton label={`Dia ${closingDay}`} placeholder="Selecionar" onOpen={() => setPicker('closing')} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 6 }}>Dia de vencimento</p>
            <PickerButton label={`Dia ${dueDay}`} placeholder="Selecionar" onOpen={() => setPicker('due')} />
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 10 }}>Cor do cartão</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {COLORS.map(c => (
              <button
                key={c} type="button"
                onClick={() => setColor(c)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: color === c ? '3px solid #3d1a2e' : '3px solid transparent',
                  boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : '0 2px 6px rgba(0,0,0,0.15)',
                  transition: 'all 0.15s ease',
                }}
              />
            ))}
          </div>
        </div>
      </Drawer>
    </div>
  )
}
