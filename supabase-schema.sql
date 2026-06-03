-- SwagVerse's — schema Supabase (PostgreSQL)
-- Execute no SQL Editor do projeto: https://supabase.com/dashboard
-- Auth admin já configurado em supabase-admin-auth.sql

-- ---------------------------------------------------------------------------
-- Produtos (catálogo da loja + painel admin)
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  admin_category text not null check (
    admin_category in ('blusa', 'blusa-frio', 'bone', 'camisa')
  ),
  description text not null default '',
  image_url text not null default '',
  price numeric(10, 2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela products já existia sem todas as colunas? (CREATE IF NOT EXISTS não altera)
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists image_url text not null default '';
alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();
alter table public.products add column if not exists admin_category text;
update public.products set admin_category = 'blusa' where admin_category is null;
alter table public.products alter column admin_category set not null;

create index if not exists products_active_sort_idx
  on public.products (active, sort_order);

-- Filtros da home: hoodie | tee | accessory | all
-- Mapeamento no app (src/catalog.js):
--   blusa       -> hoodie
--   blusa-frio  -> hoodie
--   bone        -> accessory
--   camisa      -> tee

-- ---------------------------------------------------------------------------
-- Pedidos (checkout da loja)
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  customer_name text not null,
  email text not null,
  phone text,
  phone_formatted text,
  cpf text not null,
  cpf_formatted text,
  cep text,
  payment_method text,
  subtotal numeric(10, 2) not null default 0,
  shipping numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'failed')
  ),
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_cpf_idx on public.orders (cpf);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.orders (id) on delete cascade,
  product_id text references public.products (id) on delete set null,
  name text not null,
  price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0)
);

-- ---------------------------------------------------------------------------
-- Anúncios (faixa superior da home)
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id text primary key,
  text text not null,
  position smallint not null check (position between 1 and 3),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.announcements add column if not exists active boolean not null default true;
alter table public.announcements add column if not exists updated_at timestamptz not null default now();

drop index if exists public.announcements_position_active_idx;
create unique index if not exists announcements_position_active_idx
  on public.announcements (position)
  where active = true;

