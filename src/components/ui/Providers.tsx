'use client'

import '@ant-design/v5-patch-for-react-19'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, App } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { ThemeProvider, useTheme } from '@/lib/theme-context'

function AntdProviders({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme.antd} locale={ptBR}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  )
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AntdProviders>{children}</AntdProviders>
    </ThemeProvider>
  )
}
