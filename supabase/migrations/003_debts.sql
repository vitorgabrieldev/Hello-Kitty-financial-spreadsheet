-- ============================================================
-- Hello Kitty Finance — Migration 003: Debts
-- ============================================================

-- Tabela de dívidas
create table if not exists debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  creditor text not null,
  total_amount decimal(15,2) not null check (total_amount > 0),
  paid_amount decimal(15,2) not null default 0 check (paid_amount >= 0),
  installment_total integer check (installment_total > 0),
  installment_amount decimal(15,2) check (installment_amount > 0),
  due_date date,
  color text not null default '#FF6B6B',
  status text not null default 'active' check (status in ('active', 'paid')),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table debts enable row level security;

create policy "Users can manage own debts"
  on debts for all using (auth.uid() = user_id);

create index idx_debts_user_status on debts(user_id, status);

-- Adiciona coluna debt_id em transactions para pagamentos de dívida
alter table transactions
  add column if not exists debt_id uuid references debts(id) on delete set null;

-- Adiciona tipo debt_payment ao check de type
alter table transactions
  drop constraint if exists transactions_type_check;

alter table transactions
  add constraint transactions_type_check
  check (type in ('income', 'expense', 'debt_payment'));

-- Trigger updated_at para debts
create trigger update_debts_updated_at before update on debts
  for each row execute function update_updated_at();
