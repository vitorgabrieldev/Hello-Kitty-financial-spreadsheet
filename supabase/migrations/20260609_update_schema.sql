-- ============================================================
-- Migration: sincroniza banco com o código atual
-- ============================================================

-- 1. profiles: adiciona campos extras
alter table profiles
  add column if not exists birth_date     date,
  add column if not exists zip_code       text,
  add column if not exists street         text,
  add column if not exists street_number  text,
  add column if not exists complement     text,
  add column if not exists neighborhood   text,
  add column if not exists city           text,
  add column if not exists state_uf       char(2),
  add column if not exists marital_status text check (marital_status in ('single', 'married', 'divorced', 'widowed', 'union')),
  add column if not exists bio            text;

-- 2. debts: cria tabela
create table if not exists debts (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  name               text not null,
  creditor           text not null,
  total_amount       decimal(15,2) not null check (total_amount > 0),
  paid_amount        decimal(15,2) not null default 0 check (paid_amount >= 0),
  installment_total  integer check (installment_total > 0),
  installment_amount decimal(15,2) check (installment_amount > 0),
  due_date           date,
  color              text not null default '#FF6B9D',
  status             text not null default 'active' check (status in ('active', 'paid')),
  notes              text,
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null
);

alter table debts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'debts' and policyname = 'Users can manage own debts') then
    create policy "Users can manage own debts" on debts for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_debts_user_status on debts(user_id, status);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_debts_updated_at on debts;
create trigger update_debts_updated_at before update on debts
  for each row execute function update_updated_at();

-- 3. transactions: corrige constraint de tipo e adiciona colunas
alter table transactions
  drop constraint if exists transactions_type_check;

alter table transactions
  add constraint transactions_type_check
  check (type in ('income', 'expense', 'debt_payment', 'transfer'));

alter table transactions
  add column if not exists debt_id              uuid references debts(id) on delete set null,
  add column if not exists transfer_peer_id     uuid references transactions(id) on delete set null,
  add column if not exists recurrence_frequency text check (recurrence_frequency in ('weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'yearly')),
  add column if not exists recurrence_next_date date,
  add column if not exists recurrence_origin_id uuid references transactions(id) on delete set null,
  add column if not exists paid_at              date;

-- 4. notifications: adiciona 'debt' como reference_type
alter table notifications
  drop constraint if exists notifications_reference_type_check;

alter table notifications
  add constraint notifications_reference_type_check
  check (reference_type in ('card', 'transaction', 'installment', 'debt'));

-- 5. indexes extras
create index if not exists idx_transactions_installment_group on transactions(installment_group_id);
create index if not exists idx_transactions_recurrence_origin on transactions(recurrence_origin_id);
create index if not exists idx_transactions_debt              on transactions(debt_id);

-- 6. Storage bucket para avatares (executar se necessário)
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
