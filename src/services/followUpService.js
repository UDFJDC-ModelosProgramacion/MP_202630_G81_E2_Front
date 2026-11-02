import { api } from './apiClient'

// The backend expects the administrator role as "ADMIN" when it checks access.
const ROLE_ALIASES = { SHELTER_ADMIN: 'ADMIN' }

const basePath = (adoptionId) => `/adoptions/${adoptionId}/followUps`

// Lists the follow-ups of an adoption. Pages sort them by date.
export function getFollowUps(adoptionId) {
  return api.get(basePath(adoptionId))
}

// Returns one follow-up. requesterId/role let the backend decide who may read it.
export function getFollowUp(adoptionId, followUpId, { requesterId, role } = {}) {
  const params = new URLSearchParams()
  if (requesterId != null) params.set('requesterId', requesterId)
  if (role) params.set('role', ROLE_ALIASES[role] ?? role)
  const query = params.toString()
  return api.get(`${basePath(adoptionId)}/${followUpId}${query ? `?${query}` : ''}`)
}

export function createFollowUp(adoptionId, followUp) {
  return api.post(basePath(adoptionId), followUp)
}

export function updateFollowUp(adoptionId, followUpId, followUp) {
  return api.put(`${basePath(adoptionId)}/${followUpId}`, followUp)
}

export function deleteFollowUp(adoptionId, followUpId) {
  return api.delete(`${basePath(adoptionId)}/${followUpId}`)
}
