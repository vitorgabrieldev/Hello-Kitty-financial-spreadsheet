'use client'

import { useState } from 'react'
import { App } from 'antd'
import { createClient } from '@/lib/supabase/client'
import Providers from '@/components/ui/Providers'

function LoginContent() {
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) {
      message.error('Erro ao entrar com Google. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">

      {/* Área do wallpaper — decoração flutuante */}
      <div className="flex-[2] md:hidden flex flex-col items-center" style={{ paddingTop: '8vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 52,
              filter: 'drop-shadow(0 4px 14px rgba(255,107,157,0.45))',
              animation: 'floatBow 3s ease-in-out infinite',
              display: 'block',
            }}
          >
            🎀
          </span>
        </div>
      </div>

      {/* Painel principal */}
      <div
        className="login-glass flex flex-col gap-7 w-full px-6 pt-10 pb-10
                   md:max-w-sm md:mx-auto md:my-auto md:rounded-[32px] md:px-10 md:py-10"
        style={{
          borderRadius: '28px 28px 0 0',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(255,255,255,0.7)',
          animation: 'sheetUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* Puxador decorativo */}
        <div className="md:hidden flex justify-center -mt-4 mb-0">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,107,157,0.25)' }} />
        </div>

        {/* Identidade */}
        <div className="flex flex-col gap-3">
          <div className="flex">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: 'rgba(255,107,157,0.10)',
                color: '#FF6B9D',
                border: '1px solid rgba(255,107,157,0.22)',
                letterSpacing: '0.04em',
              }}
            >
              🎀 Gestão Financeira Pessoal
            </span>
          </div>

          <h1
            className="text-4xl font-bold leading-tight"
            style={{ color: '#3d1a2e', letterSpacing: '-0.02em' }}
          >
            Controle<br />
            <span style={{ color: '#FF6B9D' }}>financeiro</span>
          </h1>

          <p className="text-sm leading-relaxed" style={{ color: '#8B6B7A' }}>
            Receitas, despesas, cartões e parcelas num só lugar.
          </p>
        </div>

        {/* Botão de acesso */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl"
            style={{
              height: 56,
              background: loading ? '#f9f9f9' : '#FFFFFF',
              border: '1.5px solid rgba(255,107,157,0.18)',
              color: '#3d1a2e',
              fontWeight: 700,
              fontSize: 15,
              boxShadow: '0 4px 20px rgba(255,107,157,0.12), 0 1px 3px rgba(0,0,0,0.06)',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease',
            }}
            onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
            onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            onTouchStart={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
            onTouchEnd={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
          >
            {/* Shimmer */}
            {!loading && (
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(105deg, transparent 40%, rgba(255,182,210,0.25) 50%, transparent 60%)',
                  backgroundSize: '200% 100%',
                  animation: 'btnShimmer 2.8s ease infinite',
                  borderRadius: 'inherit',
                  pointerEvents: 'none',
                }}
              />
            )}

            {loading ? (
              <span style={{ color: '#FF6B9D' }}>Aguarde...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com o Google
              </>
            )}
          </button>

          <p className="text-xs text-center" style={{ color: '#C4A0B0' }}>
            Construído por{' '}
            <a
              href="https://github.com/vitorgabrieldev"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#FF6B9D', fontWeight: 600, textDecoration: 'none' }}
            >
              vitorgabrieldev
            </a>
          </p>
        </div>
      </div>

    </div>
  )
}

export default function LoginPage() {
  return (
    <Providers>
      <LoginContent />
    </Providers>
  )
}
