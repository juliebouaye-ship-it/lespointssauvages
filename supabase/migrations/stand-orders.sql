-- Run in Supabase SQL editor
-- Table dediee aux commandes prises au stand (mobile / POS)

create table if not exists public.stand_orders (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  order_details text not null,
  amount_products numeric(10,2) not null default 0,
  shipping_method text not null default 'pickup' check (shipping_method in ('pickup', 'ship')),
  shipping_fee numeric(10,2) not null default 0,
  amount_total numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  amount_remaining numeric(10,2) not null default 0,
  payment_status text not null default 'paid' check (payment_status in ('paid', 'deposit', 'pending')),
  order_status text not null default 'new' check (order_status in ('new', 'in_progress', 'ready', 'delivered')),
  pos_reference text,
  shipping_city text,
  shipping_postal_code text,
  deadline_date date,
  deadline_note text,
  internal_notes text
);

alter table public.stand_orders enable row level security;

drop policy if exists "public_insert_stand_orders" on public.stand_orders;
create policy "public_insert_stand_orders"
on public.stand_orders
for insert
to anon
with check (true);