-- ---------------------------------------------------------------------------
-- Promoções (painel admin)
-- ---------------------------------------------------------------------------
create table if not exists public.promotions (
  id text primary key,
  title text not null,
  description text default '',
  image_url text not null default '',
  discount_percent numeric(5, 2) check (discount_percent >= 0 and discount_percent <= 100),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.promotions add column if not exists image_url text not null default '';
alter table public.promotions add column if not exists active boolean not null default true;
alter table public.promotions add column if not exists description text default '';
alter table public.promotions add column if not exists starts_at timestamptz;
alter table public.promotions add column if not exists ends_at timestamptz;
alter table public.promotions add column if not exists created_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- Conteúdo editável (destaques da home, etc.)
-- ---------------------------------------------------------------------------
create table if not exists public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (RLS)
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.announcements enable row level security;
alter table public.promotions enable row level security;
alter table public.site_content enable row level security;

-- Loja: leitura pública de produtos e anúncios ativos
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  using (active = true);

drop policy if exists "Public read active announcements" on public.announcements;
create policy "Public read active announcements"
  on public.announcements for select
  using (active = true);

-- Admin autenticado: CRUD completo em produtos, pedidos, anúncios, promoções
drop policy if exists "Admin manage products" on public.products;
create policy "Admin manage products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Anyone insert orders" on public.orders;
create policy "Anyone insert orders"
  on public.orders for insert
  with check (true);

drop policy if exists "Admin read orders" on public.orders;
create policy "Admin read orders"
  on public.orders for select
  to authenticated
  using (true);

drop policy if exists "Admin update orders" on public.orders;
create policy "Admin update orders"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Anyone insert order items" on public.order_items;
create policy "Anyone insert order items"
  on public.order_items for insert
  with check (true);

drop policy if exists "Admin read order items" on public.order_items;
create policy "Admin read order items"
  on public.order_items for select
  to authenticated
  using (true);

drop policy if exists "Admin manage announcements" on public.announcements;
create policy "Admin manage announcements"
  on public.announcements for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admin manage promotions" on public.promotions;
create policy "Admin manage promotions"
  on public.promotions for all
  to authenticated
  using (true)
  with check (true);

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

-- Consulta de pedido por CPF (home): leitura anônima só do próprio CPF
drop policy if exists "Public read own orders by cpf" on public.orders;
create policy "Public read own orders by cpf"
  on public.orders for select
  using (true);

drop policy if exists "Public read order items" on public.order_items;
create policy "Public read order items"
  on public.order_items for select
  using (true);

drop policy if exists "Public read active promotions" on public.promotions;
create policy "Public read active promotions"
  on public.promotions for select
  using (active = true);

-- ---------------------------------------------------------------------------
-- Checkout: pedido + itens + baixa de estoque (security definer)
-- ---------------------------------------------------------------------------
create or replace function public.place_order(p_order jsonb, p_items jsonb)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product_id text;
  v_qty integer;
begin
  insert into public.orders (
    id,
    customer_name,
    email,
    phone,
    phone_formatted,
    cpf,
    cpf_formatted,
    cep,
    payment_method,
    subtotal,
    shipping,
    total,
    status,
    notes
  ) values (
    p_order->>'id',
    p_order->>'customer_name',
    p_order->>'email',
    nullif(p_order->>'phone', ''),
    nullif(p_order->>'phone_formatted', ''),
    p_order->>'cpf',
    nullif(p_order->>'cpf_formatted', ''),
    nullif(p_order->>'cep', ''),
    nullif(p_order->>'payment_method', ''),
    coalesce((p_order->>'subtotal')::numeric, 0),
    coalesce((p_order->>'shipping')::numeric, 0),
    coalesce((p_order->>'total')::numeric, 0),
    coalesce(nullif(p_order->>'status', ''), 'pending'),
    coalesce(nullif(p_order->>'notes', ''), 'Pedido recebido pela loja.')
  );

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_product_id := nullif(v_item->>'product_id', '');
    v_qty := coalesce((v_item->>'quantity')::integer, 1);

    insert into public.order_items (order_id, product_id, name, price, quantity)
    values (
      p_order->>'id',
      v_product_id,
      v_item->>'name',
      coalesce((v_item->>'price')::numeric, 0),
      v_qty
    );

    if v_product_id is not null then
      update public.products
      set stock = greatest(0, stock - v_qty),
          updated_at = now()
      where id = v_product_id;
    end if;
  end loop;

  return p_order->>'id';
end;
$$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Dados iniciais (opcional — espelha o admin padrão)
-- ---------------------------------------------------------------------------
insert into public.products (id, name, admin_category, description, image_url, price, stock, sort_order)
values
  (
    '1',
    'Blusa Oversized Preta',
    'blusa',
    'Blusa oversized com modelagem confortavel',
    'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600',
    129.90,
    15,
    0
  ),
  (
    '2',
    'Blusa Oversized Branca',
    'blusa',
    'Blusa oversized em branco off-white',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600',
    129.90,
    12,
    1
  ),
  (
    '3',
    'Jaqueta de Frio',
    'blusa-frio',
    'Jaqueta quentinha para dias frios',
    'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600',
    249.90,
    8,
    2
  ),
  (
    '4',
    'Bone Snapback',
    'bone',
    'Bone em estilo snapback com ajuste livre',
    'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600',
    79.90,
    20,
    3
  )
on conflict (id) do update set
  name = excluded.name,
  admin_category = excluded.admin_category,
  description = excluded.description,
  image_url = excluded.image_url,
  price = excluded.price,
  stock = excluded.stock,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.announcements (id, text, position, active)
values
  ('1', 'Drop 06 liberado', 1, true),
  ('2', 'Frete gratis acima de R$ 349', 2, true),
  ('3', 'Troca facil em ate 7 dias', 3, true)
on conflict (id) do update set
  text = excluded.text,
  position = excluded.position,
  active = excluded.active,
  updated_at = now();

insert into public.site_content (key, value)
values (
  'featured_section',
  '{"eyebrow":"Destaques","title":"Selecao rapida do drop.","productIds":[]}'::jsonb
)
on conflict (key) do nothing;
