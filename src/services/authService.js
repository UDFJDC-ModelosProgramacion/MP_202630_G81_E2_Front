import { api, resetCsrfToken } from './apiClient'

export function getCurrentUser() {
  return api.get('/auth/me')
}

export async function login(credentials) {
  const user = await api.post('/auth/login', credentials)
  resetCsrfToken()
  return user
}

export async function logout() {
  try {
    await api.post('/auth/logout', {})
  } finally {
    resetCsrfToken()
  }
}
