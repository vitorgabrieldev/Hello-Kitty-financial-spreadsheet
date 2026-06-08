'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      router.replace('/login?error=no_code')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        router.replace(`/login?error=${encodeURIComponent(error.message)}`)
      } else {
        router.replace('/dashboard')
      }
    })
  }, [searchParams, router])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #FFE8F1 0%, #FFF5F7 100%)',
    }}>
      <p style={{ color: '#FF6B9D', fontWeight: 600, fontSize: 15 }}>Entrando...</p>
    </div>
  )
}
