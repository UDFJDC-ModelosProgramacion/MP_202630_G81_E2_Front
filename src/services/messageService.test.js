import { describe, expect, it, vi } from 'vitest'
import {
  createMessage,
  deleteMessage,
  getAllMessages,
  getMessage,
  updateMessage,
} from './messageService'

vi.mock('./apiClient', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from './apiClient'

describe('messageService', () => {
  it('calls api.post on createMessage with query param', async () => {
    const payload = {
      sendUser: { id: 1 },
      receivesUser: { id: 2 },
      content: 'Hola, tengo una pregunta sobre la mascota',
    }
    api.post.mockResolvedValueOnce({ id: 100, ...payload })

    const res = await createMessage(payload, 1)
    expect(api.post).toHaveBeenCalledWith('/messages?currentUserId=1', payload)
    expect(res.id).toBe(100)
  })

  it('calls api.get on getMessage', async () => {
    api.get.mockResolvedValueOnce({ id: 100, content: 'Hola' })

    const res = await getMessage(100, 1)
    expect(api.get).toHaveBeenCalledWith('/messages/100?currentUserId=1')
    expect(res.content).toBe('Hola')
  })

  it('calls api.get on getAllMessages', async () => {
    api.get.mockResolvedValueOnce([{ id: 100 }, { id: 101 }])

    const res = await getAllMessages(1)
    expect(api.get).toHaveBeenCalledWith('/messages?currentUserId=1')
    expect(res).toHaveLength(2)
  })

  it('calls api.put on updateMessage', async () => {
    const payload = { isRead: true }
    api.put.mockResolvedValueOnce({ id: 100, isRead: true })

    const res = await updateMessage(100, payload, 1)
    expect(api.put).toHaveBeenCalledWith('/messages/100?currentUserId=1', payload)
    expect(res.isRead).toBe(true)
  })

  it('calls api.delete on deleteMessage', async () => {
    api.delete.mockResolvedValueOnce(null)

    await deleteMessage(100, 1)
    expect(api.delete).toHaveBeenCalledWith('/messages/100?currentUserId=1')
  })
})
