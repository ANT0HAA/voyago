/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// vite.config исполняется в Node; объявляем process без подключения @types/node.
declare const process: { env: Record<string, string | undefined> }

export default defineConfig({
  // Базовый путь для сборки под GitHub Pages (проект отдаётся из /<repo>/).
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8000' } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
