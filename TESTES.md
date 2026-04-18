# 🧪 Testes Automatizados — Minhas Finanças

Este projeto tem dois tipos de testes que rodam no terminal e mostram pass/fail:

---

## ⚡ Instalação (primeira vez)

```bash
# 1. Instala todas as dependências (incluindo Vitest e Playwright)
npm install

# 2. Instala os browsers que o Playwright usa para simular o usuário
npx playwright install chromium
```

---

## 🚀 Comandos

### Rodar TUDO de uma vez
```bash
npm test
```
Roda os testes de lógica + os testes de interface em sequência.

---

### Só testes de lógica (rápidos, ~1 segundo)
```bash
npm run test:unit
```
Testa os cálculos financeiros sem abrir nenhum browser:
- Formatação de moeda
- Cálculo de parcelas
- Débito do mês
- Saldo restante
- Bug de string concat no pagamento
- Bug de comparação de strings no filtro

**Exemplo de saída:**
```
✓ money() → formata número positivo em reais
✓ debitoDoMes() → não conta acordo já pago neste mês
✓ registarPagamento() → parcelasPagas não concatena string — bug "2" + 1 = "21"
✓ filtro de ativos/quitados → "9" < "10" retorna false (demonstração do bug antigo)
...
36 testes passaram em 0.8s
```

---

### Modo watch (reexecuta ao salvar um arquivo)
```bash
npm run test:unit:watch
```
Útil enquanto você está desenvolvendo — qualquer mudança no código roda os testes automaticamente.

---

### Cobertura de código
```bash
npm run test:unit:coverage
```
Mostra quais linhas do código estão sendo testadas e quais não estão.

---

### Só testes de interface (robô clicando)
```bash
npm run test:e2e
```
O Playwright abre o browser automaticamente, navega pelo app e verifica:
- Home carrega com card de saldo
- Wizard de novo acordo passa por todos os passos
- Salvamento de despesa funciona
- Validação de campos obrigatórios funciona
- Saldo atualiza após pagar uma despesa
- Backup gera código

**Exemplo de saída:**
```
  ✓ Tela Inicial (Home) › exibe o card de saldo restante
  ✓ Tela Inicial (Home) › navega para Acordos e volta ao Home
  ✓ Wizard de Novo Acordo › wizard abre em tela cheia com barra de progresso
  ✓ Wizard de Novo Acordo › fluxo completo de novo acordo
  ✓ Lançamento de Gastos › salva uma despesa única com sucesso
  ✓ Lançamento de Gastos › bloqueia salvar sem nome
  ✓ Saldo restante atualiza após pagamento
  ...
```

---

## 📁 Estrutura dos arquivos de teste

```
tests/
├── unit/
│   ├── financeiro.utils.test.js    ← testa FinanceiroUtils (datas, parcelas, etc.)
│   └── logica.financeira.test.js   ← testa regras de negócio (saldo, débito, pagamentos)
└── e2e/
    └── app.spec.js                 ← testa o app no browser (robô clicando)
```

---

## 🔍 Como adicionar um novo teste

### Teste de lógica (unit)
Abra `tests/unit/logica.financeira.test.js` e adicione:

```js
describe('minha nova funcionalidade', () => {
  it('faz o que deveria fazer', () => {
    const resultado = minhaFuncao(entrada);
    expect(resultado).toBe(valorEsperado);
  });
});
```

### Teste de interface (e2e)
Abra `tests/e2e/app.spec.js` e adicione:

```js
test('meu novo fluxo', async ({ page }) => {
  await page.goto('/');
  await page.getByText('algum texto').click();
  await expect(page.getByText('resultado esperado')).toBeVisible();
});
```

---

## 🛡️ O que os testes verificam (bugs já encontrados e cobertos)

| Teste | Bug que previne |
|-------|----------------|
| `parcelasPagas não concatena string` | `"2" + 1 = "21"` em vez de `3` |
| `"9" < "10" retorna false` | Filtro de acordos ativos/quitados errado |
| `não conta acordo já pago neste mês` | Saldo voltando ao valor anterior após pagamento |
| `bloqueia salvar sem nome/valor` | Dados inválidos sendo salvos no banco |
| `saldo muda após pagar uma despesa` | Home não atualizando após voltar de outra tela |
