-- Run this once if subscription_requests already exists
-- Fix old values first, then update constraint.

update public.subscription_requests
set type = 'info'
where type not in ('cancel', 'pause', 'info');

alter table public.subscription_requests
drop constraint if exists subscription_requests_type_check;

alter table public.subscription_requests
add constraint subscription_requests_type_check
check (type in ('cancel', 'pause', 'info'));
