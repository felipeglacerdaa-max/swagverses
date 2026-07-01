-- Cria o bucket de imagens para produtos no Supabase Storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'products',
  'products',
  true,
  5242880,
  array['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
on conflict (id) do nothing;

-- Permite leitura pública das imagens
create policy if not exists "Produtos publicos" on storage.objects
for select
using (bucket_id = 'products');

-- Permite upload/atualizacao/delecao para usuarios autenticados
create policy if not exists "Upload de produtos" on storage.objects
for insert
with check (bucket_id = 'products' and auth.role() = 'authenticated');

create policy if not exists "Atualizar produtos" on storage.objects
for update
using (bucket_id = 'products' and auth.role() = 'authenticated');

create policy if not exists "Excluir produtos" on storage.objects
for delete
using (bucket_id = 'products' and auth.role() = 'authenticated');
