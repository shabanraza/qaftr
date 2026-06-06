import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import neon from './neon-vite-plugin.ts'

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@better-auth/kysely-adapter': new URL(
        './src/lib/stubs/kysely-adapter.ts',
        import.meta.url,
      ).pathname,
    },
  },
  optimizeDeps: {
    exclude: ['@better-auth/kysely-adapter', 'kysely'],
  },
  plugins: [
    devtools(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/paraglide',
      strategy: ['url', 'baseLocale'],
    }),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    neon,
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
