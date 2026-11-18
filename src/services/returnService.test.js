import { describe, expect, it, vi } from 'vitest'
import {
  createReturn,
  deleteReturn,
  getAllReturns,
  getReturn,
  updateReturn,
} from './returnService'

vi.mock('./apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from './apiClient'

describe('returnService', () => {
  it('calls api.post on createReturn', async () => {
    const payload = { adoption: { id: 1 }, reason: 'Alergia severa en el hogar' }
    api.post.mockResolvedValueOnce({ id: 1, ...payload })

    const res = await createReturn(payload)
    expect(api.post).toHaveBeenCalledWith('/returns', payload)
    expect(res.id).toBe(1)
  })

  it('calls api.get on getReturn', async () => {
    api.get.mockResolvedValueOnce({ id: 1, reason: 'Alergia' })

    const res = await getReturn(1)
    expect(api.get).toHaveBeenCalledWith('/returns/1')
    expect(res.reason).toBe('Alergia')
  })

  it('calls api.get on getAllReturns with query params', async () => {
    api.get.mockResolvedValueOnce([{ id: 1 }])

    const res = await getAllReturns({ shelterId: 2 })
    expect(api.get).toHaveBeenCalledWith('/returns?shelterId=2')
    expect(res).toHaveLength(1)
  })

  it('calls api.put on updateReturn', async () => {
    const payload = { reason: 'Motivo actualizado' }
    api.put.mockResolvedValueOnce({ id: 1, ...payload })

    const res = await updateReturn(1, payload)
    expect(api.put).toHaveBeenCalledWith('/returns/1', payload)
    expect(res.reason).toBe('Motivo actualizado')
  })

  it('calls api.delete on deleteReturn', async () => {
    api.delete.mockResolvedValueOnce(null)

    await deleteReturn(1)
    expect(api.delete).toHaveBeenCalledWith('/returns/1')
  })
})
