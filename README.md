# Gastos da Casa — versão 2.3

## Alteração desta versão

Foi incluído o campo obrigatório **Orçamento**, antes de **OBS**, com estas opções:

- Dizimo
- Custo Fixo
- Conforto
- Prazer
- Metas
- Conhecimento
- Liberdade Financeira

A categoria também aparece na tela de lançamentos e será armazenada no Supabase para utilização no futuro dashboard.

Os espaçamentos do formulário no celular foram reduzidos para compensar o novo campo e manter o botão **Salvar gasto** o mais próximo possível da área visível.

## Como atualizar

1. Execute o arquivo `atualizacao-banco-v2.3.sql` no SQL Editor do Supabase.
2. Substitua no seu projeto somente:
   - `index.html`
   - `styles.css`
   - `app.js`
3. Não substitua o seu `config.js`.
4. Atualize a página com `Ctrl + F5` ou abra o endereço acrescentando `?v=2.3`.

Os registros antigos não serão apagados. Como eles não possuíam essa informação, aparecerão no histórico como **Sem categoria**.
