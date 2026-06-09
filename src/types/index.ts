export type TransactionType = 'income' | 'expense' | 'debt_payment' | 'transfer'
export type DebtStatus = 'active' | 'paid'

export interface Debt {
  id: string
  user_id: string
  name: string
  creditor: string
  total_amount: number
  paid_amount: number
  installment_total?: number
  installment_amount?: number
  due_date?: string
  color: string
  status: DebtStatus
  notes?: string
  created_at: string
  updated_at: string
}
export type AccountType = 'checking' | 'savings' | 'investment' | 'cash'
export type CardBrand = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'

export interface Profile {
  id: string
  user_id: string
  name: string
  avatar_url?: string
  birth_date?: string
  zip_code?: string
  street?: string
  neighborhood?: string
  city?: string
  state_uf?: string
  street_number?: string
  complement?: string
  marital_status?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  bank_name: string
  bank_logo?: string
  type: AccountType
  balance: number
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  user_id: string
  account_id?: string
  name: string
  bank_name: string
  brand: CardBrand
  limit_amount: number
  current_balance: number
  closing_day: number
  due_day: number
  color: string
  last_four_digits?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id?: string
  name: string
  icon: string
  color: string
  type: TransactionType | 'both'
  is_default: boolean
  created_at: string
}

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly'

export interface Transaction {
  id: string
  user_id: string
  account_id?: string
  card_id?: string
  category_id: string
  type: TransactionType
  amount: number
  description: string
  date: string
  is_installment: boolean
  installment_total?: number
  installment_current?: number
  installment_group_id?: string
  is_recurring: boolean
  recurrence_frequency?: RecurrenceFrequency
  recurrence_next_date?: string
  recurrence_origin_id?: string
  is_paid: boolean
  paid_at?: string
  debt_id?: string
  notes?: string
  created_at: string
  updated_at: string
  category?: Category
  account?: Account
  card?: Card
}

export interface Installment {
  id: string
  transaction_id: string
  installment_number: number
  total_installments: number
  amount: number
  due_date: string
  is_paid: boolean
  paid_at?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'due_soon' | 'overdue' | 'info' | 'success'
  is_read: boolean
  reference_id?: string
  reference_type?: 'card' | 'transaction' | 'installment'
  scheduled_for?: string
  created_at: string
}

export interface DashboardSummary {
  total_balance: number
  monthly_income: number
  monthly_expense: number
  monthly_balance: number
  cards_total_balance: number
}

export type DateRange = {
  start: string
  end: string
}
