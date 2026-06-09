-- ============================================================
-- Hello Kitty Finance — Supabase Schema (completo e atualizado)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null unique,
  name           text not null,
  avatar_url     text,
  birth_date     date,
  zip_code       text,
  street         text,
  street_number  text,
  complement     text,
  neighborhood   text,
  city           text,
  state_uf       char(2),
  marital_status text check (marital_status in ('single', 'married', 'divorced', 'widowed', 'union')),
  bio            text,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = user_id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = user_id);

-- ============================================================
-- ACCOUNTS
-- ============================================================
create table if not exists accounts (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  bank_name  text not null,
  bank_logo  text,
  type       text not null default 'checking' check (type in ('checking', 'savings', 'investment', 'cash')),
  balance    decimal(15,2) not null default 0,
  color      text not null default '#FF6B9D',
  is_active  boolean not null default true,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table accounts enable row level security;
create policy "Users can manage own accounts"
  on accounts for all using (auth.uid() = user_id);

-- ============================================================
-- CARDS
-- ============================================================
create table if not exists cards (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid references auth.users(id) on delete cascade not null,
  account_id       uuid references accounts(id) on delete set null,
  name             text not null,
  bank_name        text not null,
  brand            text not null default 'visa' check (brand in ('visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other')),
  limit_amount     decimal(15,2) not null default 0,
  current_balance  decimal(15,2) not null default 0,
  closing_day      integer not null check (closing_day between 1 and 31),
  due_day          integer not null check (due_day between 1 and 31),
  color            text not null default '#FF6B9D',
  last_four_digits char(4),
  is_active        boolean not null default true,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null
);

alter table cards enable row level security;
create policy "Users can manage own cards"
  on cards for all using (auth.uid() = user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade,
  name       text not null,
  icon       text not null default '🛍️',
  color      text not null default '#FF6B9D',
  type       text not null default 'both' check (type in ('income', 'expense', 'both')),
  is_default boolean not null default false,
  created_at timestamptz default now() not null
);

alter table categories enable row level security;

create policy "Users can view default and own categories"
  on categories for select
  using (is_default = true or auth.uid() = user_id);
create policy "Users can manage own categories"
  on categories for insert with check (auth.uid() = user_id and is_default = false);
create policy "Users can update own categories"
  on categories for update using (auth.uid() = user_id and is_default = false);
create policy "Users can delete own categories"
  on categories for delete using (auth.uid() = user_id and is_default = false);

-- ============================================================
-- DEFAULT CATEGORIES (seed)
-- ============================================================
insert into categories (name, icon, color, type, is_default) values
  ('Alimentação',   '🍽️', '#FF6B6B', 'expense', true),
  ('Beleza',        '💅', '#FF6B9D', 'expense', true),
  ('Compras',       '🛍️', '#FF9EC4', 'expense', true),
  ('Transporte',    '🚗', '#FFD166', 'expense', true),
  ('Saúde',         '💊', '#06D6A0', 'expense', true),
  ('Lazer',         '🎉', '#118AB2', 'expense', true),
  ('Moradia',       '🏠', '#9B59B6', 'expense', true),
  ('Educação',      '📚', '#3498DB', 'expense', true),
  ('Pets',          '🐾', '#E67E22', 'expense', true),
  ('Viagem',        '✈️', '#1ABC9C', 'expense', true),
  ('Streaming',     '🎬', '#E74C3C', 'expense', true),
  ('Academia',      '💪', '#F39C12', 'expense', true),
  ('Salário',       '💰', '#4CAF82', 'income',  true),
  ('Freelance',     '💻', '#52C41A', 'income',  true),
  ('Investimentos', '📈', '#13C2C2', 'income',  true),
  ('Presente',      '🎁', '#EB2F96', 'income',  true),
  ('Outros',        '✨', '#8B6B7A', 'both',    true)
on conflict do nothing;

-- ============================================================
-- DEBTS
-- ============================================================
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
create policy "Users can manage own debts"
  on debts for all using (auth.uid() = user_id);

create index if not exists idx_debts_user_status on debts(user_id, status);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
create table if not exists transactions (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid references auth.users(id) on delete cascade not null,
  account_id            uuid references accounts(id) on delete set null,
  card_id               uuid references cards(id) on delete set null,
  category_id           uuid references categories(id) on delete restrict not null,
  debt_id               uuid references debts(id) on delete set null,
  type                  text not null check (type in ('income', 'expense', 'debt_payment', 'transfer')),
  amount                decimal(15,2) not null check (amount > 0),
  description           text not null,
  date                  date not null default current_date,
  is_installment        boolean not null default false,
  installment_total     integer check (installment_total > 0),
  installment_current   integer check (installment_current > 0),
  installment_group_id  uuid,
  is_recurring          boolean not null default false,
  recurrence_frequency  text check (recurrence_frequency in ('weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'yearly')),
  recurrence_next_date  date,
  recurrence_origin_id  uuid references transactions(id) on delete set null,
  transfer_peer_id      uuid references transactions(id) on delete set null,
  is_paid               boolean not null default false,
  paid_at               date,
  notes                 text,
  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

alter table transactions enable row level security;
create policy "Users can manage own transactions"
  on transactions for all using (auth.uid() = user_id);

create index if not exists idx_transactions_user_date         on transactions(user_id, date desc);
create index if not exists idx_transactions_user_card         on transactions(user_id, card_id);
create index if not exists idx_transactions_user_account      on transactions(user_id, account_id);
create index if not exists idx_transactions_installment_group on transactions(installment_group_id);
create index if not exists idx_transactions_recurrence_origin on transactions(recurrence_origin_id);
create index if not exists idx_transactions_debt              on transactions(debt_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  title          text not null,
  message        text not null,
  type           text not null default 'info' check (type in ('due_soon', 'overdue', 'info', 'success')),
  is_read        boolean not null default false,
  reference_id   uuid,
  reference_type text check (reference_type in ('card', 'transaction', 'installment', 'debt')),
  scheduled_for  timestamptz,
  created_at     timestamptz default now() not null
);

alter table notifications enable row level security;
create policy "Users can manage own notifications"
  on notifications for all using (auth.uid() = user_id);

create index if not exists idx_notifications_user_unread on notifications(user_id, is_read, created_at desc);

-- ============================================================
-- STORAGE: avatars bucket
-- Executar manualmente no Supabase Dashboard > Storage > New bucket
--   name: avatars, public: true
-- Ou via SQL (requer extensão storage habilitada):
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
-- create policy "Users can upload own avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Avatar images are publicly readable" on storage.objects for select using (bucket_id = 'avatars');
-- create policy "Users can update own avatar" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
-- ============================================================

-- ============================================================
-- TRIGGER: auto-create profile after signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at     before update on profiles     for each row execute function update_updated_at();
create trigger update_accounts_updated_at     before update on accounts     for each row execute function update_updated_at();
create trigger update_cards_updated_at        before update on cards        for each row execute function update_updated_at();
create trigger update_debts_updated_at        before update on debts        for each row execute function update_updated_at();
create trigger update_transactions_updated_at before update on transactions for each row execute function update_updated_at();
