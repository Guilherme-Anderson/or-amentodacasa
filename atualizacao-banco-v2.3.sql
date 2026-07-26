-- GASTOS DA CASA — ATUALIZAÇÃO DO BANCO PARA A VERSÃO 2.3
-- Execute uma única vez no SQL Editor do Supabase.
-- Os lançamentos antigos continuarão funcionando e aparecerão como "Sem categoria".

alter table public.gastos
  add column if not exists orcamento text;

alter table public.gastos
  drop constraint if exists gastos_orcamento_check;

alter table public.gastos
  add constraint gastos_orcamento_check
  check (
    orcamento is null
    or orcamento in (
      'Dizimo',
      'Custo Fixo',
      'Conforto',
      'Prazer',
      'Metas',
      'Conhecimento',
      'Liberdade Financeira'
    )
  );

create index if not exists gastos_orcamento_idx
  on public.gastos (orcamento);

comment on column public.gastos.orcamento is
  'Categoria do orçamento doméstico informada no lançamento.';
