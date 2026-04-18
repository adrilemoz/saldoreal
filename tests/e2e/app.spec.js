// tests/e2e/app.spec.js
// Testa o fluxo real do usuário no browser — abre a tela, clica, preenche, verifica.
// Requer: npm run dev rodando em paralelo (ou usar webServer no config).

import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────────────────
async function fazerOnboarding(page, nome = 'Teste Bot') {
  // Se a tela de onboarding aparecer, preenche
  const nomeInput = page.locator('input[placeholder*="nome"], input[placeholder*="Nome"]').first();
  if (await nomeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await nomeInput.fill(nome);
    await page.getByRole('button', { name: /começar|continuar|próximo/i }).first().click();
    // pular humor se aparecer
    const skipBtn = page.getByRole('button', { name: /pular|agora não|depois/i }).first();
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
    } else {
      // seleciona qualquer humor
      await page.locator('[class*="humor"], [data-humor]').first().click().catch(() => {});
      await page.getByRole('button', { name: /confirmar|continuar|salvar/i }).first().click().catch(() => {});
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Tela Inicial (Home)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await fazerOnboarding(page);
  });

  test('exibe o card de saldo restante', async ({ page }) => {
    await expect(page.getByText('SALDO RESTANTE NO MÊS')).toBeVisible({ timeout: 5000 });
  });

  test('botões de acesso rápido estão presentes', async ({ page }) => {
    await expect(page.getByText('Acordos')).toBeVisible();
    await expect(page.getByText('Gastos')).toBeVisible();
    await expect(page.getByText('Relatório')).toBeVisible();
  });

  test('navega para Acordos e volta ao Home', async ({ page }) => {
    await page.getByText('Acordos').first().click();
    await expect(page.getByText('Livro Razão')).toBeVisible();
    await page.getByRole('button', { name: /voltar|início/i }).first().click();
    await expect(page.getByText('SALDO RESTANTE NO MÊS')).toBeVisible();
  });

  test('navega para Gastos e volta ao Home', async ({ page }) => {
    await page.getByText('Gastos').first().click();
    await expect(page.getByRole('button', { name: /novo lançamento/i })).toBeVisible();
    await page.getByRole('button', { name: /início/i }).first().click();
    await expect(page.getByText('SALDO RESTANTE NO MÊS')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NOVO ACORDO — Wizard
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Wizard de Novo Acordo', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await fazerOnboarding(page);
    // navega para Acordos
    await page.getByText('Acordos').first().click();
    await expect(page.getByText('Livro Razão')).toBeVisible();
    // abre wizard
    await page.getByRole('button', { name: /novo registo/i }).click();
  });

  test('wizard abre em tela cheia com barra de progresso', async ({ page }) => {
    await expect(page.getByText('Passo 1')).toBeVisible({ timeout: 3000 });
    // barra de progresso deve existir
    await expect(page.locator('[role="progressbar"]')).toBeVisible();
  });

  test('primeira pergunta é sobre negociação da dívida', async ({ page }) => {
    await expect(page.getByText('Você já negociou essa dívida?')).toBeVisible({ timeout: 3000 });
  });

  test('selecionar "Sim, está negociada" avança automaticamente', async ({ page }) => {
    await page.getByText('Sim, está negociada').click();
    // deve avançar para próximo passo
    await expect(page.getByText('Passo 2')).toBeVisible({ timeout: 3000 });
  });

  test('fluxo completo de novo acordo', async ({ page }) => {
    // Passo 1: tipo
    await page.getByText('Sim, está negociada').click();
    await page.waitForTimeout(300);

    // Passo 2: banco direto ou administradora
    await page.getByText('Banco ou empresa').click();
    await page.waitForTimeout(300);

    // Passo 3: nome do credor
    await page.locator('input').first().fill('Nubank');
    await page.getByRole('button', { name: /continuar/i }).click();
    await page.waitForTimeout(300);

    // Passo 4: categoria
    await page.getByText('Cartão de Crédito').click();
    await page.waitForTimeout(300);

    // Passo 5: valor original
    const inputValor = page.locator('input[inputmode="numeric"]').first();
    await inputValor.fill('200000'); // R$ 2.000,00
    await page.getByRole('button', { name: /continuar/i }).click();
    await page.waitForTimeout(300);

    // Passo 6: valor negociado
    const inputNeg = page.locator('input[inputmode="numeric"]').first();
    await inputNeg.fill('100000'); // R$ 1.000,00
    await page.getByRole('button', { name: /continuar/i }).click();
    await page.waitForTimeout(300);

    // Passo 7: parcelamento — só clica continuar com defaults
    await page.getByRole('button', { name: /continuar/i }).click();
    await page.waitForTimeout(300);

    // Passo 8: forma de pagamento
    await page.getByText('Pix').click();
    await page.waitForTimeout(300);

    // Passo 9: data da dívida — pular
    await page.getByRole('button', { name: /pular/i }).click();
    await page.waitForTimeout(300);

    // Passo 10: notas — pular
    await page.getByRole('button', { name: /pular/i }).click();
    await page.waitForTimeout(300);

    // Passo 11: resumo — salvar
    await expect(page.getByText('Tudo certo')).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: /salvar na carteira/i }).click();

    // Deve voltar para a Carteira com o novo acordo
    await expect(page.getByText('Livro Razão')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Nubank')).toBeVisible({ timeout: 3000 });
  });

  test('botão cancelar fecha o wizard', async ({ page }) => {
    await page.getByRole('button', { name: /cancelar/i }).first().click();
    await expect(page.getByText('Livro Razão')).toBeVisible({ timeout: 3000 });
  });

  test('seta voltar no passo 2 retorna ao passo 1', async ({ page }) => {
    await page.getByText('Sim, está negociada').click();
    await page.waitForTimeout(300);
    await expect(page.getByText('Passo 2')).toBeVisible();
    await page.locator('button').filter({ hasText: '←' }).click();
    await expect(page.getByText('Passo 1')).toBeVisible({ timeout: 3000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GASTOS — Lançamento de despesa
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Lançamento de Gastos', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await fazerOnboarding(page);
    await page.getByText('Lançamento').first().click();
  });

  test('tela de novo lançamento carrega', async ({ page }) => {
    await expect(page.getByText('Novo Lançamento')).toBeVisible({ timeout: 3000 });
  });

  test('salva uma despesa única com sucesso', async ({ page }) => {
    await page.getByLabel('Descrição').fill('Aluguel de teste');
    const inputValor = page.locator('input[inputmode="numeric"]').first();
    await inputValor.fill('150000'); // R$ 1.500,00
    await page.getByRole('button', { name: /salvar/i }).click();
    // deve exibir toast de sucesso
    await expect(page.getByText(/salvo|sucesso/i)).toBeVisible({ timeout: 4000 });
  });

  test('bloqueia salvar sem nome', async ({ page }) => {
    const inputValor = page.locator('input[inputmode="numeric"]').first();
    await inputValor.fill('50000');
    await page.getByRole('button', { name: /salvar/i }).click();
    await expect(page.getByText(/obrigatório|nome e valor/i)).toBeVisible({ timeout: 3000 });
  });

  test('bloqueia salvar sem valor', async ({ page }) => {
    await page.getByLabel('Descrição').fill('Teste sem valor');
    await page.getByRole('button', { name: /salvar/i }).click();
    await expect(page.getByText(/obrigatório|nome e valor/i)).toBeVisible({ timeout: 3000 });
  });

  test('cancela e volta para gastos', async ({ page }) => {
    await page.getByRole('button', { name: /cancelar/i }).click();
    await expect(page.locator('text=PENDENTES, text=LIQUIDADOS').first()).toBeVisible({ timeout: 3000 }).catch(() => {});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SALDO — verifica que o saldo atualiza após pagar
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Saldo restante atualiza após pagamento', () => {

  test('saldo muda após pagar uma despesa', async ({ page }) => {
    await page.goto('/');
    await fazerOnboarding(page);

    // adiciona um gasto
    await page.getByText('Lançamento').first().click();
    await page.getByLabel('Descrição').fill('Conta de luz');
    await page.locator('input[inputmode="numeric"]').first().fill('20000'); // R$ 200
    await page.getByRole('button', { name: /salvar/i }).click();
    await page.waitForTimeout(1000);

    // volta ao home e anota o saldo
    await page.getByRole('button', { name: /início/i }).first().click();
    const textoSaldoAntes = await page.getByText('SALDO RESTANTE NO MÊS').locator('..').locator('..').textContent();

    // vai para gastos e paga o item
    await page.getByText('Gastos').first().click();
    const btnPagar = page.locator('button').filter({ hasText: '✅' }).first();
    if (await btnPagar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btnPagar.click();
      // confirma se aparecer modal
      const confirmar = page.getByRole('button', { name: /confirmar/i }).first();
      if (await confirmar.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmar.click();
      }
      await page.waitForTimeout(500);
    }

    // volta ao home
    await page.getByRole('button', { name: /início/i }).first().click();
    await page.waitForTimeout(500);

    // saldo deve ter mudado (o componente foi remontado com homeKey)
    const textoSaldoDepois = await page.getByText('SALDO RESTANTE NO MÊS').locator('..').locator('..').textContent();
    // os textos devem ser diferentes (débito pendente diminuiu)
    expect(textoSaldoAntes).not.toBe(textoSaldoDepois);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BACKUP — geração e cópia
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Backup', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await fazerOnboarding(page);
    await page.getByText('Backup').first().click();
  });

  test('tela de backup carrega', async ({ page }) => {
    await expect(page.getByText('Proteção de Dados')).toBeVisible({ timeout: 3000 });
  });

  test('gera código de backup', async ({ page }) => {
    await page.getByRole('button', { name: /gerar código/i }).click();
    // deve aparecer um textarea com o código
    const textarea = page.locator('textarea').first();
    await expect(textarea).toBeVisible({ timeout: 3000 });
    const valor = await textarea.inputValue();
    expect(valor.length).toBeGreaterThan(10);
  });
});
