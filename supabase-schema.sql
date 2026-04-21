-- Run in Supabase SQL editor

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  paypal_order_id text,
  paypal_status text,
  payer_email text,
  payer_name text,
  amount_total numeric(10,2) not null,
  shipping_fee numeric(10,2) not null,
  shipping_full_name text not null,
  shipping_email text not null,
  shipping_phone text,
  shipping_address_1 text not null,
  shipping_address_2 text,
  shipping_postal_code text not null,
  shipping_city text not null,
  shipping_notes text,
  cart_lines jsonb not null
);

create table if not exists public.contact_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text,
  email text not null,
  message text not null
);

create table if not exists public.subscription_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('cancel', 'pause', 'info')),
  email text not null,
  message text not null
);

alter table public.orders enable row level security;
alter table public.contact_requests enable row level security;
alter table public.subscription_requests enable row level security;

drop policy if exists "public_insert_orders" on public.orders;
create policy "public_insert_orders"
on public.orders
for insert
to anon
with check (true);

drop policy if exists "public_insert_contact_requests" on public.contact_requests;
create policy "public_insert_contact_requests"
on public.contact_requests
for insert
to anon
with check (true);

drop policy if exists "public_insert_subscription_requests" on public.subscription_requests;
create policy "public_insert_subscription_requests"
on public.subscription_requests
for insert
to anon
with check (true);
