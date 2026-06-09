'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Drawer, Form, App } from 'antd'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getAccountTypeLabel } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import type { Account } from '@/types'
import { useRouter } from 'next/navigation'

const COLORS = ['#FF6B9D', '#FF9EC4', '#9B59B6', '#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#1ABC9C']

const TYPE_OPTIONS = [
  { value: 'checking',   label: 'Conta Corrente',      emoji: '🏦' },
  { value: 'savings',    label: 'Poupança',             emoji: '🐷' },
  { value: 'investment', label: 'Investimentos',        emoji: '📈' },
  { value: 'cash',       label: 'Dinheiro em espécie',  emoji: '💵' },
]

// ── ATM-style currency input ──────────────────────────────────────────────────
// Digits are extracted from whatever the user types; the formatted display always
// carries the same digit sequence so stripping non-digits gives ATM behavior on
// both desktop and mobile (no readOnly → keyboard appears normally on iOS/Android).
function CurrencyInput({ value, onChange }: { value?: number; onChange?: (v: number) => void }) {
  const [cents, setCents] = useState(() => Math.round((value ?? 0) * 100))

  useEffect(() => {
    setCents(Math.round((value ?? 0) * 100))
  }, [value])

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
        fontSize: 14, color: '#8B6B7A', fontWeight: 600, zIndex: 1,
        pointerEvents: 'none',
      }}>R$</span>
      <input
        type="text"
        inputMode="numeric"
        enterKeyHint="done"
        value={formatCents(cents)}
        onChange={handleChange}
        onFocus={scrollUp}
        style={{
          width: '100%',
          height: 46,
          paddingLeft: 38,
          paddingRight: 14,
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          color: '#3d1a2e',
          letterSpacing: 0.5,
          background: 'white',
          outline: 'none',
          caretColor: '#FF6B9D',
          cursor: 'text',
          transition: 'border-color 0.2s',
          WebkitAppearance: 'none',
        }}
      />
    </div>
  )
}

// ── Styled text input (same visual as CurrencyInput) ─────────────────────────
function StyledInput({ value, onChange, placeholder, enterKeyHint }: {
  value?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  enterKeyHint?: 'next' | 'done' | 'go' | 'search' | 'send' | 'previous'
}) {
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
  }
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      enterKeyHint={enterKeyHint}
      onFocus={handleFocus}
      style={{
        width: '100%', height: 46,
        padding: '0 14px',
        border: '1px solid #d9d9d9', borderRadius: 8,
        fontSize: 15, fontWeight: 600,
        color: '#3d1a2e', letterSpacing: 0.5,
        background: 'white', outline: 'none',
        caretColor: '#FF6B9D',
        transition: 'border-color 0.2s',
        WebkitAppearance: 'none',
      }}
    />
  )
}

