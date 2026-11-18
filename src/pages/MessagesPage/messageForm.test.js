import { describe, expect, it } from 'vitest'
import {
  groupMessagesByConversation,
  MAX_MESSAGE_LENGTH,
  validateMessageContent,
} from './messageForm'

describe('messageForm logic', () => {
  it('validates required recipient and non-empty content', () => {
    expect(validateMessageContent('', 1, null)).toEqual({
      recipientId: 'Debe seleccionar un destinatario',
      content: 'El mensaje no puede estar vacío',
    })
  })

  it('rejects sending message to self', () => {
    expect(validateMessageContent('Hola', 1, 1)).toEqual({
      recipientId: 'No puedes enviarte un mensaje a ti mismo',
    })
  })

  it('rejects message exceeding max character limit', () => {
    const longText = 'a'.repeat(MAX_MESSAGE_LENGTH + 1)
    const errors = validateMessageContent(longText, 1, 2)
    expect(errors.content).toBe(`El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres`)
  })

  it('groups messages by conversation and tracks unread count', () => {
    const messages = [
      {
        id: 1,
        content: 'Hola',
        sendUser: { id: 2, firstName: 'Luna', email: 'luna@test.com' },
        receivesUser: { id: 1, firstName: 'Anggel' },
        isRead: false,
        sendDate: '2026-11-10T10:00:00Z',
      },
      {
        id: 2,
        content: 'Hola Luna',
        sendUser: { id: 1, firstName: 'Anggel' },
        receivesUser: { id: 2, firstName: 'Luna', email: 'luna@test.com' },
        isRead: true,
        sendDate: '2026-11-10T10:05:00Z',
      },
    ]

    const convs = groupMessagesByConversation(messages, 1)
    expect(convs).toHaveLength(1)
    expect(convs[0].partnerName).toBe('Luna')
    expect(convs[0].unreadCount).toBe(1)
    expect(convs[0].messages).toHaveLength(2)
  })
})
