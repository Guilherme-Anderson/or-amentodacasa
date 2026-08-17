-- GASTOS DA CASA — ATUALIZAÇÃO DO BANCO PARA A VERSÃO 2.6
-- Execute uma única vez no SQL Editor do Supabase.
-- Esta atualização:
--   1) cria a tabela configuracoes_orcamento, com uma única linha guardando
--      a renda mensal do casal, usada no Painel para calcular quanto ainda
--      pode ser gasto em cada categoria;
--   2) permite que qualquer membro do casal veja e atualize essa renda.

begin;

create table if not exists public.configuracoes_orcamento (
  id boolean primary key default true,
  renda_mensal numeric(12, 2) not null default 0,
  atualizado_em timestamptz not null default now(),
  constraint configuracoes_orcamento_singleton check (id)
);

insert into public.configuracoes_orcamento (id, renda_mensal)
values (true, 0)
on conflict (id) do nothing;

alter table public.configuracoes_orcamento enable row level security;

drop policy if exists "Membros consultam a renda do orcamento" on public.configuracoes_orcamento;
drop policy if exists "Membros atualizam a renda do orcamento" on public.configuracoes_orcamento;

create policy "Membros consultam a renda do orcamento"
  on public.configuracoes_orcamento
  for select
  to authenticated
  using (public.usuario_e_membro_casal());

create policy "Membros atualizam a renda do orcamento"
  on public.configuracoes_orcamento
  for update
  to authenticated
  using (public.usuario_e_membro_casal())
  with check (public.usuario_e_membro_casal());

grant select, update on table public.configuracoes_orcamento to authenticated;

commit;
