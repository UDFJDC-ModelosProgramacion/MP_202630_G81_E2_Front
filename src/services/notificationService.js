import { api } from './apiClient'

const notificationsPath = (userId) => `/users/${encodeURIComponent(userId)}/notifications`
const notificationPath = (userId, notificationId) =>
    `${notificationsPath(userId)}/${encodeURIComponent(notificationId)}`


export function getNotifications(userId, { startDate, endDate } = {}) {
    const params = new URLSearchParams()
    if (startDate?.trim()) params.set('startDate', startDate.trim())
    if (endDate?.trim()) params.set('endDate', endDate.trim())
    const query = params.toString()
    return api.get(query ? `${notificationsPath(userId)}?${query}` : notificationsPath(userId))
}

export const getNotification = (userId, notificationId) =>
    api.get(notificationPath(userId, notificationId))

export const createNotification = (userId, notification) =>
    api.post(notificationsPath(userId), notification)

export const updateNotification = (userId, notificationId, notification) =>
    api.put(notificationPath(userId, notificationId), notification)

export const deleteNotification = (userId, notificationId) =>
    api.delete(notificationPath(userId, notificationId))