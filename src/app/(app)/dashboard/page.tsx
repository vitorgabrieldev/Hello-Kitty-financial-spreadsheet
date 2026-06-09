'use client'

import { useCallback, useEffect, useState } from 'react'
import { App, Card } from 'antd'
import { TrendingUp, TrendingDown, Wallet, Bell, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDateShort, getCurrentMonthRange } from '@/lib/utils'
import { useNavigation } from '@/lib/navigation-context'
import { useTheme } from '@/lib/theme-context'
import { useUser } from '@/lib/user-context'
import PullToRefresh from '@/components/ui/PullToRefresh'
import type { Transaction, Notification, Account, Card as CardType, Profile, Debt } from '@/types'

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<CardType[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [allMonthTx, setAllMonthTx] = useState<{ type: string; amount: number; is_paid: boolean }[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const { startNav } = useNavigation()
  const { theme } = useTheme()
  const { user } = useUser()
  const { message } = App.useApp()

  const loadDashboard = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { start, end } = getCurrentMonthRange()

    const [profileRes, accountsRes, cardsRes, allTxRes, recentTxRes, notifRes, debtsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      supabase.from('accounts').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('cards').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('transactions').select('type, amount, is_paid')
        .eq('user_id', user.id).gte('date', start).lte('date', end),
      supabase.from('transactions').select('*, category:categories(*)')
        .eq('user_id', user.id).gte('date', start).lte('date', end)
        .order('date', { ascending: false }).limit(5),
      supabase.from('notifications').select('*')
        .eq('user_id', user.id).eq('is_read', false).limit(5),
      supabase.from('debts').select('*').eq('user_id', user.id).eq('status', 'active').order('due_date', { ascending: true }),
    ])

    if (accountsRes.error) message.error('Erro ao carregar contas')
    if (cardsRes.error) message.error('Erro ao carregar cartões')
    if (allTxRes.error || recentTxRes.error) message.error('Erro ao carregar transações')

    setProfile(profileRes.data)
    setAccounts(accountsRes.data ?? [])
    setCards(cardsRes.data ?? [])
    setAllMonthTx(allTxRes.data ?? [])
    setTransactions(recentTxRes.data ?? [])
    setNotifications(notifRes.data ?? [])
    setDebts(debtsRes.data ?? [])
    setLoading(false)
  }, [user, message])

  useEffect(() => {
    if (user) loadDashboard()
  }, [user, loadDashboard])

  const totalBalance     = accounts.reduce((s, a) => s + a.balance, 0)
  const totalDebt        = debts.reduce((s, d) => s + (d.total_amount - d.paid_amount), 0)
  const netWorth         = totalBalance - totalDebt
  // usa allMonthTx para cálculos precisos (sem limit) — exclui transfer (não é gasto real)
  const monthIncome    = allMonthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpense   = allMonthTx.filter(t => t.type === 'expense' || t.type === 'debt_payment').reduce((s, t) => s + t.amount, 0)
  const monthPaid      = allMonthTx.filter(t => (t.type === 'expense' || t.type === 'debt_payment') && t.is_paid).reduce((s, t) => s + t.amount, 0)
  const monthPending   = allMonthTx.filter(t => (t.type === 'expense' || t.type === 'debt_payment') && !t.is_paid).reduce((s, t) => s + t.amount, 0)
  const monthBalance   = monthIncome - monthExpense

  const glassCard = {
    background: theme.hasBow ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.12)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: `1px solid ${theme.hasBow ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)'}`,
  }
  const innerDivider = theme.hasBow ? '1px solid #FFE8F1' : '1px solid rgba(255,255,255,0.15)'
  const progressTrack = theme.hasBow ? '#FFE8F1' : 'rgba(255,255,255,0.2)'

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
                <div key={i} className="skeleton rounded-2xl flex-shrink-0" style={{ width: 212, height: 132 }} />
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
                <div key={i} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.45)', border: innerDivider }}>
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
                <div key={i} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.45)', border: innerDivider }}>
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
    <PullToRefresh onRefresh={loadDashboard}>
    <div className="flex flex-col gap-0 page-enter">
      {/* Header banner */}
      <div className="hk-gradient px-4 pt-12 pb-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div style={{ position: 'absolute', right: -70, top: -70, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: -50, bottom: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 60, bottom: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        {/* Shine overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <div className="absolute top-0 right-0 text-8xl opacity-10 pointer-events-none select-none" style={{ transform: 'translate(10%, -10%)' }}>{theme.emoji}</div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm">Olá, {firstName}!{theme.hasBow ? ' 🎀' : ''}</p>
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

          {/* Net worth row — only shown when there are debts */}
          {debts.length > 0 && (
            <div style={{
              marginTop: 10,
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.15)', borderRadius: 20,
              padding: '5px 14px',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                Patrimônio líquido
              </span>
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: netWorth >= 0 ? '#A8F5C8' : '#FFB3B3',
              }}>
                {netWorth >= 0 ? '' : '−'}{formatCurrency(Math.abs(netWorth))}
              </span>
            </div>
          )}
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
              <h3 className="font-bold text-base" style={{ color: 'var(--on-bg)' }}>Cartões de crédito</h3>
              <Link href="/cards" onClick={startNav} className="hk-pressable text-sm" style={{ color: 'var(--on-bg)' }}>Ver todos</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar">
              {cards.map(card => {
                const brandLabel: Record<string, string> = { visa: 'VISA', mastercard: 'MC', elo: 'elo', amex: 'AMEX', hipercard: 'HIPER', other: '•••' }
                const isVisa = card.brand === 'visa'
                return (
                  <Link key={card.id} href={`/cards/${card.id}`} onClick={startNav} className="hk-pressable flex-shrink-0" style={{ display: 'block' }}>
                    <div
                      className="rounded-2xl relative overflow-hidden"
                      style={{
                        width: 212, height: 132,
                        background: card.color || '#FF6B9D',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
                      }}
                    >
                      {/* Decorative circles */}
                      <div style={{ position: 'absolute', right: -35, top: -35, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', right: -60, bottom: -25, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
                      {/* Shine overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)', pointerEvents: 'none' }} />
                      {/* Watermark */}
                      <div style={{ position: 'absolute', bottom: -6, right: -2, fontSize: 60, opacity: 0.10, pointerEvents: 'none', lineHeight: 1 }}>{theme.emoji}</div>

                      <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                        {/* Chip + brand */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {/* Gold chip */}
                          <div style={{
                            width: 30, height: 22, borderRadius: 4,
                            background: 'linear-gradient(135deg, #F5E642 0%, #D4941A 50%, #F5D742 100%)',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.28)',
                            display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
                            gap: 2, padding: 4,
                          }}>
                            {[0, 1, 2, 3].map(i => (
                              <div key={i} style={{ background: 'rgba(0,0,0,0.16)', borderRadius: 1 }} />
                            ))}
                          </div>
                          {/* Brand badge */}
                          <div style={{
                            background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                            borderRadius: 6, padding: '3px 9px',
                            fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.95)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            letterSpacing: isVisa ? 1.5 : 0, fontStyle: isVisa ? 'italic' : 'normal',
                          }}>
                            {brandLabel[card.brand] ?? card.brand.toUpperCase()}
                          </div>
                        </div>

                        {/* Card number */}
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, letterSpacing: 3, fontFamily: 'monospace', margin: 0 }}>
                          {card.last_four_digits ? `•••• ${card.last_four_digits}` : '•••• ••••'}
                        </p>

                        {/* Bottom: name + fatura */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>{card.name}</p>
                            <p style={{ color: 'white', fontWeight: 800, fontSize: 16, margin: 0, lineHeight: 1 }}>{formatCurrency(card.current_balance)}</p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Limite</p>
                            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 700, margin: 0 }}>{formatCurrency(card.limit_amount)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Monthly summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base" style={{ color: 'var(--on-bg)' }}>Resumo do mês</h3>
            <Link href="/transactions" onClick={startNav} className="hk-pressable text-sm" style={{ color: 'var(--on-bg)' }}>Ver tudo</Link>
          </div>
          <div style={{ ...glassCard, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
            {/* Decorative circle */}
            <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'var(--primary-pale)', opacity: 0.5, pointerEvents: 'none' }} />
            {/* Saldo previsto */}
            <div style={{ padding: '14px 16px', borderBottom: innerDivider, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--on-bg-sub)', margin: 0 }}>Saldo do mês</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: monthBalance >= 0 ? '#4CAF82' : '#FF6B6B', margin: 0 }}>
                  {monthBalance >= 0 ? '+' : ''}{formatCurrency(monthBalance)}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, color: 'var(--on-bg-sub)', margin: 0 }}>Receitas − Gastos</p>
                <p style={{ fontSize: 12, color: 'var(--on-bg)', fontWeight: 600, margin: 0 }}>
                  {formatCurrency(monthIncome)} − {formatCurrency(monthExpense)}
                </p>
              </div>
            </div>
            {/* Pago vs Pendente */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '12px 16px', borderRight: innerDivider }}>
                <p style={{ fontSize: 11, color: 'var(--on-bg-sub)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Pago</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#4CAF82', margin: 0 }}>{formatCurrency(monthPaid)}</p>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: 11, color: 'var(--on-bg-sub)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600 }}>Pendente</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: monthPending > 0 ? '#F39C12' : 'var(--on-bg-sub)', margin: 0 }}>{formatCurrency(monthPending)}</p>
              </div>
            </div>
            {/* Barra de progresso de gastos pagos */}
            {monthExpense > 0 && (
              <div style={{ padding: '0 16px 14px' }}>
                <div style={{ height: 6, borderRadius: 99, background: progressTrack, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, background: '#4CAF82',
                    width: `${Math.min((monthPaid / monthExpense) * 100, 100)}%`,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--on-bg-sub)', margin: '4px 0 0', textAlign: 'right' }}>
                  {Math.round((monthPaid / monthExpense) * 100)}% dos gastos pagos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Debts */}
        {debts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base" style={{ color: 'var(--on-bg)' }}>Dívidas ativas</h3>
              <Link href="/debts" onClick={startNav} className="hk-pressable text-sm" style={{ color: 'var(--on-bg)' }}>Ver todas</Link>
            </div>
            <div style={{ ...glassCard, borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: -30, bottom: -30, width: 130, height: 130, borderRadius: '50%', background: 'var(--primary-pale)', opacity: 0.5, pointerEvents: 'none' }} />
              {debts.slice(0, 3).map((debt, i) => {
                const remaining = debt.total_amount - debt.paid_amount
                const progress = Math.min((debt.paid_amount / debt.total_amount) * 100, 100)
                return (
                  <div key={debt.id} style={{ padding: '12px 16px', borderBottom: i < Math.min(debts.length, 3) - 1 ? innerDivider : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: debt.color || '#9B59B6', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-bg)' }}>{debt.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#FF6B6B' }}>{formatCurrency(remaining)}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: progressTrack, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: debt.color || '#9B59B6', width: `${progress}%`, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
              {debts.length > 3 && (
                <div style={{ padding: '10px 16px', textAlign: 'center', borderTop: innerDivider }}>
                  <Link href="/debts" onClick={startNav} style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                    +{debts.length - 3} dívida{debts.length - 3 > 1 ? 's' : ''} a mais
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Accounts */}
        {accounts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base" style={{ color: 'var(--on-bg)' }}>Contas</h3>
              <Link href="/accounts" onClick={startNav} className="hk-pressable text-sm" style={{ color: 'var(--on-bg)' }}>Ver todas</Link>
            </div>
            <div className="flex flex-col gap-2">
              {accounts.slice(0, 3).map(account => (
                <Link key={account.id} href={`/accounts/${account.id}`} onClick={startNav} className="hk-pressable block">
                  <div
                    className="rounded-2xl p-4 flex items-center justify-between"
                    style={{ ...glassCard, position: 'relative', overflow: 'hidden' }}
                  >
                    <div style={{ position: 'absolute', right: -20, top: -20, width: 80, height: 80, borderRadius: '50%', background: account.color + '18', pointerEvents: 'none' }} />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: account.color + '20' }}>
                        <Wallet size={18} style={{ color: account.color }} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--on-bg)' }}>{account.name}</p>
                        <p className="text-xs" style={{ color: 'var(--on-bg-sub)' }}>{account.bank_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: 'var(--on-bg)' }}>{formatCurrency(account.balance)}</p>
                      <ChevronRight size={14} style={{ color: 'var(--on-bg-sub)', marginLeft: 'auto' }} />
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
            <h3 className="font-bold text-base" style={{ color: 'var(--on-bg)' }}>Últimos lançamentos</h3>
            <Link href="/transactions" onClick={startNav} className="hk-pressable text-sm" style={{ color: 'var(--on-bg)' }}>Ver todos</Link>
          </div>

          {transactions.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ ...glassCard }}>
              <p className="text-4xl mb-2">{theme.hasBow ? '🎀' : '📭'}</p>
              <p className="text-sm" style={{ color: 'var(--on-bg-sub)' }}>Nenhum lançamento este mês</p>
              <Link href="/transactions/new" onClick={startNav} className="hk-pressable text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                Adicionar agora
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="rounded-2xl p-4 flex items-center justify-between"
                  style={{ ...glassCard, position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', right: -16, bottom: -16, width: 70, height: 70, borderRadius: '50%', background: tx.type === 'income' ? '#E8F7EF' : tx.type === 'transfer' ? '#EBF5FF' : '#FFF0F0', opacity: 0.7, pointerEvents: 'none' }} />
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ background: tx.type === 'income' ? '#E8F7EF' : tx.type === 'transfer' ? '#EBF5FF' : '#FFF0F0' }}
                    >
                      {tx.type === 'transfer' ? '↔️' : (tx.category?.icon ?? '✨')}
                    </div>
                    <div>
                      <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--on-bg)' }}>{tx.description}</p>
                      <p className="text-xs" style={{ color: 'var(--on-bg-sub)' }}>
                        {formatDateShort(tx.date)} · {tx.type === 'transfer' ? 'Transferência' : tx.category?.name}
                      </p>
                    </div>
                  </div>
                  <p
                    className="font-bold text-sm"
                    style={{ color: tx.type === 'income' ? '#4CAF82' : tx.type === 'transfer' ? '#3498DB' : '#FF6B6B' }}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'transfer' ? '' : '-'}{formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty state for new users */}
        {accounts.length === 0 && cards.length === 0 && (
          <Card
            style={{ borderRadius: 20, ...glassCard }}
          >
            <div className="text-center py-4">
              <p className="text-5xl mb-3">{theme.hasBow ? '🎀' : theme.emoji}</p>
              <p className="font-bold text-base mb-1" style={{ color: 'var(--on-bg)' }}>Bem-vindo(a) ao app!</p>
              <p className="text-sm mb-4" style={{ color: 'var(--on-bg-sub)' }}>Comece cadastrando uma conta ou cartão para organizar suas finanças com estilo 💕</p>
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
    </PullToRefresh>
  )
}
