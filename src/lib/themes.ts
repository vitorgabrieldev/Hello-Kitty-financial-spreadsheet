import type { ThemeConfig } from 'antd'

export type ThemeId = 'hello-kitty' | 'barbie' | 'moranguinho' | 'roxo' | 'neutro'

export interface Theme {
  id: ThemeId
  label: string
  emoji: string
  vars: Record<string, string>
  antd: ThemeConfig
}

const sharedComponents: ThemeConfig['components'] = {
  Button: { borderRadius: 50, controlHeight: 44, fontWeight: 600 },
  Card: { borderRadiusLG: 20 },
  Input: { borderRadius: 12, controlHeight: 44 },
  Select: { borderRadius: 12, controlHeight: 44 },
  Modal: { borderRadiusLG: 24 },
  Drawer: { borderRadius: 24 },
  Tag: { borderRadius: 50 },
}

function makeAntd(primary: string, bgBase: string, textBase: string, border: string, borderSecondary: string): ThemeConfig {
  const rgba = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }
  return {
    token: {
      colorPrimary: primary,
      colorInfo: primary,
      colorBgBase: bgBase,
      colorTextBase: textBase,
      borderRadius: 16,
      borderRadiusLG: 20,
      borderRadiusSM: 10,
      fontFamily: "'Inter', 'Nunito', sans-serif",
      fontSize: 14,
      colorBgContainer: '#FFFFFF',
      colorBorder: border,
      colorBorderSecondary: borderSecondary,
      boxShadow: `0 2px 16px ${rgba(primary, 0.08)}`,
      boxShadowSecondary: `0 4px 24px ${rgba(primary, 0.12)}`,
    },
    components: sharedComponents,
  }
}

export const THEMES: Theme[] = [
  {
    id: 'hello-kitty',
    label: 'Hello Kitty',
    emoji: '🎀',
    vars: {
      '--primary':        '#FF6B9D',
      '--primary-hover':  '#FF4D8D',
      '--primary-active': '#E5006B',
      '--primary-light':  '#FFB3CE',
      '--primary-pale':   '#FFE8F1',
      '--cream':          '#FFF5F7',
      '--dark':           '#3d1a2e',
      '--gray':           '#8B6B7A',
      '--border':         '#FFD6E7',
      '--border-light':   '#FFE8F1',
    },
    antd: makeAntd('#FF6B9D', '#FFF5F7', '#3d1a2e', '#FFD6E7', '#FFE8F1'),
  },
  {
    id: 'barbie',
    label: 'Barbie',
    emoji: '👛',
    vars: {
      '--primary':        '#E91E8C',
      '--primary-hover':  '#C91777',
      '--primary-active': '#A01060',
      '--primary-light':  '#F48EC8',
      '--primary-pale':   '#FCE4F2',
      '--cream':          '#FFF0F8',
      '--dark':           '#3D003A',
      '--gray':           '#8B4D7A',
      '--border':         '#F0A8D5',
      '--border-light':   '#FCE4F2',
    },
    antd: makeAntd('#E91E8C', '#FFF0F8', '#3D003A', '#F0A8D5', '#FCE4F2'),
  },
  {
    id: 'moranguinho',
    label: 'Moranguinho',
    emoji: '🍓',
    vars: {
      '--primary':        '#E63946',
      '--primary-hover':  '#C82833',
      '--primary-active': '#A01E26',
      '--primary-light':  '#F4959A',
      '--primary-pale':   '#FCE4E5',
      '--cream':          '#FFF5F5',
      '--dark':           '#3D0A0A',
      '--gray':           '#8B4D52',
      '--border':         '#F0A8AB',
      '--border-light':   '#FCE4E5',
    },
    antd: makeAntd('#E63946', '#FFF5F5', '#3D0A0A', '#F0A8AB', '#FCE4E5'),
  },
  {
    id: 'roxo',
    label: 'Roxo',
    emoji: '💜',
    vars: {
      '--primary':        '#7C3AED',
      '--primary-hover':  '#6D28D9',
      '--primary-active': '#5B21B6',
      '--primary-light':  '#C4B5FD',
      '--primary-pale':   '#EDE9FE',
      '--cream':          '#F5F3FF',
      '--dark':           '#1E0A3C',
      '--gray':           '#6B4D8B',
      '--border':         '#C4B5FD',
      '--border-light':   '#EDE9FE',
    },
    antd: makeAntd('#7C3AED', '#F5F3FF', '#1E0A3C', '#C4B5FD', '#EDE9FE'),
  },
  {
    id: 'neutro',
    label: 'Neutro',
    emoji: '🩶',
    vars: {
      '--primary':        '#64748B',
      '--primary-hover':  '#475569',
      '--primary-active': '#334155',
      '--primary-light':  '#94A3B8',
      '--primary-pale':   '#E2E8F0',
      '--cream':          '#F8FAFC',
      '--dark':           '#1E293B',
      '--gray':           '#64748B',
      '--border':         '#CBD5E0',
      '--border-light':   '#E2E8F0',
    },
    antd: makeAntd('#64748B', '#F8FAFC', '#1E293B', '#CBD5E0', '#E2E8F0'),
  },
]

export const DEFAULT_THEME_ID: ThemeId = 'hello-kitty'

export function getTheme(id: ThemeId | string): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}
