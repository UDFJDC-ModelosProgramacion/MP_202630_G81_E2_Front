import { describe, expect, it, vi } from 'vitest'
import { createUser, deleteUser, getUser, updateUser } from './userService'

vi.mock('./apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from './apiClient'

describe('userService', () => {
  it('calls api.post on createUser', async () => {
    const payload = {
      firstName: 'Anggel',
      lastName: 'Leal',
      email: 'anggel@example.com',
      password: 'password123',
      phone: '3001234567',
    }
    api.post.mockResolvedValueOnce({ id: 10, ...payload })

    const result = await createUser(payload)
    expect(api.post).toHaveBeenCalledWith('/users', payload)
    expect(result.id).toBe(10)
  })

  it('calls api.get on getUser', async () => {
    api.get.mockResolvedValueOnce({ id: 5, firstName: 'Luna', email: 'luna@example.com' })

    const result = await getUser(5)
    expect(api.get).toHaveBeenCalledWith('/users/5')
    expect(result.firstName).toBe('Luna')
  })

  it('calls api.put on updateUser', async () => {
    const updateData = {
      firstName: 'Anggel Updated',
      lastName: 'Leal',
      email: 'anggel_new@example.com',
      phone: '3109876543',
    }
    api.put.mockResolvedValueOnce({ id: 10, ...updateData })

    const result = await updateUser(10, updateData)
    expect(api.put).toHaveBeenCalledWith('/users/10', updateData)
    expect(result.firstName).toBe('Anggel Updated')
  })

  it('calls api.delete on deleteUser', async () => {
    api.delete.mockResolvedValueOnce(null)

    await deleteUser(10)
    expect(api.delete).toHaveBeenCalledWith('/users/10')
  })
})
