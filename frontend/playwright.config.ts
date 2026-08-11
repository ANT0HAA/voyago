import { defineConfig, devices } from '@playwright/test'

// E2E запускаются против собранной демо-версии (VITE_DEMO=1) — API работает в браузере,
// поэтому бэкенд не нужен; тесты проверяют весь пользовательский поток на статике.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx vite build && npx vite preview --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    env: { VITE_DEMO: '1' },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