// ── Type selector trigger ────────────────────────────────────────────────────
function TypeButton({ value, onOpen }: { value?: string; onOpen: () => void }) {
  const opt = TYPE_OPTIONS.find(o => o.value === value)
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        width: '100%', height: 46,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px',
        border: '1px solid #d9d9d9', borderRadius: 8,
        background: 'white', cursor: 'pointer',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {opt
          ? <><span style={{ fontSize: 20 }}>{opt.emoji}</span><span style={{ fontSize: 14, color: '#3d1a2e' }}>{opt.label}</span></>
          : <span style={{ fontSize: 14, color: '#bfbfbf' }}>Selecionar tipo...</span>
        }
      </span>
      <ChevronRight size={16} style={{ color: '#C4A0B0' }} />
    </button>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AccountsPage() {
  const [accounts, setAccounts]   = useState<Account[]>([])
  const [loading, setLoading]     = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]     = useState<Account | null>(null)
  const [typePicker, setTypePicker] = useState(false)
  const [form]                    = Form.useForm()
  const { message, modal }        = App.useApp()
  const router                    = useRouter()

  const colorValue = Form.useWatch('color', form)
  const [selectedType, setSelectedType] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at')
    setAccounts(data ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ color: '#FF6B9D', type: 'checking', balance: 0 })
    setSelectedType('checking')
    setDrawerOpen(true)
  }

  function openEdit(account: Account) {
    setEditing(account)
    form.setFieldsValue(account)
    setSelectedType(account.type)
    setDrawerOpen(true)
  }

  async function handleSave() {
    const values = await form.validateFields()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editing) {
      const { error } = await supabase.from('accounts').update(values).eq('id', editing.id).eq('user_id', user.id)
      if (error) { message.error('Erro ao atualizar'); return }
      message.success('Conta atualizada!')
    } else {
      const { error } = await supabase.from('accounts').insert({ ...values, user_id: user.id })
      if (error) { message.error('Erro ao criar conta'); return }
      message.success('Conta criada!')
    }
    setDrawerOpen(false)
    load()
  }

  async function handleDelete(account: Account) {
    modal.confirm({
      title: 'Excluir conta?',
      content: `Deseja excluir "${account.name}"? Esta ação não pode ser desfeita.`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { error } = await supabase.from('accounts').delete().eq('id', account.id).eq('user_id', user.id)
        if (error) { message.error('Erro ao excluir conta'); return }
        message.success('Conta excluída')
        load()
      },
    })
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <div className="page-enter">
      <PageHeader
        title="Contas"
        subtitle={`Total: ${formatCurrency(totalBalance)}`}
        rightAction={
          <Button type="primary" shape="round" icon={<Plus size={16} />} onClick={openNew} size="middle">
            Nova
          </Button>
        }
      />

      <div className="px-4 py-2 flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #FFE8F1' }}>
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-full" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="skeleton h-3.5 rounded-full" style={{ width: '55%' }} />
                  <div className="skeleton h-2.5 rounded-full" style={{ width: '40%' }} />
                </div>
                <div className="skeleton h-4 w-20 rounded-full" />
              </div>
            </div>
          ))
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-3">🏦</span>
            <p className="font-semibold text-sm mb-1" style={{ color: '#3d1a2e' }}>Nenhuma conta ainda</p>
            <p className="text-xs mb-4 text-center" style={{ color: '#8B6B7A' }}>Adicione sua primeira conta para começar!</p>
            <Button type="primary" shape="round" onClick={openNew} icon={<Plus size={14} />}>
              Adicionar conta
            </Button>
          </div>
        ) : (
          accounts.map(account => {
            const typeEmoji = TYPE_OPTIONS.find(t => t.value === account.type)?.emoji ?? '🏦'
            return (
              <div
                key={account.id}
                className="hk-card-hover"
                onClick={() => router.push(`/accounts/${account.id}`)}
                style={{ background: 'white', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}
              >
                {/* color accent bar */}
                <div style={{ height: 4, background: `linear-gradient(90deg, ${account.color}, ${account.color}55)` }} />

                <div style={{ padding: '14px 16px' }}>
                  {/* top row: emoji + name/bank + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                      background: account.color + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24,
                    }}>
                      {typeEmoji}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: '#3d1a2e', margin: 0, lineHeight: 1.3 }}>
                        {account.name}
                      </p>
                      <p style={{ fontSize: 12, color: '#8B6B7A', margin: 0, marginTop: 2 }}>
                        {account.bank_name} · {getAccountTypeLabel(account.type)}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 2 }}>
                      <button onClick={e => { e.stopPropagation(); openEdit(account) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
                        <Pencil size={15} style={{ color: 'var(--primary-light)' }} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(account) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8 }}>
                        <Trash2 size={15} style={{ color: '#FFAAAA' }} />
                      </button>
                    </div>
                  </div>

                  {/* balance row */}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#C4A0B0', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      Saldo
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 18, color: account.balance >= 0 ? '#4CAF82' : '#FF6B6B' }}>
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Form + Drawer ── */}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Drawer
          title={editing ? 'Editar conta' : 'Nova conta'}
          placement="bottom"
          height="auto"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{
            content: { borderRadius: '24px 24px 0 0' },
            header: { borderRadius: '24px 24px 0 0', borderBottom: '1px solid #FFE8F1', padding: '16px 20px' },
            body: { padding: '16px 20px', overflowY: 'auto', maxHeight: '80dvh', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' },
          }}
          extra={
            <Button type="primary" shape="round" onClick={handleSave}>
              Salvar
            </Button>
          }
        >
          <Form.Item name="name" label="Nome da conta" rules={[{ required: true, message: 'Obrigatório' }]}>
            <StyledInput placeholder="Ex: Nubank, Itaú..." enterKeyHint="next" />
          </Form.Item>

          <Form.Item name="bank_name" label="Banco" rules={[{ required: true, message: 'Obrigatório' }]}>
            <StyledInput placeholder="Ex: Nubank, Itaú, Bradesco..." enterKeyHint="next" />
          </Form.Item>

          <Form.Item name="type" label="Tipo" rules={[{ required: true, message: 'Obrigatório' }]}>
            <TypeButton onOpen={() => setTypePicker(true)} />
          </Form.Item>

          <Form.Item name="balance" label="Saldo inicial" rules={[{ required: true, message: 'Obrigatório' }]}>
            <CurrencyInput />
          </Form.Item>

          <Form.Item name="color" label="Cor" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '4px 0' }}>
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setFieldValue('color', color)}
                  style={{
                    width: 36, height: 36,
                    borderRadius: '50%',
                    background: color,
                    border: `3px solid ${colorValue === color ? '#3d1a2e' : 'transparent'}`,
                    outline: colorValue === color ? `2px solid ${color}` : 'none',
                    outlineOffset: 2,
                    transform: colorValue === color ? 'scale(1.18)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: `0 2px 6px ${color}60`,
                  }}
                />
              ))}
            </div>
          </Form.Item>
        </Drawer>
      </Form>

      {/* ── Type picker overlay ── */}
      {typePicker && createPortal(
        <div
          onClick={() => setTypePicker(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(61,26,46,0.55)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 32px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 24,
              overflow: 'hidden',
              width: '100%',
              maxWidth: 340,
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
              animation: 'sheetUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #FFE8F1', textAlign: 'center' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#3d1a2e' }}>Tipo de conta</p>
            </div>
            {TYPE_OPTIONS.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  form.setFieldValue('type', opt.value)
                  setSelectedType(opt.value)
                  setTypePicker(false)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  width: '100%', padding: '16px 20px',
                  background: selectedType === opt.value ? '#FFF0F7' : 'white',
                  border: 'none',
                  borderTop: i > 0 ? '1px solid #FFE8F1' : 'none',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
              >
                <span style={{ fontSize: 26 }}>{opt.emoji}</span>
                <span style={{ fontSize: 15, color: '#3d1a2e', fontWeight: 500, flex: 1 }}>{opt.label}</span>
                {selectedType === opt.value && (
                  <span style={{ color: '#FF6B9D', fontWeight: 800, fontSize: 18 }}>✓</span>
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
