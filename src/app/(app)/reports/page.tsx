'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import PageHeader from '@/components/ui/PageHeader'

dayjs.locale('pt-br')

interface CategoryTotal {
  id: string
  name: string
  icon: string
  color: string
  total: number
  count: number
  percent: number
}

export default function ReportsPage() {
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [loading, setLoading] = useState(true)
  const [expenseByCategory, setExpenseByCategory] = useState<CategoryTotal[]>([])
  const [incomeByCategory, setIncomeByCategory] = useState<CategoryTotal[]>([])
  const [totalExpense, setTotalExpense] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [tab, setTab] = useState<'expense' | 'income'>('expense')

  useEffect(() => { load() }, [currentMonth])

  async function load() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const start = currentMonth.startOf('month').format('YYYY-MM-DD')
    const end = currentMonth.endOf('month').format('YYYY-MM-DD')

    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount, category_id, category:categories(id, name, icon, color)')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .neq('type', 'transfer')

    if (!txs) { setLoading(false); return }

    // agrupar gastos por categoria
    const expMap: Record<string, { name: string; icon: string; color: string; total: number; count: number }> = {}
    const incMap: Record<string, { name: string; icon: string; color: string; total: number; count: number }> = {}

    let sumExp = 0
    let sumInc = 0

    for (const tx of txs) {
      const cat = Array.isArray(tx.category) ? tx.category[0] : tx.category
      const catId = tx.category_id ?? 'sem-categoria'
      const catName = cat?.name ?? 'Sem categoria'
      const catIcon = cat?.icon ?? '❓'
      const catColor = cat?.color ?? '#C4A0B0'

      if (tx.type === 'income') {
        sumInc += tx.amount
        if (!incMap[catId]) incMap[catId] = { name: catName, icon: catIcon, color: catColor, total: 0, count: 0 }
        incMap[catId].total += tx.amount
        incMap[catId].count += 1
      } else {
        sumExp += tx.amount
        if (!expMap[catId]) expMap[catId] = { name: catName, icon: catIcon, color: catColor, total: 0, count: 0 }
        expMap[catId].total += tx.amount
        expMap[catId].count += 1
      }
    }

    const toList = (map: typeof expMap, sum: number): CategoryTotal[] =>
      Object.entries(map)
        .map(([id, v]) => ({ id, ...v, percent: sum > 0 ? (v.total / sum) * 100 : 0 }))
        .sort((a, b) => b.total - a.total)

    setExpenseByCategory(toList(expMap, sumExp))
    setIncomeByCategory(toList(incMap, sumInc))
    setTotalExpense(sumExp)
    setTotalIncome(sumInc)
    setLoading(false)
  }

  const list = tab === 'expense' ? expenseByCategory : incomeByCategory
  const total = tab === 'expense' ? totalExpense : totalIncome

  // top 5 cores para a barra empilhada
  const BAR_COLORS = ['#FF6B9D', '#9B59B6', '#3498DB', '#F39C12', '#2ECC71', '#E74C3C', '#1ABC9C', '#FF6B6B']

  return (
    <div className="page-enter">
      <PageHeader title="Relatórios" />

      {/* Month navigation */}
      <div className="px-4 py-2 flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(m => m.subtract(1, 'month'))}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,107,157,0.08)', border: 'none', cursor: 'pointer' }}
        >
          <ChevronLeft size={18} style={{ color: '#FF6B9D' }} />
        </button>
        <p className="font-bold text-sm capitalize" style={{ color: '#3d1a2e' }}>
          {currentMonth.format('MMMM [de] YYYY')}
        </p>
        <button
          onClick={() => setCurrentMonth(m => m.add(1, 'month'))}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,107,157,0.08)', border: 'none', cursor: 'pointer' }}
        >
          <ChevronRight size={18} style={{ color: '#FF6B9D' }} />
        </button>
      </div>

      {/* Tab */}
      <div className="px-4 pb-3">
        <div style={{ display: 'flex', background: '#FFE8F1', borderRadius: 16, padding: 4, gap: 4 }}>
          <button
            onClick={() => setTab('expense')}
            style={{
              flex: 1, height: 40, borderRadius: 12,
              background: tab === 'expense' ? '#FF6B6B' : 'transparent',
              color: tab === 'expense' ? 'white' : '#8B6B7A',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              transition: 'all 0.18s ease',
            }}
          >
            💸 Gastos
          </button>
          <button
            onClick={() => setTab('income')}
            style={{
              flex: 1, height: 40, borderRadius: 12,
              background: tab === 'income' ? '#4CAF82' : 'transparent',
              color: tab === 'income' ? 'white' : '#8B6B7A',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              transition: 'all 0.18s ease',
            }}
          >
            💰 Receitas
          </button>
        </div>
      </div>

      <div className="px-4 pb-24 flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 64, borderRadius: 16, background: '#FFE8F1', animation: 'pulse 1.5s infinite' }} />
          ))
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-5xl mb-3">🎀</span>
            <p className="font-semibold text-sm" style={{ color: '#3d1a2e' }}>Sem lançamentos este mês</p>
          </div>
        ) : (
          <>
            {/* Total */}
            <div style={{ background: tab === 'expense' ? '#FFF0F0' : '#E8F7EF', border: `1px solid ${tab === 'expense' ? '#FFCACA' : '#B2E4CC'}`, borderRadius: 16, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#8B6B7A' }}>Total no mês</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: tab === 'expense' ? '#C0392B' : '#2D7A52' }}>
                {tab === 'expense' ? '-' : '+'}{formatCurrency(total)}
              </span>
            </div>

            {/* Barra empilhada */}
            {list.length > 0 && (
              <div style={{ borderRadius: 12, overflow: 'hidden', height: 14, display: 'flex', gap: 1 }}>
                {list.slice(0, 8).map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      height: '100%',
                      width: `${item.percent}%`,
                      background: BAR_COLORS[i % BAR_COLORS.length],
                      minWidth: item.percent > 0 ? 4 : 0,
                      transition: 'width 0.4s ease',
                    }}
                  />
                ))}
              </div>
            )}

            {/* Lista por categoria */}
            {list.map((item, i) => (
              <div
                key={item.id}
                style={{ background: 'white', border: '1px solid #FFE8F1', borderRadius: 16, overflow: 'hidden' }}
              >
                {/* barra de cor no topo */}
                <div style={{ height: 3, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: `${BAR_COLORS[i % BAR_COLORS.length]}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: '#3d1a2e', margin: 0 }}>{item.name}</p>
                        <p style={{ fontWeight: 800, fontSize: 15, color: tab === 'expense' ? '#C0392B' : '#2D7A52', margin: 0 }}>
                          {tab === 'expense' ? '-' : '+'}{formatCurrency(item.total)}
                        </p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                        <p style={{ fontSize: 12, color: '#8B6B7A', margin: 0 }}>{item.count} lançamento{item.count !== 1 ? 's' : ''}</p>
                        <p style={{ fontSize: 12, color: '#C4A0B0', margin: 0 }}>{item.percent.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                  {/* barra de progresso da categoria */}
                  <div style={{ height: 5, borderRadius: 99, background: '#FFE8F1', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: BAR_COLORS[i % BAR_COLORS.length],
                      width: `${item.percent}%`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
