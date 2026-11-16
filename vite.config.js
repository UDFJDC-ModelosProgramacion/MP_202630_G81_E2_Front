import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8999',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'vmThreads',
    maxWorkers: 2,
    env: { VITE_API_BASE_URL: '' },
    coverage: {
      reporter: [['text', { maxCols: 200 }], 'lcov'],
    },
  },
})