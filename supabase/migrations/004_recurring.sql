-- Adiciona suporte a transações recorrentes

alter table transactions
  add column if not exists recurrence_frequency text
    check (recurrence_frequency in ('weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'yearly')),
  add column if not exists recurrence_next_date date,
  add column if not exists recurrence_origin_id uuid references transactions(id) on delete set null,
  add column if not exists paid_at date;
