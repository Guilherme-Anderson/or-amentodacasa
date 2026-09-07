-- GASTOS DA CASA — ATUALIZAÇÃO DO BANCO PARA A VERSÃO 2.10
-- Execute uma única vez no SQL Editor do Supabase (ou já foi aplicada via ferramenta).
-- Adiciona o fluxo "tirar foto da nota agora, completar os dados depois":
--   1) coluna public.gastos.foto_path (mantém a foto junto do lançamento final);
--   2) tabela public.registros_foto (rascunhos: foto + data/hora da captura);
--   3) bucket privado de Storage "notas" para as imagens, com acesso só aos membros.

begin;

-- 1) foto no lançamento final -------------------------------------------------
alter table public.gastos
  add column if not exists foto_path text;

comment on column public.gastos.foto_path is
  'Caminho no bucket Storage "notas" da foto da nota, quando o lançamento veio de um registro fotográfico.';

-- 2) rascunhos de registro fotográfico -------------------------------------
create table if not exists public.registros_foto (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  foto_path text not null,
  capturado_em timestamptz not null default now(),
  observacao text,
  criado_em timestamptz not null default now(),
  constraint registros_foto_observacao_check
    check (observacao is null or char_length(observacao) <= 500)
);

create index if not exists registros_foto_capturado_idx
  on public.registros_foto (capturado_em desc);

alter table public.registros_foto enable row level security;

drop policy if exists "Membros veem registros de foto" on public.registros_foto;
drop policy if exists "Membros criam registros de foto" on public.registros_foto;
drop policy if exists "Membros atualizam registros de foto" on public.registros_foto;
drop policy if exists "Membros excluem registros de foto" on public.registros_foto;

create policy "Membros veem registros de foto"
  on public.registros_foto for select to authenticated
  using (public.usuario_e_membro_casal());

create policy "Membros criam registros de foto"
  on public.registros_foto for insert to authenticated
  with check (user_id = auth.uid() and public.usuario_e_membro_casal());

create policy "Membros atualizam registros de foto"
  on public.registros_foto for update to authenticated
  using (public.usuario_e_membro_casal())
  with check (public.usuario_e_membro_casal());

create policy "Membros excluem registros de foto"
  on public.registros_foto for delete to authenticated
  using (public.usuario_e_membro_casal());

grant select, insert, update, delete on table public.registros_foto to authenticated;

-- 3) bucket privado das fotos ----------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notas', 'notas', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Membros veem fotos de notas" on storage.objects;
drop policy if exists "Membros enviam fotos de notas" on storage.objects;
drop policy if exists "Membros removem fotos de notas" on storage.objects;

create policy "Membros veem fotos de notas"
  on storage.objects for select to authenticated
  using (bucket_id = 'notas' and public.usuario_e_membro_casal());

create policy "Membros enviam fotos de notas"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'notas' and public.usuario_e_membro_casal());

create policy "Membros removem fotos de notas"
  on storage.objects for delete to authenticated
  using (bucket_id = 'notas' and public.usuario_e_membro_casal());

commit;
