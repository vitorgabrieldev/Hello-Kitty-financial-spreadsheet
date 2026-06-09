'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Check } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { THEMES, type ThemeId } from '@/lib/themes'

const THEME_DESCRIPTIONS: Record<string, string> = {
  'hello-kitty': 'Rosinha delicado e fofo',
  'barbie':      'Pink vibrante e elegante',
  'moranguinho': 'Vermelho coral e suave',
  'roxo':        'Roxo moderno estilo Nubank',
  'neutro':      'Cinza limpo e minimalista',
}

export default function ThemePage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  function handleSelect(id: ThemeId) {
    setTheme(id)
  }

  return (
    <div className="page-enter pb-nav">
      {/* Header */}
      <div className="hk-gradient px-4 pt-10 pb-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.08, fontSize: 120, lineHeight: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '0 8px 0 0' }}
        >
          {theme.emoji}
        </div>

        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 20, padding: '5px 14px', cursor: 'pointer', marginBottom: 16,
          }}
        >
          <ArrowLeft size={14} color="white" />
          <span style={{ fontSize: 12, color: 'white', fontWeight: 600 }}>Voltar</span>
        </button>

        <p className="text-white font-bold text-xl leading-tight">Escolher tema</p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>
          Personalize a aparência do app
        </p>
      </div>

      {/* Grid de temas */}
      <div className="px-4 py-4">
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Temas disponíveis
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {THEMES.map(t => {
            const isActive = theme.id === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelect(t.id as ThemeId)}
                style={{
                  position: 'relative',
                  borderRadius: 20,
                  border: isActive
                    ? `2.5px solid ${t.vars['--primary']}`
                    : '2.5px solid transparent',
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'transparent',
                  boxShadow: isActive
                    ? `0 0 0 3px ${t.vars['--primary-pale']}, 0 8px 24px ${t.vars['--primary']}44`
                    : '0 2px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {/* Preview do gradiente/imagem */}
                <div
                  style={{
                    height: 110,
                    background: t.bgGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Emoji grande */}
                  <span style={{ fontSize: 44, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }}>
                    {t.emoji}
                  </span>

                  {/* Checkmark quando ativo */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: `0 2px 8px ${t.vars['--primary']}66`,
                      }}
                    >
                      <Check size={13} color={t.vars['--primary']} strokeWidth={3} />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div
                  style={{
                    background: 'white',
                    padding: '10px 12px 12px',
                    textAlign: 'left',
                  }}
                >
                  <p
                    style={{
                      fontWeight: 700, fontSize: 13,
                      color: isActive ? t.vars['--primary'] : 'var(--dark)',
                      margin: 0, lineHeight: 1.2,
                      transition: 'color 0.2s',
                    }}
                  >
                    {t.label}
                  </p>
                  <p
                    style={{
                      fontSize: 11, color: 'var(--gray)',
                      margin: '3px 0 0', lineHeight: 1.3,
                    }}
                  >
                    {THEME_DESCRIPTIONS[t.id]}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

      </div>
    </div>
  )
}
