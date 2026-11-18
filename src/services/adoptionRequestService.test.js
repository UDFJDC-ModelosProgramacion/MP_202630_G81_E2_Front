import { describe, expect, it, vi } from 'vitest'
import {
  createAdoptionRequest,
  deleteAdoptionRequest,
  getAdoptionRequest,
  getAllAdoptionRequests,
  updateAdoptionRequest,
} from './adoptionRequestService'

vi.mock('./apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from './apiClient'

describe('adoptionRequestService', () => {
  it('calls api.post on createAdoptionRequest', async () => {
    const payload = { adopter: { id: 1 }, pet: { id: 2 }, justification: 'Tengo mucho amor' }
    api.post.mockResolvedValueOnce({ id: 50, ...payload, status: 'PENDING' })

    const res = await createAdoptionRequest(payload)
    expect(api.post).toHaveBeenCalledWith('/adoption-requests', payload)
    expect(res.id).toBe(50)
  })

  it('calls api.get on getAdoptionRequest', async () => {
    api.get.mockResolvedValueOnce({ id: 50, status: 'PENDING' })

    const res = await getAdoptionRequest(50, 1, 'ADMIN')
    expect(api.get).toHaveBeenCalledWith(
      '/adoption-requests/50?currentUserId=1&currentUserRole=ADMIN',
    )
    expect(res.status).toBe('PENDING')
  })

  it('calls api.get with query params on getAllAdoptionRequests', async () => {
    api.get.mockResolvedValueOnce([{ id: 50 }])

    const res = await getAllAdoptionRequests({ adopterId: 1, status: 'PENDING' })
    expect(api.get).toHaveBeenCalledWith(
      '/adoption-requests?adopterId=1&status=PENDING&currentUserId=1&currentUserRole=ADMIN',
    )
    expect(res).toHaveLength(1)
  })

  it('calls api.put on updateAdoptionRequest', async () => {
    const payload = { status: 'APPROVED' }
    api.put.mockResolvedValueOnce({ id: 50, status: 'APPROVED' })

    const res = await updateAdoptionRequest(50, payload)
    expect(api.put).toHaveBeenCalledWith('/adoption-requests/50', payload)
    expect(res.status).toBe('APPROVED')
  })

  it('calls api.delete on deleteAdoptionRequest', async () => {
    api.delete.mockResolvedValueOnce(null)

    await deleteAdoptionRequest(50)
    expect(api.delete).toHaveBeenCalledWith('/adoption-requests/50')
  })
})
