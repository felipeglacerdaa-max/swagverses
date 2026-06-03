-- Migração para quem já executou uma versão antiga do supabase-schema.sql
-- Execute este arquivo no SQL Editor (pode rodar antes ou depois do schema).

alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists image_url text not null default '';
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists updated_at timestamptz not null default now();

alter table public.announcements add column if not exists active boolean not null default true;
alter table public.announcements add column if not exists updated_at timestamptz not null default now();

alter table public.promotions add column if not exists image_url text not null default '';
alter table public.promotions add column if not exists active boolean not null default true;

drop index if exists public.announcements_position_active_idx;
create unique index if not exists announcements_position_active_idx
  on public.announcements (position)
  where active = true;

create index if not exists products_active_sort_idx
  on public.products (active, sort_order);

drop policy if exists "Public read order items" on public.order_items;
create policy "Public read order items"
  on public.order_items for select
  using (true);

drop policy if exists "Public read active promotions" on public.promotions;
create policy "Public read active promotions"
  on public.promotions for select
  using (active = true);

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
