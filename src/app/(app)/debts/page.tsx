'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Drawer, Form, App } from 'antd'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import { useTheme } from '@/lib/theme-context'
import type { Debt } from '@/types'

const COLORS = ['#FF6B6B', '#FF6B9D', '#FF9EC4', '#F39C12', '#9B59B6', '#3498DB', '#2ECC71', '#E74C3C']

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
  enterKeyHint?: 'next' | 'done'
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

// ── Picker trigger ────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDateDisplay(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const INSTALLMENT_OPTIONS = Array.from({ length: 95 }, (_, i) => i + 2)

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Debt | null>(null)
  const [picker, setPicker] = useState<'installments' | 'due_date' | null>(null)
  const [form] = Form.useForm()
  const { message, modal } = App.useApp()
  const { theme } = useTheme()

  // form state
  const [name, setName] = useState('')
  const [creditor, setCreditor] = useState('')
  const [totalAmount, setTotalAmount] = useState(0)
  const [installmentTotal, setInstallmentTotal] = useState<number | null>(null)
  const [installmentAmount, setInstallmentAmount] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [color, setColor] = useState('#FF6B6B')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('status')
      .order('created_at', { ascending: false })
    setDebts(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setName(''); setCreditor(''); setTotalAmount(0)
    setInstallmentTotal(null); setInstallmentAmount(0)
    setDueDate(''); setColor('#FF6B6B'); setNotes('')
    setErrors({})
  }

  function openNew() {
    setEditing(null)
    resetForm()
    setDrawerOpen(true)
  }

  function openEdit(debt: Debt) {
    setEditing(debt)
    setName(debt.name)
    setCreditor(debt.creditor)
    setTotalAmount(debt.total_amount)
    setInstallmentTotal(debt.installment_total ?? null)
    setInstallmentAmount(debt.installment_amount ?? 0)
    setDueDate(debt.due_date ?? '')
    setColor(debt.color)
    setNotes(debt.notes ?? '')
    setErrors({})
    setDrawerOpen(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Informe o nome da dívida'
    if (!creditor.trim()) e.creditor = 'Informe o credor'
    if (!totalAmount || totalAmount <= 0) e.totalAmount = 'Informe o valor total'
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
        creditor: creditor.trim(),
        total_amount: totalAmount,
        installment_total: installmentTotal ?? null,
        installment_amount: installmentTotal ? (installmentAmount || null) : null,
        due_date: dueDate || null,
        color,
        notes: notes.trim() || null,
      }

      if (editing) {
        // recalcula status ao editar
        const newStatus = editing.paid_amount >= totalAmount ? 'paid' : 'active'
        const { error } = await supabase.from('debts').update({ ...payload, status: newStatus }).eq('id', editing.id).eq('user_id', user.id)
        if (error) throw error
        message.success(`Dívida atualizada!${theme.hasBow ? ' 🎀' : ''}`)
      } else {
        const { error } = await supabase.from('debts').insert({ ...payload, user_id: user.id, paid_amount: 0, status: 'active' })
        if (error) throw error
        message.success(`Dívida cadastrada!${theme.hasBow ? ' 🎀' : ''}`)
      }
      setDrawerOpen(false)
      load()
    } catch {
      message.error('Erro ao salvar dívida')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(debt: Debt) {
    modal.confirm({
      title: 'Excluir dívida?',
      content: `"${debt.name}" e todos os pagamentos vinculados serão removidos.`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { error } = await supabase.from('debts').delete().eq('id', debt.id).eq('user_id', user.id)
        if (error) { message.error('Erro ao excluir'); return }
        message.success('Dívida excluída')
        load()
      },
    })
  }

  const activeDebts = debts.filter(d => d.status === 'active')
  const paidDebts = debts.filter(d => d.status === 'paid')
  const totalDebt = activeDebts.reduce((s, d) => s + (d.total_amount - d.paid_amount), 0)

  return (
    <div className="page-enter">
      <PageHeader
        title="Dívidas"
        subtitle={activeDebts.length > 0 ? `Faltam ${formatCurrency(totalDebt)}` : `Tudo em dia!${theme.hasBow ? ' 🎀' : ''}`}
        rightAction={
          <Button type="primary" shape="round" icon={<Plus size={16} />} onClick={openNew} size="middle">
            Nova
          </Button>
        }
      />

      <div className="px-4 py-2 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #FFE8F1', borderRadius: 14, overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 4 }} />
              <div style={{ padding: 16 }}>
                <div className="skeleton h-3.5 rounded-full mb-2" style={{ width: '55%' }} />
                <div className="skeleton h-2.5 rounded-full mb-4" style={{ width: '35%' }} />
                <div className="skeleton h-2 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          ))
        ) : debts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-3">{theme.hasBow ? '🎀' : '💸'}</span>
            <p className="font-semibold text-sm mb-1" style={{ color: 'var(--on-bg)' }}>Nenhuma dívida cadastrada</p>
            <p className="text-xs mb-4 text-center" style={{ color: 'var(--on-bg-sub)' }}>Registre suas dívidas para acompanhar o progresso</p>
            <Button type="primary" shape="round" onClick={openNew} icon={<Plus size={14} />}>
              Cadastrar dívida
            </Button>
          </div>
        ) : (
          <>
            {activeDebts.map(debt => <DebtCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={handleDelete} />)}

            {paidDebts.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-bg-sub)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 8, marginBottom: 0 }}>
                  Quitadas
                </p>
                {paidDebts.map(debt => <DebtCard key={debt.id} debt={debt} onEdit={openEdit} onDelete={handleDelete} />)}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Drawer ── */}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Drawer
          title={editing ? 'Editar dívida' : 'Nova dívida'}
          placement="bottom"
          height="auto"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{
            content: { borderRadius: '24px 24px 0 0' },
            header: { borderRadius: '24px 24px 0 0', borderBottom: '1px solid #FFE8F1', padding: '16px 20px' },
            body: { padding: '16px 20px', overflowY: 'auto', maxHeight: '85dvh', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' },
          }}
          extra={
            <Button type="primary" shape="round" onClick={handleSave} loading={saving}>
              Salvar
            </Button>
          }
        >
          {/* Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 12, background: '#FFF5F7', border: '1px solid #FFE8F1', borderRadius: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              💸
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: name ? '#3d1a2e' : '#C4A0B0', margin: 0 }}>
                {name || 'Nome da dívida'}
              </p>
              <p style={{ fontSize: 12, color: '#8B6B7A', margin: '2px 0 0' }}>
                {creditor || 'Credor'} · {totalAmount > 0 ? formatCurrency(totalAmount) : 'R$ 0,00'}
              </p>
            </div>
          </div>

          <Field label="Nome da dívida" error={errors.name}>
            <StyledInput value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }} placeholder="Ex: Empréstimo Banco X, Dívida João..." enterKeyHint="next" />
          </Field>

          <Field label="Credor" error={errors.creditor}>
            <StyledInput value={creditor} onChange={e => { setCreditor(e.target.value); setErrors(p => ({ ...p, creditor: '' })) }} placeholder="Ex: Itaú, João Silva..." enterKeyHint="next" />
          </Field>

          <Field label="Valor total da dívida" error={errors.totalAmount}>
            <CurrencyInput value={totalAmount} onChange={v => { setTotalAmount(v); setErrors(p => ({ ...p, totalAmount: '' })) }} />
          </Field>

          {/* Renegociação / parcelamento */}
          <div style={{ background: 'rgba(255,107,157,0.06)', border: '1px solid #FFE8F1', borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#3d1a2e', margin: 0 }}>Renegociação parcelada?</p>
                <p style={{ fontSize: 12, color: '#8B6B7A', margin: '2px 0 0' }}>Defina em quantas vezes vai pagar</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (installmentTotal) { setInstallmentTotal(null); setInstallmentAmount(0) }
                  else setPicker('installments')
                }}
                style={{
                  width: 48, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: installmentTotal ? '#FF6B9D' : '#e0e0e0',
                  position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, width: 22, height: 22, borderRadius: '50%',
                  background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s ease', left: installmentTotal ? 23 : 3,
                }} />
              </button>
            </div>

            {installmentTotal && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field label="Número de parcelas">
                  <PickerButton
                    label={`${installmentTotal}x`}
                    placeholder="Quantas parcelas?"
                    onOpen={() => setPicker('installments')}
                  />
                </Field>
                <Field label="Valor de cada parcela">
                  <CurrencyInput value={installmentAmount} onChange={setInstallmentAmount} />
                </Field>
              </div>
            )}
          </div>

          <Field label="Data de vencimento (opcional)">
            <PickerButton
              label={dueDate ? formatDateDisplay(dueDate) : undefined}
              placeholder="Selecione a data..."
              onOpen={() => setPicker('due_date')}
            />
            {dueDate && (
              <button type="button" onClick={() => setDueDate('')} style={{ marginTop: 6, fontSize: 12, color: '#FF6B9D', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600 }}>
                × Remover data
              </button>
            )}
          </Field>

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 8 }}>Cor</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '4px 0' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} style={{
                  width: 36, height: 36, borderRadius: '50%', background: c, flexShrink: 0, cursor: 'pointer',
                  border: `3px solid ${color === c ? '#3d1a2e' : 'transparent'}`,
                  outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: 2,
                  transform: color === c ? 'scale(1.18)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: `0 2px 6px ${c}60`,
                }} />
              ))}
            </div>
          </div>

          {editing && (
            <button type="button" onClick={() => handleDelete(editing)} style={{
              width: '100%', height: 44, borderRadius: 10,
              background: '#FFF0F0', border: '1px solid #FFCCCC',
              color: '#E74C3C', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Trash2 size={15} /> Excluir dívida
            </button>
          )}
        </Drawer>
      </Form>

      {/* ── Pickers ── */}
      {picker === 'installments' && (
        <PickerOverlay title="Número de parcelas" onClose={() => setPicker(null)}>
          {INSTALLMENT_OPTIONS.map(n => (
            <PickerItem key={n} label={`${n}x`} selected={installmentTotal === n}
              onClick={() => { setInstallmentTotal(n); setPicker(null) }} />
          ))}
        </PickerOverlay>
      )}

      {picker === 'due_date' && (
        <PickerOverlay title="Data de vencimento" onClose={() => setPicker(null)}>
          <div style={{ padding: 20 }}>
            <input type="date" defaultValue={dueDate || todayISO()}
              onChange={e => { setDueDate(e.target.value); setPicker(null) }}
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

// ── Debt card component ───────────────────────────────────────────────────────
function DebtCard({ debt, onEdit, onDelete }: { debt: Debt; onEdit: (d: Debt) => void; onDelete: (d: Debt) => void }) {
  const remaining = debt.total_amount - debt.paid_amount
  const pct = Math.min((debt.paid_amount / debt.total_amount) * 100, 100)
  const isPaid = debt.status === 'paid'

  const installmentsPaid = debt.installment_amount && debt.installment_amount > 0
    ? Math.floor(debt.paid_amount / debt.installment_amount)
    : null

  return (
    <div className="hk-card-hover" style={{ background: 'white', border: '1px solid #FFE8F1', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${debt.color}, ${debt.color}55)` }} />
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: debt.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {isPaid ? '✅' : '💸'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#3d1a2e', margin: 0 }}>{debt.name}</p>
              <div style={{ display: 'flex', gap: 2 }}>
                <button onClick={() => onEdit(debt)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
                  <Pencil size={15} style={{ color: '#C4A0B0' }} />
                </button>
                <button onClick={() => onDelete(debt)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
                  <Trash2 size={15} style={{ color: '#FFAAAA' }} />
                </button>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#8B6B7A', margin: '2px 0 0' }}>
              {debt.creditor}
              {debt.due_date && ` · Vence ${formatDateDisplay(debt.due_date)}`}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#C4A0B0', letterSpacing: 0.8, textTransform: 'uppercase' }}>
              {isPaid ? 'Quitada' : 'Progresso'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: debt.color }}>
              {pct.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 99, background: '#FFE8F1', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${pct}%`,
              background: isPaid ? '#4CAF82' : debt.color,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <div>
              <p style={{ fontSize: 11, color: '#8B6B7A', margin: 0 }}>Pago</p>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#4CAF82', margin: 0 }}>{formatCurrency(debt.paid_amount)}</p>
            </div>
            {!isPaid && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: '#8B6B7A', margin: 0 }}>Restante</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#FF6B6B', margin: 0 }}>{formatCurrency(remaining)}</p>
              </div>
            )}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: '#8B6B7A', margin: 0 }}>Total</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#3d1a2e', margin: 0 }}>{formatCurrency(debt.total_amount)}</p>
            </div>
          </div>

          {/* Parcelas */}
          {debt.installment_total && installmentsPaid !== null && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#FFF5F7', borderRadius: 8, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#8B6B7A', fontWeight: 600 }}>
                📅 {installmentsPaid}/{debt.installment_total} parcelas
                {debt.installment_amount ? ` · ${formatCurrency(debt.installment_amount)}/mês` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
