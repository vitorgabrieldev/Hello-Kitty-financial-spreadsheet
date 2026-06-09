'use client'

import '@ant-design/v5-patch-for-react-19'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, App } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { useEffect, useState } from 'react'
import { ThemeProvider, useTheme } from '@/lib/theme-context'
import { DEFAULT_THEME_ID, getTheme } from '@/lib/themes'
import { UserProvider } from '@/lib/user-context'

const defaultAntd = getTheme(DEFAULT_THEME_ID).antd

function AntdProviders({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <AntdRegistry>
      {/* Use default theme on first render to match SSR, switch to saved theme after hydration */}
      <ConfigProvider theme={mounted ? theme.antd : defaultAntd} locale={ptBR}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>
        <AntdProviders>{children}</AntdProviders>
      </UserProvider>
    </ThemeProvider>
  )
}
