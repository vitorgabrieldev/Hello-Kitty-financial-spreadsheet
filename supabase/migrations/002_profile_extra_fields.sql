-- Add extra profile fields for the "Editar perfil" drawer
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birth_date     date,
  ADD COLUMN IF NOT EXISTS zip_code       text,
  ADD COLUMN IF NOT EXISTS street         text,
  ADD COLUMN IF NOT EXISTS neighborhood   text,
  ADD COLUMN IF NOT EXISTS city           text,
  ADD COLUMN IF NOT EXISTS state_uf       text,
  ADD COLUMN IF NOT EXISTS street_number  text,
  ADD COLUMN IF NOT EXISTS complement     text,
  ADD COLUMN IF NOT EXISTS marital_status text check (
    marital_status in ('single', 'married', 'divorced', 'widowed', 'union')
  ),
  ADD COLUMN IF NOT EXISTS bio            text;
