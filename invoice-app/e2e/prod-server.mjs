// Builds the production worker and serves it with `vite preview` (workerd via
// the Cloudflare plugin) for `bun run e2e:prod`.
//
// Production better-auth refuses to run with its default secret, and the build
// only copies `.env` into dist/server/.dev.vars. For a local preview we append
// a throwaway test secret to that build output (never to source or .env).
import { execSync, spawn } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const port = process.argv[2] ?? '9012'

if (process.env.E2E_SKIP_BUILD !== '1') {
  execSync('npx vite build', { cwd: root, stdio: 'inherit' })
}

const devVars = resolve(root, 'dist/server/.dev.vars')
const current = existsSync(devVars) ? readFileSync(devVars, 'utf8') : ''
if (!/^BETTER_AUTH_SECRET=/m.test(current)) {
  appendFileSync(
    devVars,
    `${current.endsWith('\n') || !current ? '' : '\n'}BETTER_AUTH_SECRET=e2e-local-preview-only-${Date.now()}\n`,
  )
}

if (!/^\d+$/.test(port)) throw new Error(`bad port: ${port}`)
const child = spawn(`npx vite preview --port ${port} --strictPort`, {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})
const stop = () => child.kill()
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
child.on('exit', (code) => process.exit(code ?? 0))
