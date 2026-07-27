# Gastos da Casa — versão 2.4

## Alterações desta versão

### Parcelas do Nubank

Ao selecionar **NUBANK** no campo **Forma**, aparece o campo **Número de parcelas**, com opções de 1 a 12.

No banco de dados:

- compras no NUBANK recebem um valor entre 1 e 12 na coluna `parcelas`;
- PIX, BYBIT e ALELO recebem automaticamente `0`;
- lançamentos antigos do NUBANK serão considerados como 1 parcela.

### Tela de lançamentos

A tela de conferência agora:

- carrega todos os lançamentos disponíveis, sem o limite anterior de 50;
- mostra a pessoa responsável por cada lançamento;
- possui filtro por pessoa;
- possui filtro por mês;
- possui filtro por ano;
- mostra a quantidade e o valor total dos lançamentos filtrados;
- exibe o número de parcelas das compras feitas no NUBANK.

## Como atualizar a versão 2.3

1. No Supabase, abra **SQL Editor**.
2. Execute todo o arquivo `atualizacao-banco-v2.4.sql`.
3. No projeto da página, substitua somente:
   - `index.html`
   - `styles.css`
   - `app.js`
4. Não substitua seu `config.js`, pois ele contém a URL e a chave do projeto.
5. Atualize a página com `Ctrl + F5` ou abra o endereço acrescentando `?v=2.4`.

## Nome das pessoas

A lista de pessoas é criada a partir dos usuários de **Authentication > Users**. O sistema usa o nome salvo nos metadados do usuário e, quando ele não existe, usa a parte inicial do e-mail.

Você pode alterar manualmente os nomes na tabela `membros_casal`, coluna `nome`, dentro do Supabase.
