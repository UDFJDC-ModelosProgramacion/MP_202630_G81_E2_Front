export const MAX_MESSAGE_LENGTH = 1000

// Validate message content before submission (HU77)
export function validateMessageContent(content, senderId, recipientId) {
  const errors = {}

  if (!recipientId) {
    errors.recipientId = 'Debe seleccionar un destinatario'
  } else if (Number(recipientId) === Number(senderId)) {
    errors.recipientId = 'No puedes enviarte un mensaje a ti mismo'
  }

  if (!content || !content.trim()) {
    errors.content = 'El mensaje no puede estar vacío'
  } else if (content.length > MAX_MESSAGE_LENGTH) {
    errors.content = `El mensaje no puede exceder ${MAX_MESSAGE_LENGTH} caracteres`
  }

  return errors
}

// Group messages into distinct conversations by contact user
export function groupMessagesByConversation(messages = [], currentUserId = 1) {
  const convMap = new Map()

  messages.forEach((msg) => {
    const isSender = msg.sendUser?.id === currentUserId
    const partner = isSender ? msg.receivesUser : msg.sendUser
    const partnerId = partner?.id || (isSender ? msg.receivesUserId : msg.sendUserId) || 0

    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, {
        partnerId,
        partnerName: partner
          ? `${partner.firstName || ''} ${partner.lastName || ''}`.trim() || partner.email || `Usuario ${partnerId}`
          : `Usuario ${partnerId}`,
        partnerEmail: partner?.email || '',
        messages: [],
        unreadCount: 0,
        lastMessageDate: msg.sendDate || msg.createdAt || '',
      })
    }

    const conv = convMap.get(partnerId)
    conv.messages.push(msg)

    // Unread count: message received by current user with isRead false
    if (!isSender && !msg.isRead) {
      conv.unreadCount++
    }

    const msgDate = msg.sendDate || msg.createdAt || ''
    if (msgDate > conv.lastMessageDate) {
      conv.lastMessageDate = msgDate
    }
  })

  // Sort conversations by most recent message date
  return Array.from(convMap.values()).sort((a, b) =>
    (b.lastMessageDate || '').localeCompare(a.lastMessageDate || ''),
  )
}
