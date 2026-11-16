import { describe, expect, it } from 'vitest'
import { getSession, ROLES, setSession } from './session'

describe('authenticated session', () => {
  it('maps the backend authentication response without persisting it', () => {
    expect(setSession({ id: 12, email: 'admin@example.com', role: ROLES.SHELTER_ADMIN, shelterId: 4 }))
      .toEqual({
        userId: 12,
        email: 'admin@example.com',
        name: 'admin@example.com',
        role: ROLES.SHELTER_ADMIN,
        shelterId: 4,
      })
  })

  it('clears the session on sign out', () => {
    setSession({ id: 12, email: 'admin@example.com', role: ROLES.ADMIN })

    expect(setSession(null)).toEqual({
      userId: null,
      email: '',
      name: '',
      role: ROLES.VISITOR,
      shelterId: null,
    })
    expect(getSession().userId).toBeNull()
  })
})
