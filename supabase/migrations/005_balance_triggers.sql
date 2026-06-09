-- ============================================================
-- 005_balance_triggers.sql
-- Saldo automático de contas + fatura automática de cartões
-- + tipo "transfer" para transferências entre contas
-- ============================================================

-- 1. Adiciona tipo transfer nas transações
alter table transactions
  drop constraint if exists transactions_type_check;

alter table transactions
  add constraint transactions_type_check
  check (type in ('income', 'expense', 'debt_payment', 'transfer'));

-- 2. Coluna para guardar a transação espelho numa transferência
alter table transactions
  add column if not exists transfer_peer_id uuid references transactions(id) on delete set null;

-- ============================================================
-- TRIGGER: atualiza accounts.balance automaticamente
-- Regra:
--   income     → +amount
--   expense    → -amount
--   debt_payment → -amount
--   transfer   → depende do sinal (gerenciado pela app)
-- ============================================================

create or replace function fn_update_account_balance()
returns trigger language plpgsql as $$
declare
  v_delta numeric;
begin
  -- Calcula o delta para o event
  if TG_OP = 'DELETE' then
    -- Reverte o efeito da linha removida
    if OLD.account_id is null then return OLD; end if;
    v_delta := case OLD.type
      when 'income'   then -OLD.amount
      else                  OLD.amount   -- expense / debt_payment / transfer saída
    end;
    update accounts set balance = balance + v_delta where id = OLD.account_id;
    return OLD;
  end if;

  -- INSERT ou UPDATE
  -- Para UPDATE: primeiro reverte o efeito antigo se mudou account_id ou amount/type
  if TG_OP = 'UPDATE' then
    if OLD.account_id is not null and (
      OLD.account_id <> coalesce(NEW.account_id, '00000000-0000-0000-0000-000000000000'::uuid) or
      OLD.amount     <> NEW.amount or
      OLD.type       <> NEW.type
    ) then
      v_delta := case OLD.type
        when 'income' then -OLD.amount
        else               OLD.amount
      end;
      update accounts set balance = balance + v_delta where id = OLD.account_id;
    end if;
  end if;

  -- Aplica o efeito novo
  if NEW.account_id is null then return NEW; end if;
  v_delta := case NEW.type
    when 'income' then  NEW.amount
    else               -NEW.amount
  end;
  update accounts set balance = balance + v_delta where id = NEW.account_id;
  return NEW;
end;
$$;

drop trigger if exists trg_account_balance on transactions;
create trigger trg_account_balance
  after insert or update or delete on transactions
  for each row execute function fn_update_account_balance();

-- ============================================================
-- TRIGGER: atualiza cards.current_balance automaticamente
-- Apenas transações com card_id e type = 'expense'
-- ============================================================

create or replace function fn_update_card_balance()
returns trigger language plpgsql as $$
declare
  v_delta numeric;
begin
  if TG_OP = 'DELETE' then
    if OLD.card_id is null or OLD.type <> 'expense' then return OLD; end if;
    update cards set current_balance = current_balance - OLD.amount where id = OLD.card_id;
    return OLD;
  end if;

  if TG_OP = 'UPDATE' then
    -- reverte antigo
    if OLD.card_id is not null and OLD.type = 'expense' and (
      OLD.card_id <> coalesce(NEW.card_id, '00000000-0000-0000-0000-000000000000'::uuid) or
      OLD.amount  <> NEW.amount
    ) then
      update cards set current_balance = current_balance - OLD.amount where id = OLD.card_id;
    end if;
  end if;

  -- aplica novo
  if NEW.card_id is null or NEW.type <> 'expense' then return NEW; end if;
  update cards set current_balance = current_balance + NEW.amount where id = NEW.card_id;
  return NEW;
end;
$$;

drop trigger if exists trg_card_balance on transactions;
create trigger trg_card_balance
  after insert or update or delete on transactions
  for each row execute function fn_update_card_balance();

-- ============================================================
-- NOTA: os triggers operam APENAS em novas transações a partir
-- deste momento. O saldo atual das contas/cartões cadastrados
-- antes desta migration reflete o valor digitado manualmente.
-- Para recalcular tudo do zero, rode o script abaixo (opcional):
--
-- update accounts a set balance = (
--   select coalesce(sum(case when t.type='income' then t.amount else -t.amount end), 0)
--   from transactions t where t.account_id = a.id
-- );
--
-- update cards c set current_balance = (
--   select coalesce(sum(t.amount), 0)
--   from transactions t where t.card_id = c.id and t.type = 'expense'
-- );
-- ============================================================
