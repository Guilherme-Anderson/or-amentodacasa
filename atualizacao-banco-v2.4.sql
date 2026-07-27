-- GASTOS DA CASA — ATUALIZAÇÃO DO BANCO PARA A VERSÃO 2.4
-- Execute uma única vez no SQL Editor do Supabase.
-- Esta atualização:
--   1) cria a coluna parcelas;
--   2) mantém 0 para formas diferentes de NUBANK;
--   3) considera compras antigas no NUBANK como 1 parcela;
--   4) permite que os membros visualizem a lista de pessoas do sistema;
--   5) mantém todos os gastos visíveis para todos os membros autenticados.

begin;

alter table public.gastos
  add column if not exists parcelas smallint not null default 0;

-- Ajusta os registros anteriores à criação da coluna.
update public.gastos
set parcelas = case
  when forma = 'NUBANK' then greatest(1, least(12, coalesce(parcelas, 1)))
  else 0
end;

alter table public.gastos
  drop constraint if exists gastos_parcelas_check;

alter table public.gastos
  add constraint gastos_parcelas_check
  check (
    (forma = 'NUBANK' and parcelas between 1 and 12)
    or
    (forma <> 'NUBANK' and parcelas = 0)
  );

comment on column public.gastos.parcelas is
  'Número de parcelas entre 1 e 12 quando a forma é NUBANK; 0 para as demais formas.';

alter table public.membros_casal
  add column if not exists email text;

-- Sincroniza os usuários já existentes no Authentication.
insert into public.membros_casal as membro (user_id, nome, email)
select
  usuario.id,
  coalesce(
    nullif(usuario.raw_user_meta_data ->> 'display_name', ''),
    nullif(usuario.raw_user_meta_data ->> 'full_name', ''),
    split_part(usuario.email, '@', 1)
  ),
  usuario.email
from auth.users as usuario
on conflict (user_id) do update
set
  email = excluded.email,
  nome = coalesce(nullif(membro.nome, ''), excluded.nome);

-- Novos usuários criados no Authentication passam a entrar automaticamente
-- na lista de pessoas do sistema.
create or replace function public.sincronizar_membro_casal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.membros_casal as membro (user_id, nome, email)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    new.email
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    nome = coalesce(nullif(membro.nome, ''), excluded.nome);

  return new;
end;
$$;

drop trigger if exists sincronizar_membro_casal_trigger on auth.users;
create trigger sincronizar_membro_casal_trigger
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sincronizar_membro_casal();

-- Função segura usada pelas políticas sem provocar recursão de RLS.
create or replace function public.usuario_e_membro_casal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros_casal
    where user_id = auth.uid()
  );
$$;

revoke all on function public.usuario_e_membro_casal() from public;
grant execute on function public.usuario_e_membro_casal() to authenticated;

alter table public.membros_casal enable row level security;

drop policy if exists "Membro consulta o proprio cadastro" on public.membros_casal;
drop policy if exists "Membros consultam integrantes" on public.membros_casal;

create policy "Membros consultam integrantes"
  on public.membros_casal
  for select
  to authenticated
  using (public.usuario_e_membro_casal());

grant select on table public.membros_casal to authenticated;

-- Recria as políticas de gastos para deixar explícito que todos os membros
-- podem consultar todos os lançamentos, mas cada inclusão pertence ao usuário logado.
alter table public.gastos enable row level security;

drop policy if exists "Membros visualizam os gastos do casal" on public.gastos;
drop policy if exists "Membros inserem gastos" on public.gastos;
drop policy if exists "Membros atualizam gastos" on public.gastos;
drop policy if exists "Membros excluem gastos" on public.gastos;

create policy "Membros visualizam os gastos do casal"
  on public.gastos
  for select
  to authenticated
  using (public.usuario_e_membro_casal());

create policy "Membros inserem gastos"
  on public.gastos
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.usuario_e_membro_casal()
  );

create policy "Membros atualizam gastos"
  on public.gastos
  for update
  to authenticated
  using (public.usuario_e_membro_casal())
  with check (public.usuario_e_membro_casal());

create policy "Membros excluem gastos"
  on public.gastos
  for delete
  to authenticated
  using (public.usuario_e_membro_casal());

create index if not exists gastos_user_data_idx
  on public.gastos (user_id, ocorrido_em desc);

commit;

-- Conferência opcional: mostra as pessoas cadastradas no sistema.
select user_id, nome, email, criado_em
from public.membros_casal
order by nome nulls last, email;
