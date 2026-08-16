import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/phil250-logic-trainer/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: { reporter: ['text', 'html'] },
  },
})
