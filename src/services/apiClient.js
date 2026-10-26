// Shared HTTP client. Requests go to "/api", which Vite forwards to the Spring Boot
// backend (see vite.config.js). Set VITE_API_BASE_URL to point somewhere else.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const CONNECTION_ERROR = 'No se pudo conectar con el servidor. Inténtalo de nuevo.'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// The backend answers errors as { apierror: { status, timestamp, message } } (CT1).
async function readErrorMessage(response) {
  try {
    const body = await response.json()
    return body?.apierror?.message ?? `Error ${response.status}`
  } catch {
    return `Error ${response.status}`
  }
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError(CONNECTION_ERROR, 0)
  }
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  if (response.status === 204) return null
  return response.json()
}

export const api = {
  get: (path) => request(path),
}
