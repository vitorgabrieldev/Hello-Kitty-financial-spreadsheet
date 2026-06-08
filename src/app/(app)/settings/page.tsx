'use client'

import { useEffect, useState } from 'react'
import { Avatar, Button, App, Drawer, Form } from 'antd'
import { LogOut, User, ChevronRight, Pencil, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Profile } from '@/types'

const MARITAL_OPTIONS = [
  { value: 'single',   label: 'Solteiro(a)' },
  { value: 'married',  label: 'Casado(a)' },
  { value: 'divorced', label: 'Divorciado(a)' },
  { value: 'widowed',  label: 'Viúvo(a)' },
  { value: 'union',    label: 'União estável' },
]

function StyledInput({ value, onChange, placeholder, type = 'text' }: {
  value?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  type?: string
}) {
  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
  }
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
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
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={3}
      onFocus={handleFocus}
      style={{
        width: '100%', padding: '10px 14px',
        border: '1px solid #d9d9d9', borderRadius: 8,
        fontSize: 15, fontWeight: 600, color: '#3d1a2e',
        background: 'white', outline: 'none', caretColor: '#FF6B9D',
        resize: 'none', fontFamily: 'inherit', letterSpacing: 0.5,
        transition: 'border-color 0.2s', WebkitAppearance: 'none',
      }}
    />
  )
}

