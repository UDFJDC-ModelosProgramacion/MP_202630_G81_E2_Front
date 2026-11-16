const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')

const CONNECTION_ERROR = 'No se pudo conectar con el servidor. Inténtelo de nuevo.'

let csrfToken = null
let csrfRequest = null

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function expectArray(data, resource) {
  if (Array.isArray(data)) return data
  throw new ApiError(`La respuesta del servidor para ${resource} no tiene un formato válido.`, 502)
}

export function resetCsrfToken() {
  csrfToken = null
  csrfRequest = null
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken
  if (!csrfRequest) {
    csrfRequest = request('/auth/csrf')
      .then((data) => {
        if (typeof data?.token !== 'string' || !data.token.trim()) {
          throw new ApiError('El servidor no devolvió un token CSRF válido.', 502)
        }
        csrfToken = data.token
        return csrfToken
      })
      .finally(() => {
        csrfRequest = null
      })
  }
  return csrfRequest
}

async function readErrorMessage(response) {
  try {
    const body = await response.json()
    return body?.apierror?.message ?? `Error ${response.status}`
  } catch {
    return `Error ${response.status}`
  }
}

export async function request(path, options = {}) {
  const method = options.method ?? 'GET'
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    headers['X-XSRF-TOKEN'] = await getCsrfToken()
  }

  let response
  try {
    const fetchOptions = {
      ...options,
      credentials: 'include',
      headers,
    }
    if (options.method !== undefined) fetchOptions.method = method

    response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
    })
  } catch {
    throw new ApiError(CONNECTION_ERROR, 0)
  }
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  if (response.status === 204) return null
  try {
    return await response.json()
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError('El servidor devolvió una respuesta inválida.', 502)
    }
    throw error
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
