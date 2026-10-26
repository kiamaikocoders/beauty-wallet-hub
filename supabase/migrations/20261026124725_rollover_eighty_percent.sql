-- Unused coins: 80% roll over for one month, 20% are taken back.
-- The 10% unlock fee for a Basic member booking a higher class is unchanged.

alter table public.coin_rules
  alter column rollover_pct set default 0.800;

update public.coin_rules
set rollover_pct = 0.800,
    updated_at = now()
where id = 1;

update public.coin_transactions
set note = '80% of September’s unused coins'
where kind = 'rollover'
  and note ilike '%10% of September%';
