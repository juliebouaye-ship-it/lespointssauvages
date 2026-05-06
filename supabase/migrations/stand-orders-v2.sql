-- Run in Supabase SQL editor (after stand_orders exists)
-- V2 adjustments for stand workflow.

alter table public.stand_orders
  alter column customer_email set not null;

alter table public.stand_orders
  alter column customer_phone drop not null;

alter table public.stand_orders
  add column if not exists shipping_address_1 text;

-- order_status is now managed as default "new" (no UI input required)
alter table public.stand_orders
  alter column order_status set default 'new';

-- Needed for dashboard table listing on /stand
drop policy if exists "public_select_stand_orders" on public.stand_orders;
create policy "public_select_stand_orders"
on public.stand_orders
for select
to anon
using (true);
