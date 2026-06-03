-- Tabela para textos e destaques da home (execute se ainda nao tiver site_content)

create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Public read site content" on public.site_content;
create policy "Public read site content"
  on public.site_content for select
  using (true);

drop policy if exists "Admin manage site content" on public.site_content;
create policy "Admin manage site content"
  on public.site_content for all
  to authenticated
  using (true)
  with check (true);

insert into public.site_content (key, value)
values (
  'featured_section',
  '{"eyebrow":"Destaques","title":"Selecao rapida do drop.","productIds":[]}'::jsonb
)
on conflict (key) do nothing;
