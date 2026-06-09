import type { ThemeConfig } from 'antd'

export type ThemeId = 'hello-kitty' | 'barbie' | 'moranguinho' | 'roxo' | 'neutro'

export interface Theme {
  id: ThemeId
  label: string
  emoji: string
  /** Gradient shown in the theme picker card (and as body bg fallback when no image). */
  bgGradient: string
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
    bgGradient: 'linear-gradient(145deg, #FF6B9D 0%, #FFB3CE 100%)',
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
    emoji: '💅',
    bgGradient: 'linear-gradient(145deg, #F06292 0%, #FFD6E7 100%)',
    vars: {
      '--primary':        '#F06292',
      '--primary-hover':  '#EC407A',
      '--primary-active': '#D81B60',
      '--primary-light':  '#F48FB1',
      '--primary-pale':   '#FCE4EC',
      '--cream':          '#FFF0F5',
      '--dark':           '#3D0A1E',
      '--gray':           '#8B5A6B',
      '--border':         '#F8BBD0',
      '--border-light':   '#FCE4EC',
    },
    antd: makeAntd('#F06292', '#FFF0F5', '#3D0A1E', '#F8BBD0', '#FCE4EC'),
  },
  {
    id: 'moranguinho',
    label: 'Moranguinho',
    emoji: '🍓',
    bgGradient: 'linear-gradient(145deg, #EF5350 0%, #FFCDD2 100%)',
    vars: {
      '--primary':        '#EF5350',
      '--primary-hover':  '#E53935',
      '--primary-active': '#C62828',
      '--primary-light':  '#EF9A9A',
      '--primary-pale':   '#FFEBEE',
      '--cream':          '#FFF5F5',
      '--dark':           '#2D0A0A',
      '--gray':           '#7D4E4E',
      '--border':         '#FFCDD2',
      '--border-light':   '#FFEBEE',
    },
    antd: makeAntd('#EF5350', '#FFF5F5', '#2D0A0A', '#FFCDD2', '#FFEBEE'),
  },
  {
    id: 'roxo',
    label: 'Roxo',
    emoji: '💜',
    bgGradient: 'linear-gradient(145deg, #8B5CF6 0%, #E9D5FF 100%)',
    vars: {
      '--primary':        '#8B5CF6',
      '--primary-hover':  '#7C3AED',
      '--primary-active': '#6D28D9',
      '--primary-light':  '#C4B5FD',
      '--primary-pale':   '#EDE9FE',
      '--cream':          '#F5F3FF',
      '--dark':           '#2E1065',
      '--gray':           '#6D5A8A',
      '--border':         '#DDD6FE',
      '--border-light':   '#EDE9FE',
    },
    antd: makeAntd('#8B5CF6', '#F5F3FF', '#2E1065', '#DDD6FE', '#EDE9FE'),
  },
  {
    id: 'neutro',
    label: 'Neutro',
    emoji: '🩶',
    bgGradient: 'linear-gradient(145deg, #64748B 0%, #CBD5E1 100%)',
    vars: {
      '--primary':        '#64748B',
      '--primary-hover':  '#475569',
      '--primary-active': '#334155',
      '--primary-light':  '#94A3B8',
      '--primary-pale':   '#E2E8F0',
      '--cream':          '#F8FAFC',
      '--dark':           '#1E293B',
      '--gray':           '#64748B',
      '--border':         '#CBD5E1',
      '--border-light':   '#E2E8F0',
    },
    antd: makeAntd('#64748B', '#F8FAFC', '#1E293B', '#CBD5E1', '#E2E8F0'),
  },
]

export const DEFAULT_THEME_ID: ThemeId = 'hello-kitty'

export function getTheme(id: ThemeId | string): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0]
}
