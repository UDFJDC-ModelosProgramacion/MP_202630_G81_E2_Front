import { describe, expect, it } from 'vitest'
import { filterUsers } from './usersDirectory'

describe('usersDirectory filterUsers', () => {
  const users = [
    { id: 1, firstName: 'Anggel', lastName: 'Leal', email: 'anggel@test.com', role: 'ADOPTER' },
    { id: 2, firstName: 'Luna', lastName: 'Sandoval', email: 'luna@test.com', role: 'SHELTER_ADMIN' },
    { id: 3, firstName: 'Camilo', lastName: 'Ardila', email: 'camilo@vet.com', role: 'VETERINARIAN' },
  ]

  it('returns all users when no filter applied', () => {
    expect(filterUsers(users, { search: '', role: '' })).toHaveLength(3)
  })

  it('filters by name query', () => {
    const result = filterUsers(users, { search: 'anggel' })
    expect(result).toHaveLength(1)
    expect(result[0].firstName).toBe('Anggel')
  })

  it('filters by email query', () => {
    const result = filterUsers(users, { search: 'vet.com' })
    expect(result).toHaveLength(1)
    expect(result[0].firstName).toBe('Camilo')
  })

  it('filters by role', () => {
    const result = filterUsers(users, { role: 'SHELTER_ADMIN' })
    expect(result).toHaveLength(1)
    expect(result[0].firstName).toBe('Luna')
  })

  it('combines search query and role filter', () => {
    const result = filterUsers(users, { search: 'Luna', role: 'ADOPTER' })
    expect(result).toHaveLength(0)
  })
})
