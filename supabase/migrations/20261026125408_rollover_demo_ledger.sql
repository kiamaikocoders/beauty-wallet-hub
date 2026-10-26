-- Amani's seeded September rollover was 70 coins, which is 10% of 700 unused.
-- The same unused pool at the corrected rule is 80%, so the demo line is 560.

update public.coin_transactions
set coins = 560
where kind = 'rollover'
  and coins = 70
  and note = '80% of September’s unused coins';

update public.wallets w
set available = available + 490,
    rollover = 560,
    updated_at = now()
where w.rollover = 70
  and exists (
    select 1
    from public.coin_transactions c
    where c.profile_id = w.profile_id
      and c.kind = 'rollover'
      and c.coins = 560
      and c.note = '80% of September’s unused coins'
  );
