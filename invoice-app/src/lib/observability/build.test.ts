// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { resolveRelease, resolveSourceMapUpload } from './build'

describe('resolveRelease', () => {
  it('uses SENTRY_RELEASE, then the git commit', () => {
    expect(resolveRelease({ SENTRY_RELEASE: 'v1' }, () => 'abc')).toBe('v1')
    expect(resolveRelease({}, () => 'abc123\n')).toBe('qaftr-web@abc123')
  })

  it('is empty when git is unavailable', () => {
    expect(
      resolveRelease({}, () => {
        throw new Error('no git')
      }),
    ).toBe('')
  })
})

describe('resolveSourceMapUpload', () => {
  const full = { SENTRY_AUTH_TOKEN: 't', SENTRY_ORG: 'o', SENTRY_PROJECT: 'p' }

  it('is off unless token, org and project are all set', () => {
    expect(resolveSourceMapUpload({}, null)).toBeNull()
    expect(resolveSourceMapUpload({ ...full, SENTRY_AUTH_TOKEN: '' }, null)).toBeNull()
    expect(resolveSourceMapUpload({ ...full, SENTRY_PROJECT: undefined }, null)).toBeNull()
  })

  it('reads the environment', () => {
    expect(resolveSourceMapUpload(full, null)).toEqual({ authToken: 't', org: 'o', project: 'p' })
  })

  it('reads the gitignored settings file, with the environment winning', () => {
    const file = '# local only\nSENTRY_AUTH_TOKEN="from-file"\nSENTRY_ORG=o\nSENTRY_PROJECT=p\n'
    expect(resolveSourceMapUpload({}, file)).toEqual({ authToken: 'from-file', org: 'o', project: 'p' })
    expect(resolveSourceMapUpload({ SENTRY_PROJECT: 'q' }, file)?.project).toBe('q')
  })
})
