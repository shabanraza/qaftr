/**
 * Build-time helpers for vite.config.ts (not bundled into the app): the release
 * name, and whether source maps can be uploaded.
 */
import { parseEnv } from 'node:util'

type Env = Record<string, string | undefined>

export function resolveRelease(env: Env, gitCommit: () => string): string {
  if (env.SENTRY_RELEASE) return env.SENTRY_RELEASE
  try {
    return `qaftr-web@${gitCommit().trim()}`
  } catch {
    return ''
  }
}

/**
 * `file` is the text of the gitignored `.env.sentry-build-plugin`, which
 * neither Vite nor Wrangler loads, so the token stays out of the Worker.
 */
export function resolveSourceMapUpload(env: Env, file: string | null) {
  const vars: Env = { ...(file ? parseEnv(file) : {}), ...env }
  const authToken = vars.SENTRY_AUTH_TOKEN
  if (!authToken) return null
  return {
    authToken,
    org: vars.SENTRY_ORG || 'hisaab-kro',
    project: vars.SENTRY_PROJECT || 'qaftr-web',
  }
}
