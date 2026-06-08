'use client'

import { useEffect, useState } from 'react'
import { Form, Input, InputNumber, Select, DatePicker, Switch, Button, App } from 'antd'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { createClient } from '@/lib/supabase/client'
import type { Category, Account, Card } from '@/types'

dayjs.locale('pt-br')

export default function NewTransactionPage() {
  const [form] = Form.useForm()
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [isInstallment, setIsInstallment] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()
  const router = useRouter()

  useEffect(() => {
    loadSelects()
    form.setFieldsValue({ date: dayjs(), type: 'expense' })
  }, [])

  async function loadSelects() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [catRes, accRes, cardRes] = await Promise.all([
      supabase.from('categories').select('*').or(`is_default.eq.true,user_id.eq.${user.id}`).order('name'),
      supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('cards').select('*').eq('user_id', user.id).eq('is_active', true),
    ])

    setCategories(catRes.data ?? [])
    setAccounts(accRes.data ?? [])
    setCards(cardRes.data ?? [])
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const values = await form.validateFields()
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        type: values.type,
        amount: values.amount,
        description: values.description,
        date: values.date.format('YYYY-MM-DD'),
        category_id: values.category_id,
        account_id: values.account_id ?? null,
        card_id: values.card_id ?? null,
        is_installment: isInstallment,
        installment_total: isInstallment ? values.installment_total : null,
        installment_current: isInstallment ? 1 : null,
        notes: values.notes ?? null,
        is_paid: values.type === 'income' ? true : !values.card_id,
      }

      if (isInstallment && values.installment_total > 1) {
        const groupId = crypto.randomUUID()
        const installments = Array.from({ length: values.installment_total }, (_, i) => ({
          ...payload,
          installment_current: i + 1,
          installment_group_id: groupId,
          date: dayjs(values.date).add(i, 'month').format('YYYY-MM-DD'),
        }))
        const { error } = await supabase.from('transactions').insert(installments)
        if (error) throw error
      } else {
        const { error } = await supabase.from('transactions').insert(payload)
        if (error) throw error
      }

      message.success('Lançamento adicionado! 🎀')
      router.push('/transactions')
    } catch {
      message.error('Erro ao salvar lançamento')
    } finally {
      setLoading(false)
    }
  }

  const filteredCategories = categories.filter(c => c.type === type || c.type === 'both')

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,107,157,0.08)', border: 'none', cursor: 'pointer' }}
        >
          <ChevronLeft size={20} style={{ color: '#FF6B9D' }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: '#3d1a2e' }}>Novo lançamento</h1>
      </div>

      {/* Type selector */}
      <div className="px-4 mb-4">
        <div className="flex rounded-2xl overflow-hidden" style={{ background: '#FFE8F1', padding: 4, gap: 4 }}>
          {(['expense', 'income'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setType(t); form.setFieldValue('type', t); form.setFieldValue('category_id', undefined) }}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: type === t ? (t === 'expense' ? '#FF6B6B' : '#4CAF82') : 'transparent',
                color: type === t ? 'white' : '#8B6B7A',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t === 'expense' ? '💸 Gasto' : '💰 Receita'}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="px-4 pb-8">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="type" hidden><Input /></Form.Item>

          <Form.Item name="amount" label="Valor" rules={[{ required: true, message: 'Informe o valor' }]}>
            <InputNumber
              style={{ width: '100%', fontSize: 24, fontWeight: 700 }}
              prefix="R$"
              precision={2}
              decimalSeparator=","
              placeholder="0,00"
              size="large"
            />
          </Form.Item>

          <Form.Item name="description" label="Descrição" rules={[{ required: true, message: 'Informe a descrição' }]}>
            <Input placeholder="Ex: Mercado, Netflix, Salário..." size="large" />
          </Form.Item>

          <Form.Item name="category_id" label="Categoria" rules={[{ required: true, message: 'Selecione a categoria' }]}>
            <Select placeholder="Selecione..." size="large" showSearch optionFilterProp="label">
              {filteredCategories.map(c => (
                <Select.Option key={c.id} value={c.id} label={c.name}>
                  <span>{c.icon} {c.name}</span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="date" label="Data" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" size="large" />
          </Form.Item>

          {type === 'expense' && (
            <>
              <Form.Item name="card_id" label="Cartão de crédito (opcional)">
                <Select placeholder="Nenhum (débito/dinheiro)" size="large" allowClear>
                  {cards.map(c => (
                    <Select.Option key={c.id} value={c.id}>💳 {c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="account_id" label="Conta (opcional)">
                <Select placeholder="Selecione a conta..." size="large" allowClear>
                  {accounts.map(a => (
                    <Select.Option key={a.id} value={a.id}>🏦 {a.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,107,157,0.06)', border: '1px solid #FFE8F1' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#3d1a2e' }}>Compra parcelada?</p>
                    <p className="text-xs" style={{ color: '#8B6B7A' }}>Divide o valor em parcelas mensais</p>
                  </div>
                  <Switch
                    checked={isInstallment}
                    onChange={setIsInstallment}
                    style={{ background: isInstallment ? '#FF6B9D' : undefined }}
                  />
                </div>
                {isInstallment && (
                  <Form.Item name="installment_total" label="Número de parcelas" rules={[{ required: true, message: 'Informe as parcelas' }]} style={{ marginBottom: 0, marginTop: 12 }}>
                    <Select size="large">
                      {Array.from({ length: 23 }, (_, i) => i + 2).map(n => (
                        <Select.Option key={n} value={n}>{n}x</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}
              </div>
            </>
          )}

          {type === 'income' && (
            <Form.Item name="account_id" label="Conta de destino">
              <Select placeholder="Selecione a conta..." size="large" allowClear>
                {accounts.map(a => (
                  <Select.Option key={a.id} value={a.id}>🏦 {a.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item name="notes" label="Observações (opcional)">
            <Input.TextArea placeholder="Anotações extras..." rows={2} style={{ borderRadius: 12 }} />
          </Form.Item>

          <Button
            type="primary"
            block
            size="large"
            onClick={handleSubmit}
            loading={loading}
            style={{ height: 52, borderRadius: 50, marginTop: 8 }}
          >
            Salvar lançamento 🎀
          </Button>
        </Form>
      </div>
    </div>
  )
}
