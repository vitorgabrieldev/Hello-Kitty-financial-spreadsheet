'use client'

import '@ant-design/v5-patch-for-react-19'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, App } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { hkTheme } from '@/lib/theme'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={hkTheme} locale={ptBR}>
        <App>
          {children}
        </App>
      </ConfigProvider>
    </AntdRegistry>
  )
}
