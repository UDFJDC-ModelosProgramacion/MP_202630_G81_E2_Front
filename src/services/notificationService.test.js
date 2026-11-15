import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './apiClient'
import {
    createNotification,
    deleteNotification,
    getNotification,
    getNotifications,
    updateNotification,
} from './notificationService'

function mockFetch(response) {
    const fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
}

const okResponse = (body, status = 200) => ({
    ok: true,
    status,
    json: () => Promise.resolve(body),
})

const errorResponse = (status, message) => ({
    ok: false,
    status,
    json: () => Promise.resolve({ apierror: { status: 'ERROR', message } }),
})

const NOTIFICATION = {
    message: 'Recordatorio',
    channel: 'EMAIL',
    date: '2026-10-14',
    time: '2026-10-14T09:30:00.000Z',
    content: 'Texto',
}

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('getNotifications', () => {
    it('requests every notification of the user when there are no filters', async () => {
        const fetchMock = mockFetch(okResponse([{ id: 1 }]))

        const result = await getNotifications(7)

        expect(result).toEqual([{ id: 1 }])
        expect(fetchMock).toHaveBeenCalledWith('/api/users/7/notifications', expect.any(Object))
    })

    it('works when the filters object is omitted or empty', async () => {
        const fetchMock = mockFetch(okResponse([]))

        await getNotifications(7, {})

        expect(fetchMock.mock.calls[0][0]).toBe('/api/users/7/notifications')
    })

    it('sends both dates as query parameters', async () => {
        const fetchMock = mockFetch(okResponse([]))

        await getNotifications(7, { startDate: ' 2026-10-01 ', endDate: '2026-10-31' })

        const url = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
        expect(url.pathname).toBe('/api/users/7/notifications')
        expect(url.searchParams.get('startDate')).toBe('2026-10-01')
        expect(url.searchParams.get('endDate')).toBe('2026-10-31')
    })

    it('leaves out blank or missing dates', async () => {
        const fetchMock = mockFetch(okResponse([]))

        await getNotifications(7, { startDate: '   ', endDate: '2026-10-31' })
        await getNotifications(7, { startDate: '2026-10-01' })

        const first = new URL(fetchMock.mock.calls[0][0], 'http://localhost')
        const second = new URL(fetchMock.mock.calls[1][0], 'http://localhost')
        expect(first.searchParams.has('startDate')).toBe(false)
        expect(first.searchParams.get('endDate')).toBe('2026-10-31')
        expect(second.searchParams.get('startDate')).toBe('2026-10-01')
        expect(second.searchParams.has('endDate')).toBe(false)
    })

    it('fails with the message sent by the back-end', async () => {
        mockFetch(errorResponse(404, 'User not found'))

        const error = await getNotifications(999).catch((e) => e)

        expect(error).toBeInstanceOf(ApiError)
        expect(error.status).toBe(404)
        expect(error.message).toBe('User not found')
    })
})

describe('getNotification', () => {
    it('requests one notification of the user', async () => {
        const fetchMock = mockFetch(okResponse({ id: 5 }))

        const result = await getNotification(7, 5)

        expect(result).toEqual({ id: 5 })
        expect(fetchMock).toHaveBeenCalledWith('/api/users/7/notifications/5', expect.any(Object))
    })

    it('encodes the ids so they cannot change the path', async () => {
        const fetchMock = mockFetch(okResponse({}))

        await getNotification('7/../8', '5/../6')

        expect(fetchMock.mock.calls[0][0]).toBe('/api/users/7%2F..%2F8/notifications/5%2F..%2F6')
    })
})

describe('createNotification', () => {
    it('posts the notification as JSON', async () => {
        const fetchMock = mockFetch(okResponse({ id: 9, ...NOTIFICATION }, 201))

        const result = await createNotification(7, NOTIFICATION)

        expect(result).toEqual({ id: 9, ...NOTIFICATION })
        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/users/7/notifications')
        expect(options.method).toBe('POST')
        expect(JSON.parse(options.body)).toEqual(NOTIFICATION)
    })

    it('fails with the message sent by the back-end', async () => {
        mockFetch(errorResponse(412, 'Notification channel is not valid'))

        const error = await createNotification(7, NOTIFICATION).catch((e) => e)

        expect(error.status).toBe(412)
        expect(error.message).toBe('Notification channel is not valid')
    })
})

describe('updateNotification', () => {
    it('puts the notification as JSON on its url', async () => {
        const fetchMock = mockFetch(okResponse({ id: 5, ...NOTIFICATION }))

        const result = await updateNotification(7, 5, NOTIFICATION)

        expect(result).toEqual({ id: 5, ...NOTIFICATION })
        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/users/7/notifications/5')
        expect(options.method).toBe('PUT')
        expect(JSON.parse(options.body)).toEqual(NOTIFICATION)
    })

    it('fails when the channel of a sent notification is changed', async () => {
        mockFetch(
            errorResponse(412, 'The channel cannot be modified once the notification has been sent'),
        )

        const error = await updateNotification(7, 5, NOTIFICATION).catch((e) => e)

        expect(error.message).toBe(
            'The channel cannot be modified once the notification has been sent',
        )
    })
})

describe('deleteNotification', () => {
    it('sends a DELETE and accepts the empty answer (204)', async () => {
        const fetchMock = mockFetch({ ok: true, status: 204 })

        const result = await deleteNotification(7, 5)

        expect(result).toBeNull()
        const [url, options] = fetchMock.mock.calls[0]
        expect(url).toBe('/api/users/7/notifications/5')
        expect(options.method).toBe('DELETE')
    })

    it('fails when the notification was already sent', async () => {
        mockFetch(errorResponse(412, 'A notification that has already been sent cannot be deleted'))

        const error = await deleteNotification(7, 5).catch((e) => e)

        expect(error).toBeInstanceOf(ApiError)
        expect(error.status).toBe(412)
    })
})