import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import viteReact from '@vitejs/plugin-react'

// Vitest uses this config instead of vite.config.ts. The Cloudflare and
// TanStack Start plugins rewrite the SSR environment in ways vitest cannot
// run, so tests only get React + path aliases.
export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: [
      {
        find: /^#\/(.*)$/,
        replacement: fileURLToPath(new URL('./src/$1', import.meta.url)),
      },
      {
        find: '@zatca/shared',
        replacement: fileURLToPath(
          new URL('../packages/shared/src/index.ts', import.meta.url),
        ),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    // jsdom + Radix renders can exceed 5s when Playwright shares the CPU.
    testTimeout: 20_000,
  },
})
