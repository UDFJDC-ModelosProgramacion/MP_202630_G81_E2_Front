import { vi } from 'vitest'

const csrfResponse = {
  ok: true,
  status: 200,
  json: () => Promise.resolve({ token: 'test-csrf-token' }),
}

export function stubApiFetch(fetchMock) {
  vi.stubGlobal('fetch', (url, ...args) =>
    String(url).endsWith('/auth/csrf')
      ? Promise.resolve(csrfResponse)
      : fetchMock(url, ...args),
  )
  return fetchMock
}
