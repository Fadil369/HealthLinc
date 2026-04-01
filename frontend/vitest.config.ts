/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**'
      ]
    },
    // Parallel test execution for faster runs
    pool: 'threads',
    poolOptions: {
      threads: {
        // Use all available CPU cores for parallel execution
        minThreads: 1,
        maxThreads: undefined, // Auto-detect based on CPU cores
        useAtomics: true
      }
    },
    // Cache test results for faster subsequent runs
    cache: {
      dir: 'node_modules/.vitest'
    },
    // Healthcare-specific test configuration
    testTimeout: 10000, // 10s for insurance claim processing tests
    hookTimeout: 10000,
    // Watch mode excludes for better performance
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**'
    ]
  }
})