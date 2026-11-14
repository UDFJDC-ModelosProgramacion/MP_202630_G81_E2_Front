import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSession } from './roleSession'
import { getSession as getSharedSession } from './session'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('roleSession', () => {
  it('keeps the role of the shared session when VITE_ROLE is not set', () => {
    expect(getSession().role).toBe(getSharedSession().role)
  })

  it('overrides the role with VITE_ROLE and keeps the rest of the session', () => {
    vi.stubEnv('VITE_ROLE', 'ADOPTER')

    expect(getSession().role).toBe('ADOPTER')
    expect(getSession().userId).toBe(getSharedSession().userId)
  })
})
