'use client'

import { useEffect, useState } from 'react'
import { Card } from 'antd'
import { TrendingUp, TrendingDown, Wallet, CreditCard, Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateShort, getCurrentMonthRange } from '@/lib/utils'
import { useNavigation } from '@/lib/navigation-context'
import type { Transaction, Notification, Account, Card as CardType, Profile } from '@/types'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<CardType[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { startNav } = useNavigation()

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { start, end } = getCurrentMonthRange()

    const [profileRes, accountsRes, cardsRes, txRes, notifRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('cards').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('transactions').select('*, category:categories(*)')
        .eq('user_id', user.id).gte('date', start).lte('date', end)
        .order('date', { ascending: false }).limit(5),
      supabase.from('notifications').select('*')
        .eq('user_id', user.id).eq('is_read', false).limit(5),
    ])

    setProfile(profileRes.data)
    setAccounts(accountsRes.data ?? [])
    setCards(cardsRes.data ?? [])
    setTransactions(txRes.data ?? [])
    setNotifications(notifRes.data ?? [])
    setLoading(false)
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const monthIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  if (loading) {
    return (
      <div className="flex flex-col gap-0 page-enter">
        {/* Header skeleton */}
        <div className="hk-gradient px-4 pt-12 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-2">
              <div className="skeleton-white h-3 w-24 rounded-full" />
              <div className="skeleton-white h-6 w-32 rounded-full" />
            </div>
            <div className="skeleton-white w-10 h-10 rounded-full" />
          </div>
          <div className="skeleton-white h-10 w-48 rounded-xl mb-6" />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="skeleton-white h-3 w-16 rounded-full mb-2" />
              <div className="skeleton-white h-5 w-24 rounded-full" />
            </div>
            <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="skeleton-white h-3 w-16 rounded-full mb-2" />
              <div className="skeleton-white h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-4 py-4">
          {/* Cartões skeleton */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-4 w-36 rounded-full" />
              <div className="skeleton h-3 w-14 rounded-full" />
            </div>
            <div className="flex gap-3 overflow-hidden -mx-4 px-4">
              {[1, 2].map(i => (
                <div key={i} className="skeleton rounded-2xl flex-shrink-0" style={{ width: 200, height: 110 }} />
              ))}
            </div>
          </div>

          {/* Contas skeleton */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-4 w-20 rounded-full" />
              <div className="skeleton h-3 w-16 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid #FFE8F1' }}>
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                      <div className="skeleton h-3 w-28 rounded-full" />
                      <div className="skeleton h-2.5 w-20 rounded-full" />
                    </div>
                  </div>
                  <div className="skeleton h-4 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Lançamentos skeleton */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-4 w-40 rounded-full" />
              <div className="skeleton h-3 w-14 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.45)', border: '1px solid #FFE8F1' }}>
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                      <div className="skeleton h-3 w-32 rounded-full" />
                      <div className="skeleton h-2.5 w-24 rounded-full" />
                    </div>
                  </div>
                  <div className="skeleton h-4 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const firstName = profile?.name?.split(' ')[0] ?? 'Princesa'

  return (
    <div className="flex flex-col gap-0 page-enter">
      {/* Header banner */}
      <div className="hk-gradient px-4 pt-12 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 text-8xl opacity-10 pointer-events-none select-none" style={{ transform: 'translate(10%, -10%)' }}>🎀</div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm">Olá, {firstName}! 🎀</p>
              <h2 className="text-white font-bold text-2xl leading-tight">Saldo total</h2>
            </div>
            <Link href="/notifications" onClick={startNav} className="hk-pressable">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bell size={20} color="white" />
                </div>
                {notifications.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-white">
                    {notifications.length}
                  </div>
                )}
              </div>
            </Link>
          </div>

          <p className="text-white font-bold" style={{ fontSize: 36, lineHeight: 1 }}>
            {formatCurrency(totalBalance)}
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} color="white" />
              <span className="text-white/80 text-xs">Receitas</span>
            </div>
            <p className="text-white font-bold text-base">{formatCurrency(monthIncome)}</p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} color="white" />
              <span className="text-white/80 text-xs">Gastos</span>
            </div>
            <p className="text-white font-bold text-base">{formatCurrency(monthExpense)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Cards section */}
        {cards.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base" style={{ color: '#3d1a2e' }}>Cartões de crédito</h3>
              <Link href="/cards" onClick={startNav} className="hk-pressable text-sm" style={{ color: '#FF6B9D' }}>Ver todos</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {cards.map(card => (
                <Link key={card.id} href={`/cards/${card.id}`} onClick={startNav} className="hk-pressable">
                  <div
                    className="rounded-2xl p-4 flex-shrink-0"
                    style={{ width: 200, background: card.color || 'linear-gradient(135deg, #FF6B9D, #FF4D8D)', minHeight: 110 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <CreditCard size={18} color="white" />
                      <span className="text-white/80 text-xs">{card.brand.toUpperCase()}</span>
                    </div>
                    <p className="text-white text-xs opacity-80">{card.name}</p>
                    <p className="text-white font-bold text-lg">{formatCurrency(card.current_balance)}</p>
                    <p className="text-white/60 text-xs">de {formatCurrency(card.limit_amount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Accounts */}
        {accounts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base" style={{ color: '#3d1a2e' }}>Contas</h3>
              <Link href="/accounts" onClick={startNav} className="hk-pressable text-sm" style={{ color: '#FF6B9D' }}>Ver todas</Link>
            </div>
            <div className="flex flex-col gap-2">
              {accounts.slice(0, 3).map(account => (
                <Link key={account.id} href={`/accounts/${account.id}`} onClick={startNav} className="hk-pressable block">
                  <div
                    className="rounded-2xl p-4 flex items-center justify-between"
                    style={{ background: '#FFFFFF', border: '1px solid #FFE8F1' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: account.color + '20' }}>
                        <Wallet size={18} style={{ color: account.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#3d1a2e' }}>{account.name}</p>
                        <p className="text-xs" style={{ color: '#8B6B7A' }}>{account.bank_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: '#3d1a2e' }}>{formatCurrency(account.balance)}</p>
                      <ChevronRight size={14} style={{ color: '#C4A0B0', marginLeft: 'auto' }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base" style={{ color: '#3d1a2e' }}>Últimos lançamentos</h3>
            <Link href="/transactions" onClick={startNav} className="hk-pressable text-sm" style={{ color: '#FF6B9D' }}>Ver todos</Link>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,232,241,0.6)' }}>
              <p className="text-4xl mb-2">🎀</p>
              <p className="text-sm" style={{ color: '#8B6B7A' }}>Nenhum lançamento este mês</p>
              <Link href="/transactions/new" onClick={startNav} className="hk-pressable text-sm font-semibold" style={{ color: '#FF6B9D' }}>
                Adicionar agora
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="rounded-2xl p-4 flex items-center justify-between"
                  style={{ background: '#FFFFFF', border: '1px solid #FFE8F1' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: tx.type === 'income' ? '#E8F7EF' : '#FFF0F0' }}
                    >
                      {tx.category?.icon ?? '✨'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight" style={{ color: '#3d1a2e' }}>{tx.description}</p>
                      <p className="text-xs" style={{ color: '#8B6B7A' }}>{formatDateShort(tx.date)} · {tx.category?.name}</p>
                    </div>
                  </div>
                  <p
                    className="font-bold text-sm"
                    style={{ color: tx.type === 'income' ? '#4CAF82' : '#FF6B6B' }}
                  >
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty state for new users */}
        {accounts.length === 0 && cards.length === 0 && (
          <Card
            style={{ borderRadius: 20, border: '1.5px solid rgba(255,232,241,0.6)', background: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <div className="text-center py-4">
              <p className="text-5xl mb-3">🎀</p>
              <p className="font-bold text-base mb-1" style={{ color: '#3d1a2e' }}>Bem-vinda ao HK Finance!</p>
              <p className="text-sm mb-4" style={{ color: '#8B6B7A' }}>Comece cadastrando uma conta ou cartão para organizar suas finanças com estilo 💕</p>
              <div className="flex gap-2 justify-center">
                <Link href="/accounts">
                  <button
                    className="px-5 py-2 rounded-full text-sm font-semibold"
                    style={{ background: '#FF6B9D', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    + Conta
                  </button>
                </Link>
                <Link href="/cards">
                  <button
                    className="px-5 py-2 rounded-full text-sm font-semibold"
                    style={{ background: 'white', color: '#FF6B9D', border: '1.5px solid #FF6B9D', cursor: 'pointer' }}
                  >
                    + Cartão
                  </button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>

    </div>
  )
}
