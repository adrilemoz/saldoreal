// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

// Aponta para a Vercel — testes rodam headless no Termux.
// Lembra de fazer git push antes de rodar os testes E2E
// para garantir que a Vercel publicou a versão mais recente.
//
// Para rodar: npx playwright test --reporter=line

const VERCEL_URL = 'https://minhas-financas-five-mu.vercel.app';

export default defineConfig({
  testDir: './tests/e2e',

  // Aumentado para compensar latência de rede
  timeout: 60_000,

  // Mais tentativas em caso de falha de rede
  retries: 2,

  // false para evitar conflitos no IndexedDB
  fullyParallel: false,

  reporter: [
    ['line'],
    ['html', { open: 'never', outputFolder: 'tests/reports/e2e' }],
  ],

  use: {
    baseURL: VERCEL_URL,
    screenshot: 'only-on-failure',
    storageState: undefined,
  },

  // webServer desativado — Termux não tem browser local.
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 30_000,
  // },

  projects: [
    {
      name: 'Chromium (Desktop)',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome (Android)',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
