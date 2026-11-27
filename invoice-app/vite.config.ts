import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import neon from './neon-vite-plugin.ts'
import {
  resolveRelease,
  resolveSourceMapUpload,
} from './src/lib/observability/build.ts'

// Sentry release, the same in the Worker, the browser and the source maps.
const release = resolveRelease(process.env, () =>
  execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }),
)
// Source maps are built and uploaded only when SENTRY_AUTH_TOKEN is set
// (environment, e.g. a Cloudflare build secret, or .env.sentry-build-plugin).
const sentryEnvFile = new URL('./.env.sentry-build-plugin', import.meta.url)
const upload = resolveSourceMapUpload(
  process.env,
  existsSync(sentryEnvFile) ? readFileSync(sentryEnvFile, 'utf8') : null,
)

const config = defineConfig(({ command }) => ({
  define: { __SENTRY_RELEASE__: JSON.stringify(release) },
  // 'hidden': maps are uploaded then deleted, and bundles do not point at them.
  build: { sourcemap: upload ? ('hidden' as const) : false },
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
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    neon,
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    command === 'build' && upload
      ? sentryVitePlugin({
          ...upload,
          telemetry: false,
          release: { name: release || undefined, setCommits: false },
          // Absolute (with '/' for the glob), so it works from any directory.
          sourcemaps: {
            filesToDeleteAfterUpload: [
              `${fileURLToPath(new URL('./dist', import.meta.url)).replaceAll('\\', '/')}/**/*.map`,
            ],
          },
          // A failed upload fails the build, so maps are never deployed.
          errorHandler: (error) => {
            throw error
          },
        })
      : null,
  ],
}))

export default config
