-- Correção rápida: column "active" does not exist
-- Execute SOMENTE este arquivo no SQL Editor se o schema completo falhar.

alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists image_url text not null default '';
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists updated_at timestamptz not null default now();

alter table public.announcements add column if not exists active boolean not null default true;
alter table public.announcements add column if not exists updated_at timestamptz not null default now();

alter table public.promotions add column if not exists active boolean not null default true;
alter table public.promotions add column if not exists image_url text not null default '';

drop index if exists public.announcements_position_active_idx;
create unique index if not exists announcements_position_active_idx
  on public.announcements (position)
  where active = true;

create index if not exists products_active_sort_idx
  on public.products (active, sort_order);
