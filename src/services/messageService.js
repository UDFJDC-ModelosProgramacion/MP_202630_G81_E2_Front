import { api } from './apiClient'

// Create a new direct message (HU77)
export function createMessage(messageData, currentUserId = 1) {
  return api.post(`/messages?currentUserId=${encodeURIComponent(currentUserId)}`, messageData)
}

// Retrieve message detail by ID (HU78)
export function getMessage(messageId, currentUserId = 1) {
  return api.get(`/messages/${messageId}?currentUserId=${encodeURIComponent(currentUserId)}`)
}

// Retrieve all messages for the current user (HU78)
export function getAllMessages(currentUserId = 1) {
  return api.get(`/messages?currentUserId=${encodeURIComponent(currentUserId)}`)
}

// Update a message (e.g. mark as read or edit) (HU79)
export function updateMessage(messageId, messageData, currentUserId = 1) {
  return api.put(
    `/messages/${messageId}?currentUserId=${encodeURIComponent(currentUserId)}`,
    messageData,
  )
}

// Logically or permanently delete message (HU80)
export function deleteMessage(messageId, currentUserId = 1) {
  return api.delete(`/messages/${messageId}?currentUserId=${encodeURIComponent(currentUserId)}`)
}
