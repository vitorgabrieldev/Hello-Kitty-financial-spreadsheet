'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RecurrenceFrequency } from '@/types'

function addFrequency(dateStr: string, freq: RecurrenceFrequency): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  let date = new Date(y, m - 1, d)
  switch (freq) {
    case 'weekly':     date = new Date(y, m - 1, d + 7); break
    case 'biweekly':   date = new Date(y, m - 1, d + 14); break
    case 'monthly':    date = new Date(y, m, d); break
    case 'bimonthly':  date = new Date(y, m + 1, d); break
    case 'quarterly':  date = new Date(y, m + 2, d); break
    case 'yearly':     date = new Date(y + 1, m - 1, d); break
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useRecurring() {
  useEffect(() => {
    const key = 'hk_recurring_checked'
    const today = todayISO()
    if (sessionStorage.getItem(key) === today) return
    sessionStorage.setItem(key, today)
    generateDue()
  }, [])
}

async function generateDue() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const today = todayISO()

  // Busca recorrentes com next_date <= hoje
  const { data: due } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_recurring', true)
    .lte('recurrence_next_date', today)
    .not('recurrence_frequency', 'is', null)

  if (!due || due.length === 0) return

  for (const origin of due) {
    const freq = origin.recurrence_frequency as RecurrenceFrequency
    let nextDate = origin.recurrence_next_date as string

    // Gera todas as ocorrências vencidas até hoje
    while (nextDate <= today) {
      await supabase.from('transactions').insert({
        user_id: origin.user_id,
        type: origin.type,
        amount: origin.amount,
        description: origin.description,
        date: nextDate,
        category_id: origin.category_id,
        account_id: origin.account_id ?? null,
        card_id: origin.card_id ?? null,
        is_installment: false,
        is_recurring: false,
        is_paid: false,
        notes: origin.notes ?? null,
        debt_id: origin.debt_id ?? null,
        recurrence_origin_id: origin.id,
      })
      nextDate = addFrequency(nextDate, freq)
    }

    // Atualiza next_date na origem
    await supabase
      .from('transactions')
      .update({ recurrence_next_date: nextDate })
      .eq('id', origin.id)
  }
}
