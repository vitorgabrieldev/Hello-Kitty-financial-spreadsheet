import type { ThemeConfig } from 'antd'

export const hkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#FF6B9D',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#FF6B9D',
    colorBgBase: '#FFF5F7',
    colorTextBase: '#3d1a2e',
    borderRadius: 16,
    borderRadiusLG: 20,
    borderRadiusSM: 10,
    fontFamily: "'Inter', 'Nunito', sans-serif",
    fontSize: 14,
    colorBgContainer: '#FFFFFF',
    colorBorder: '#FFD6E7',
    colorBorderSecondary: '#FFE8F1',
    boxShadow: '0 2px 16px rgba(255, 107, 157, 0.08)',
    boxShadowSecondary: '0 4px 24px rgba(255, 107, 157, 0.12)',
  },
  components: {
    Button: {
      colorPrimary: '#FF6B9D',
      colorPrimaryHover: '#FF4D8D',
      colorPrimaryActive: '#E5006B',
      borderRadius: 50,
      controlHeight: 44,
      fontWeight: 600,
    },
    Card: {
      borderRadiusLG: 20,
      colorBorderSecondary: '#FFE8F1',
    },
    Input: {
      borderRadius: 12,
      controlHeight: 44,
      colorBorder: '#FFD6E7',
      colorPrimaryHover: '#FF6B9D',
    },
    Select: {
      borderRadius: 12,
      controlHeight: 44,
    },
    Modal: {
      borderRadiusLG: 24,
    },
    Drawer: {
      borderRadius: 24,
    },
    Tag: {
      borderRadius: 50,
    },
  },
}
