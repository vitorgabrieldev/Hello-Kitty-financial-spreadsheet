'use client'

import { useEffect, useState } from 'react'
import { Button, Drawer, Form, App } from 'antd'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import type { Category } from '@/types'

const EMOJI_OPTIONS = ['🍽️','💅','🛍️','🚗','💊','🎉','🏠','📚','🐾','✈️','🎬','💪','💰','💻','📈','🎁','✨','☕','🎮','🎵','💄','👗','🌸','🍰','🎀','💕','🌷','🦄']
const COLOR_OPTIONS = ['#FF6B9D','#FF9EC4','#9B59B6','#3498DB','#2ECC71','#F39C12','#E74C3C','#1ABC9C','#E67E22','#16A085','#8E44AD','#C0392B']
const TYPE_LABELS: Record<string, string> = { both: 'Ambos', expense: 'Gasto', income: 'Receita' }

function StyledInput({ value, onChange, placeholder }: {
  value?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  placeholder?: string
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
      enterKeyHint="done"
      onFocus={handleFocus}
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing]       = useState<Category | null>(null)
  const [pressedId, setPressedId]   = useState<string | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState('✨')
  const [selectedColor, setSelectedColor] = useState('#FF6B9D')
  const [selectedType, setSelectedType]   = useState<'both' | 'expense' | 'income'>('both')
  const [form] = Form.useForm()
  const { message, modal } = App.useApp()

  const nameValue = Form.useWatch('name', form)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${user.id}`)
      .order('is_default', { ascending: false })
      .order('name')
    setCategories(data ?? [])
    setLoading(false)
  }

  function openNew() {
    setEditing(null)
    form.resetFields()
    setSelectedEmoji('✨')
    setSelectedColor('#FF6B9D')
    setSelectedType('both')
    setDrawerOpen(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    form.setFieldsValue({ name: cat.name })
    setSelectedEmoji(cat.icon)
    setSelectedColor(cat.color)
    setSelectedType(cat.type as 'both' | 'expense' | 'income')
    setDrawerOpen(true)
  }

  async function handleSave() {
    const values = await form.validateFields()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = { name: values.name, icon: selectedEmoji, color: selectedColor, type: selectedType }

    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id).eq('user_id', user.id)
      if (error) { message.error('Erro ao atualizar'); return }
      message.success('Categoria atualizada! 🎀')
    } else {
      const { error } = await supabase.from('categories').insert({ ...payload, user_id: user.id, is_default: false })
      if (error) { message.error('Erro ao criar categoria'); return }
      message.success('Categoria criada! 🎀')
    }
    setDrawerOpen(false)
    load()
  }

  async function handleDelete(cat: Category) {
    modal.confirm({
      title: 'Excluir categoria?',
      content: `"${cat.icon} ${cat.name}" será removida. Transações existentes ficarão sem categoria.`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { error } = await supabase.from('categories').delete().eq('id', cat.id).eq('user_id', user.id)
        if (error) { message.error('Erro ao excluir categoria'); return }
        setCategories(prev => prev.filter(c => c.id !== cat.id))
        setDrawerOpen(false)
        message.success('Categoria excluída')
      },
    })
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Categorias"
        subtitle="Organize seus lançamentos"
        rightAction={
          <Button type="primary" shape="round" icon={<Plus size={16} />} onClick={openNew} size="middle">
            Nova
          </Button>
        }
      />

      <div className="px-4 py-2">
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #FFE8F1', borderRadius: 14, overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 3 }} />
                <div style={{ padding: '10px 8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }} />
                  <div className="skeleton h-2.5 rounded-full" style={{ width: '75%' }} />
                  <div className="skeleton h-2 rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-3">🎀</span>
            <p className="font-semibold text-sm mb-4" style={{ color: '#3d1a2e' }}>Nenhuma categoria ainda</p>
            <Button type="primary" shape="round" onClick={openNew} icon={<Plus size={14} />}>
              Criar categoria
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => openEdit(cat)}
                onPointerDown={() => setPressedId(cat.id)}
                onPointerUp={() => setPressedId(null)}
                onPointerLeave={() => setPressedId(null)}
                style={{ background: 'white', border: '1px solid #FFE8F1', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', width: '100%', padding: 0 }}
              >
                {/* color bar */}
                <div style={{ height: 3, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}55)` }} />

                <div style={{ padding: '10px 8px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  {/* emoji square with scale effect */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: cat.color + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                    transform: pressedId === cat.id ? 'scale(0.80)' : 'scale(1)',
                    transition: 'transform 0.13s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}>
                    {cat.icon}
                  </div>

                  {/* name */}
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#3d1a2e', margin: 0, textAlign: 'center', lineHeight: 1.25, width: '100%', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {cat.name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Form form={form} layout="vertical" requiredMark={false}>
        <Drawer
          title={editing ? 'Editar categoria' : 'Nova categoria'}
          placement="bottom"
          height="auto"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{
            content: { borderRadius: '24px 24px 0 0' },
            header: { borderRadius: '24px 24px 0 0', borderBottom: '1px solid #FFE8F1', padding: '16px 20px' },
            body: { padding: '16px 20px', overflowY: 'auto', maxHeight: '80dvh', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' },
          }}
          extra={<Button type="primary" shape="round" onClick={handleSave}>Salvar</Button>}
        >
          {/* Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 12, background: '#FFF5F7', border: '1px solid #FFE8F1', borderRadius: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: selectedColor + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {selectedEmoji}
            </div>
            <p style={{ fontWeight: 700, fontSize: 15, color: nameValue ? '#3d1a2e' : '#C4A0B0', margin: 0 }}>
              {nameValue || 'Nome da categoria'}
            </p>
          </div>

          <Form.Item name="name" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <StyledInput placeholder="Ex: Spa, Cabelo, Academia..." />
          </Form.Item>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 8 }}>Tipo</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['both', 'expense', 'income'] as const).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSelectedType(val)}
                  style={{
                    flex: 1, height: 38, borderRadius: 10,
                    background: selectedType === val ? '#FF6B9D' : '#FFE8F1',
                    color: selectedType === val ? 'white' : '#8B6B7A',
                    border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {TYPE_LABELS[val]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 8 }}>Emoji</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setSelectedEmoji(e)}
                  style={{
                    width: 40, height: 40, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, cursor: 'pointer',
                    background: selectedEmoji === e ? '#FFE8F1' : 'transparent',
                    border: `2px solid ${selectedEmoji === e ? '#FF6B9D' : 'transparent'}`,
                    transform: selectedEmoji === e ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: editing ? 24 : 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 8 }}>Cor</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '4px 0' }}>
              {COLOR_OPTIONS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: color, flexShrink: 0, cursor: 'pointer',
                    border: `3px solid ${selectedColor === color ? '#3d1a2e' : 'transparent'}`,
                    outline: selectedColor === color ? `2px solid ${color}` : 'none',
                    outlineOffset: 2,
                    transform: selectedColor === color ? 'scale(1.18)' : 'scale(1)',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: `0 2px 6px ${color}60`,
                  }}
                />
              ))}
            </div>
          </div>

          {editing && (
            <button
              type="button"
              onClick={() => handleDelete(editing)}
              style={{
                width: '100%', height: 44, borderRadius: 10,
                background: '#FFF0F0', border: '1px solid #FFCCCC',
                color: '#E74C3C', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s ease',
              }}
            >
              <Trash2 size={15} />
              Excluir categoria
            </button>
          )}
        </Drawer>
      </Form>
    </div>
  )
}
