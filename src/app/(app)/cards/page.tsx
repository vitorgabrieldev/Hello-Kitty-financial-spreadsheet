'use client'

import { useEffect, useState } from 'react'
import { Button, Drawer, Form, Input, Select, InputNumber, App, Skeleton } from 'antd'
import { Plus, CreditCard, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, getCardBrandLabel } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'
import type { Card } from '@/types'

const COLORS = ['#FF6B9D', '#6C63FF', '#3498DB', '#2ECC71', '#F39C12', '#E74C3C', '#1ABC9C', '#9B59B6']
const CARD_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const [form] = Form.useForm()
  const { message, modal } = App.useApp()

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('cards').select('*').eq('user_id', user.id).order('created_at')
    setCards(data ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ color: '#FF6B9D', brand: 'visa', limit_amount: 0, current_balance: 0, closing_day: 1, due_day: 10 })
    setDrawerOpen(true)
  }

  function openEdit(card: Card) {
    setEditing(card)
    form.setFieldsValue(card)
    setDrawerOpen(true)
  }

  async function handleSave() {
    const values = await form.validateFields()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editing) {
      const { error } = await supabase.from('cards').update(values).eq('id', editing.id)
      if (error) { message.error('Erro ao atualizar'); return }
      message.success('Cartão atualizado!')
    } else {
      const { error } = await supabase.from('cards').insert({ ...values, user_id: user.id })
      if (error) { message.error('Erro ao criar cartão'); return }
      message.success('Cartão criado!')
    }

    setDrawerOpen(false)
    load()
  }

  async function handleDelete(card: Card) {
    modal.confirm({
      title: 'Excluir cartão?',
      content: `Deseja excluir "${card.name}"?`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        const supabase = createClient()
        await supabase.from('cards').delete().eq('id', card.id)
        message.success('Cartão excluído')
        load()
      },
    })
  }

  const usedLimit = (card: Card) => (card.current_balance / card.limit_amount) * 100

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

      <div className="px-4 py-2 flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-4 bg-white" style={{ border: '1px solid #FFE8F1' }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          ))
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-3">💳</span>
            <p className="font-semibold text-sm mb-1" style={{ color: '#3d1a2e' }}>Nenhum cartão ainda</p>
            <p className="text-xs mb-4 text-center" style={{ color: '#8B6B7A' }}>Adicione seus cartões de crédito!</p>
            <Button type="primary" shape="round" onClick={openNew} icon={<Plus size={14} />}>
              Adicionar cartão
            </Button>
          </div>
        ) : (
          cards.map(card => {
            const used = usedLimit(card)
            return (
              <div key={card.id} className="hk-card-hover">
                {/* Card visual */}
                <div
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{ background: card.color || '#FF6B9D', minHeight: 140 }}
                >
                  <div className="absolute top-0 right-0 text-6xl opacity-10 pointer-events-none" style={{ transform: 'translate(15%, -15%)' }}>🎀</div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-white/70 text-xs">{card.bank_name}</p>
                      <p className="text-white font-bold text-lg">{card.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(card)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer' }}>
                        <Pencil size={14} color="white" />
                      </button>
                      <button onClick={() => handleDelete(card)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '6px', cursor: 'pointer' }}>
                        <Trash2 size={14} color="white" />
                      </button>
                    </div>
                  </div>
                  {card.last_four_digits && (
                    <p className="text-white/60 text-sm tracking-widest mb-3">•••• •••• •••• {card.last_four_digits}</p>
                  )}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/70 text-xs">Fatura atual</p>
                      <p className="text-white font-bold text-xl">{formatCurrency(card.current_balance)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-xs">Limite</p>
                      <p className="text-white font-semibold">{formatCurrency(card.limit_amount)}</p>
                    </div>
                  </div>
                </div>

                {/* Card details */}
                <div className="rounded-b-2xl px-4 py-3 -mt-2 bg-white" style={{ border: '1px solid #FFE8F1', borderTop: 'none' }}>
                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1" style={{ color: '#8B6B7A' }}>
                      <span>Limite usado</span>
                      <span>{used.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#FFE8F1' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(used, 100)}%`,
                          background: used > 80 ? '#FF6B6B' : used > 60 ? '#FFD166' : '#4CAF82',
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: '#8B6B7A' }}>
                    <span>🗓️ Fecha dia {card.closing_day}</span>
                    <span>💰 Vence dia {card.due_day}</span>
                    <span>{getCardBrandLabel(card.brand)}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Form form={form} layout="vertical" requiredMark={false}>
        <Drawer
          title={editing ? 'Editar cartão' : 'Novo cartão'}
          placement="bottom"
          height="auto"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{ body: { paddingBottom: 'env(safe-area-inset-bottom, 16px)' } }}
          extra={
            <Button type="primary" shape="round" onClick={handleSave}>
              Salvar
            </Button>
          }
        >
          <Form.Item name="name" label="Nome do cartão" rules={[{ required: true }]}>
            <Input placeholder="Ex: Nubank Roxinho..." />
          </Form.Item>
          <Form.Item name="bank_name" label="Banco/Emissor" rules={[{ required: true }]}>
            <Input placeholder="Ex: Nubank, Itaú..." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="brand" label="Bandeira" rules={[{ required: true }]}>
              <Select>
                {['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other'].map(b => (
                  <Select.Option key={b} value={b}>{getCardBrandLabel(b)}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="last_four_digits" label="Últimos 4 dígitos">
              <Input maxLength={4} placeholder="1234" />
            </Form.Item>
          </div>
          <Form.Item name="limit_amount" label="Limite" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} prefix="R$" precision={2} decimalSeparator="," />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="closing_day" label="Dia de fechamento" rules={[{ required: true }]}>
              <Select>
                {CARD_DAYS.map(d => <Select.Option key={d} value={d}>Dia {d}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="due_day" label="Dia de vencimento" rules={[{ required: true }]}>
              <Select>
                {CARD_DAYS.map(d => <Select.Option key={d} value={d}>Dia {d}</Select.Option>)}
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="color" label="Cor do cartão">
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(color => (
                <button key={color} type="button" onClick={() => form.setFieldValue('color', color)}
                  className="w-9 h-9 rounded-full border-3 transition-all"
                  style={{ background: color, borderColor: form.getFieldValue('color') === color ? '#3d1a2e' : 'transparent', borderWidth: 3, borderStyle: 'solid' }}
                />
              ))}
            </div>
          </Form.Item>
        </Drawer>
      </Form>
    </div>
  )
}
