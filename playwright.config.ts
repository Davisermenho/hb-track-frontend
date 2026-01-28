import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente:
// 1. .env.test para configurações de teste
// 2. .env.local para credenciais locais (fallback)
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

/**
 * Configuração DETERMINÍSTICA do Playwright para testes E2E
 * 
 * Princípios (REGRAS TESTES.md):
 * - workers: 1 → evita race conditions em estado compartilhado (Regra 10)
 * - retries: 0 → detecta flakiness imediatamente (Regra 10)
 * - fullyParallel: false → execução sequencial previsível (Regra 11)
 * - trace/screenshot/video em falha → diagnóstico (Regra 12)
 * 
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Global teardown para limpeza de dados E2E */
  globalTeardown: './tests/e2e/setup/global-teardown.ts',
  
  /* Timeout máximo por teste */
  timeout: 90 * 1000,
  
  /* Timeout para expect() */
  expect: {
    timeout: 15000,
  },
  
  /* Execução SEQUENCIAL para determinismo */
  fullyParallel: false,
  
  /* Falhar a build se houver test.only() no CI */
  forbidOnly: !!process.env.CI,
  
  /* ZERO retries para detectar flakiness (Regra 10) */
  retries: 0,
  
  /* ÚNICO worker para evitar race conditions (Regra 10, 26) */
  workers: 1,
  
  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  
  /* Configuração compartilhada */
  use: {
    /* URL base do frontend */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    /* Coletar trace em caso de falha */
    trace: 'on-first-retry',
    
    /* Screenshot em falhas */
    screenshot: 'only-on-failure',
    
    /* Vídeo em falhas */
    video: 'retain-on-failure',
    
    /* Headless por padrão */
    headless: true,
    
    /* Viewport */
    viewport: { width: 1280, height: 720 },
    
    /* Ignorar erros de HTTPS */
    ignoreHTTPSErrors: true,
    
    /* Locale */
    locale: 'pt-BR',
    
    /* Timezone */
    timezoneId: 'America/Sao_Paulo',
  },

  /* Configuração de projetos (browsers) */
  projects: [
    /* Setup: fazer login e salvar estados para diferentes roles */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      testDir: './tests/e2e/setup',
      timeout: 5 * 60 * 1000, // 5 minutos para lidar com rate limit
    },
    
    /* Chrome Desktop - usuário padrão */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    /* Chrome Desktop - admin (testes RBAC) */
    {
      name: 'chromium-admin',
      testMatch: /.*\.admin\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    
    /* Chrome Desktop - coach/treinador (testes RBAC) */
    {
      name: 'chromium-coach',
      testMatch: /.*\.coach\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/coach.json',
      },
      dependencies: ['setup'],
    },
    
    /* Chrome Desktop - membro (testes RBAC permissões mínimas) */
    {
      name: 'chromium-membro',
      testMatch: /.*\.membro\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/membro.json',
      },
      dependencies: ['setup'],
    },
    
    /* Firefox Desktop */
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Safari Desktop */
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    /* Testes sem autenticação */
    {
      name: 'unauthenticated',
      testMatch: /.*\.unauth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Servidor de desenvolvimento */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