export default function SettingsPage() {
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [userEmail, setUserEmail]     = useState('')
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [loadingCep, setLoadingCep]   = useState(false)
  const [maritalStatus, setMaritalStatus] = useState('')
  const [form] = Form.useForm()
  const { modal, message } = App.useApp()
  const router = useRouter()

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserEmail(user.email ?? '')
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single()
    setProfile(data)
  }

  function openEditProfile() {
    if (!profile) return
    form.setFieldsValue({
      name:          profile.name ?? '',
      birth_date:    profile.birth_date ?? '',
      bio:           profile.bio ?? '',
      zip_code:      profile.zip_code ?? '',
      street:        profile.street ?? '',
      street_number: profile.street_number ?? '',
      complement:    profile.complement ?? '',
      neighborhood:  profile.neighborhood ?? '',
      city:          profile.city ?? '',
      state_uf:      profile.state_uf ?? '',
    })
    setMaritalStatus(profile.marital_status ?? '')
    setDrawerOpen(true)
  }

  async function fetchCep(cep: string) {
    setLoadingCep(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      if (!data.erro) {
        form.setFieldsValue({
          street:       data.logradouro ?? '',
          neighborhood: data.bairro ?? '',
          city:         data.localidade ?? '',
          state_uf:     data.uf ?? '',
        })
      }
    } catch { /* network error, ignore */ }
    finally { setLoadingCep(false) }
  }

  async function handleSaveProfile() {
    const values = await form.validateFields()
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ ...values, marital_status: maritalStatus || null })
      .eq('user_id', profile!.user_id)
    if (error) { message.error('Erro ao salvar perfil'); return }
    message.success('Perfil atualizado! 🎀')
    setDrawerOpen(false)
    load()
  }

  async function handleLogout() {
    modal.confirm({
      title: 'Sair da conta?',
      content: 'Seus dados ficam salvos e seguros.',
      okText: 'Sair',
      cancelText: 'Cancelar',
      onOk: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
      },
    })
  }

  const menuItems = [
    { icon: '🔒', label: 'Privacidade',    sub: 'Seus dados são privados e seguros',  onClick: () => message.info('Em breve!') },
    { icon: '🎨', label: 'Personalização', sub: 'Temas e preferências visuais',        onClick: () => message.info('Em breve!') },
  ]

  return (
    <div className="page-enter">
      {/* Header */}
      <div className="hk-gradient px-4 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-8xl opacity-10" style={{ transform: 'translate(10%, -10%)' }}>🎀</div>
        <div className="flex items-center gap-4 relative">
          <div style={{ position: 'relative' }}>
            <Avatar
              size={64}
              src={profile?.avatar_url}
              style={{ background: 'rgba(255,255,255,0.3)', border: '3px solid rgba(255,255,255,0.6)' }}
              icon={<User size={28} />}
            />
            <button
              onClick={openEditProfile}
              style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 22, height: 22, borderRadius: '50%',
                background: 'white', border: '2px solid #FF6B9D',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              <Pencil size={11} style={{ color: '#FF6B9D' }} />
            </button>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{profile?.name ?? 'Carregando...'}</p>
            <p className="text-white/70 text-sm">{userEmail}</p>
            <button
              onClick={openEditProfile}
              style={{
                marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)',
                borderRadius: 20, padding: '3px 12px', cursor: 'pointer',
              }}
            >
              <Pencil size={10} style={{ color: 'white' }} />
              <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>Editar perfil</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="rounded-2xl overflow-hidden bg-white" style={{ border: '1px solid #FFE8F1' }}>
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.onClick}
              className="w-full flex items-center gap-3 px-4 py-4 text-left hk-card-hover"
              style={{
                borderBottom: i < menuItems.length - 1 ? '1px solid #FFE8F1' : 'none',
                background: 'none', cursor: 'pointer',
              }}
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#3d1a2e' }}>{item.label}</p>
                <p className="text-xs" style={{ color: '#8B6B7A' }}>{item.sub}</p>
              </div>
              <ChevronRight size={16} style={{ color: '#C4A0B0' }} />
            </button>
          ))}
        </div>

        <Button
          danger block size="large"
          icon={<LogOut size={16} />}
          onClick={handleLogout}
          style={{ borderRadius: 50, height: 50, fontWeight: 600 }}
        >
          Sair da conta
        </Button>
      </div>

      {/* Edit Profile Drawer */}
      <Form form={form} layout="vertical" requiredMark={false}>
        <Drawer
          title="Editar perfil"
          placement="bottom"
          height="auto"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{
            content: { borderRadius: '24px 24px 0 0' },
            header: { borderRadius: '24px 24px 0 0', borderBottom: '1px solid #FFE8F1', padding: '16px 20px' },
            body: { padding: '16px 20px', overflowY: 'auto', maxHeight: '85dvh', paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' },
          }}
          extra={<Button type="primary" shape="round" onClick={handleSaveProfile}>Salvar</Button>}
        >
          <Form.Item name="name" label="Nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <StyledInput placeholder="Seu nome" />
          </Form.Item>

          <Form.Item name="birth_date" label="Data de nascimento">
            <StyledInput type="date" />
          </Form.Item>

          <Form.Item name="bio" label="Biografia">
            <StyledTextarea placeholder="Conte um pouco sobre você..." />
          </Form.Item>

          {/* Estado civil */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#3d1a2e', marginBottom: 8 }}>Estado civil</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MARITAL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMaritalStatus(v => v === opt.value ? '' : opt.value)}
                  style={{
                    height: 34, padding: '0 14px', borderRadius: 20,
                    background: maritalStatus === opt.value ? '#FF6B9D' : '#FFE8F1',
                    color:      maritalStatus === opt.value ? 'white'    : '#8B6B7A',
                    border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Endereço */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <MapPin size={14} style={{ color: '#FF6B9D' }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#FF6B9D', margin: 0 }}>Endereço</p>
          </div>

          <Form.Item
            name="zip_code"
            label="CEP"
            getValueFromEvent={(e: React.ChangeEvent<HTMLInputElement>) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 8)
              const formatted = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw
              if (raw.length === 8) fetchCep(raw)
              return formatted
            }}
          >
            <input
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              style={{
                width: '100%', height: 46, padding: '0 14px',
                border: '1px solid #d9d9d9', borderRadius: 8,
                fontSize: 15, fontWeight: 600, color: '#3d1a2e',
                background: loadingCep ? '#FFF5F7' : 'white',
                outline: 'none', caretColor: '#FF6B9D',
                transition: 'background 0.2s', WebkitAppearance: 'none',
              }}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px', gap: 10 }}>
            <Form.Item name="street" label="Logradouro">
              <StyledInput placeholder="Rua, Av., Alameda..." />
            </Form.Item>
            <Form.Item name="street_number" label="Número">
              <StyledInput placeholder="123" />
            </Form.Item>
          </div>

          <Form.Item name="complement" label="Complemento">
            <StyledInput placeholder="Apto, Bloco, Casa..." />
          </Form.Item>

          <Form.Item name="neighborhood" label="Bairro">
            <StyledInput placeholder="Bairro" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px', gap: 10 }}>
            <Form.Item name="city" label="Cidade">
              <StyledInput placeholder="Cidade" />
            </Form.Item>
            <Form.Item name="state_uf" label="UF">
              <StyledInput placeholder="SP" />
            </Form.Item>
          </div>
        </Drawer>
      </Form>
    </div>
  )
}
