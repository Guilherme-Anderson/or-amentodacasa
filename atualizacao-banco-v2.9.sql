-- GASTOS DA CASA — ATUALIZAÇÃO DO BANCO PARA A VERSÃO 2.9
-- Execute uma única vez no SQL Editor do Supabase.
-- Esta atualização adiciona a gestão do cartão de crédito (fatura do Nubank):
--   1) novas colunas em public.gastos para a data real da compra, a competência
--      (mês da fatura em que o gasto é contabilizado) e o controle de parcelas;
--   2) tabela public.configuracoes_cartao (linha única) com os dias de
--      fechamento e vencimento e o saldo inicial da fatura;
--   3) tabela public.pagamentos_cartao para registrar os pagamentos da fatura
--      SEM que eles contem como gasto;
--   4) preenche competencia/data_compra dos lançamentos já existentes, mantendo
--      exatamente o comportamento atual para quem já usa o app.

begin;

-- 1) Colunas novas em gastos ----------------------------------------------------
alter table public.gastos
  add column if not exists data_compra timestamptz,
  add column if not exists competencia date,
  add column if not exists grupo_parcelamento uuid,
  add column if not exists parcela_num smallint,
  add column if not exists parcela_total smallint;

-- Registros anteriores: a competência passa a ser o mês em que o gasto ocorreu.
update public.gastos
set
  data_compra = coalesce(data_compra, ocorrido_em),
  competencia = coalesce(competencia, date_trunc('month', ocorrido_em)::date),
  parcela_num = coalesce(parcela_num, 1),
  parcela_total = coalesce(
    parcela_total,
    case
      when forma = 'NUBANK' then greatest(1, least(12, coalesce(nullif(parcelas, 0), 1)))
      else 1
    end
  )
where competencia is null
   or data_compra is null
   or parcela_num is null
   or parcela_total is null;

alter table public.gastos
  alter column competencia set default (date_trunc('month', now())::date);

alter table public.gastos
  alter column parcela_num set default 1;

alter table public.gastos
  alter column parcela_total set default 1;

create index if not exists gastos_competencia_idx
  on public.gastos (competencia);

create index if not exists gastos_grupo_parcelamento_idx
  on public.gastos (grupo_parcelamento);

comment on column public.gastos.data_compra is
  'Data/hora real da compra. Usada só para exibição; a contabilização usa a competência.';
comment on column public.gastos.competencia is
  'Primeiro dia do mês da fatura em que o gasto é contabilizado (regime de competência).';
comment on column public.gastos.grupo_parcelamento is
  'Identificador comum a todas as parcelas geradas por uma mesma compra parcelada.';
comment on column public.gastos.parcela_num is
  'Número desta parcela (1..parcela_total).';
comment on column public.gastos.parcela_total is
  'Total de parcelas da compra (1 quando à vista).';

-- 2) Configuração do cartão (linha única) ------------------------------------
create table if not exists public.configuracoes_cartao (
  id boolean primary key default true,
  dia_fechamento smallint not null default 3,
  dia_vencimento smallint not null default 10,
  saldo_inicial numeric(12, 2) not null default 0,
  saldo_inicial_competencia date,
  atualizado_em timestamptz not null default now(),
  constraint configuracoes_cartao_singleton check (id),
  constraint configuracoes_cartao_fechamento_check check (dia_fechamento between 1 and 28),
  constraint configuracoes_cartao_vencimento_check check (dia_vencimento between 1 and 28)
);

insert into public.configuracoes_cartao (id, dia_fechamento, dia_vencimento)
values (true, 3, 10)
on conflict (id) do nothing;

alter table public.configuracoes_cartao enable row level security;

drop policy if exists "Membros consultam a config do cartao" on public.configuracoes_cartao;
drop policy if exists "Membros atualizam a config do cartao" on public.configuracoes_cartao;

create policy "Membros consultam a config do cartao"
  on public.configuracoes_cartao
  for select
  to authenticated
  using (public.usuario_e_membro_casal());

create policy "Membros atualizam a config do cartao"
  on public.configuracoes_cartao
  for update
  to authenticated
  using (public.usuario_e_membro_casal())
  with check (public.usuario_e_membro_casal());

grant select, update on table public.configuracoes_cartao to authenticated;

-- 3) Pagamentos da fatura --------------------------------------------------
create table if not exists public.pagamentos_cartao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  competencia date not null,
  valor numeric(12, 2) not null check (valor > 0),
  pago_em timestamptz not null default now(),
  observacao text,
  criado_em timestamptz not null default now()
);

create index if not exists pagamentos_cartao_competencia_idx
  on public.pagamentos_cartao (competencia);

alter table public.pagamentos_cartao enable row level security;

drop policy if exists "Membros visualizam pagamentos da fatura" on public.pagamentos_cartao;
drop policy if exists "Membros inserem pagamentos da fatura" on public.pagamentos_cartao;
drop policy if exists "Membros atualizam pagamentos da fatura" on public.pagamentos_cartao;
drop policy if exists "Membros excluem pagamentos da fatura" on public.pagamentos_cartao;

create policy "Membros visualizam pagamentos da fatura"
  on public.pagamentos_cartao
  for select
  to authenticated
  using (public.usuario_e_membro_casal());

create policy "Membros inserem pagamentos da fatura"
  on public.pagamentos_cartao
  for insert
  to authenticated
  with check (user_id = auth.uid() and public.usuario_e_membro_casal());

create policy "Membros atualizam pagamentos da fatura"
  on public.pagamentos_cartao
  for update
  to authenticated
  using (public.usuario_e_membro_casal())
  with check (public.usuario_e_membro_casal());

create policy "Membros excluem pagamentos da fatura"
  on public.pagamentos_cartao
  for delete
  to authenticated
  using (public.usuario_e_membro_casal());

grant select, insert, update, delete on table public.pagamentos_cartao to authenticated;

commit;

-- Conferência opcional:
-- select id, dia_fechamento, dia_vencimento, saldo_inicial, saldo_inicial_competencia
-- from public.configuracoes_cartao;
