import { api } from './apiClient'

// Create a new adoption request (HU81)
export function createAdoptionRequest(requestData) {
  return api.post('/adoption-requests', requestData)
}

// Retrieve adoption request details by ID (HU82)
export function getAdoptionRequest(requestId, currentUserId = 1, currentUserRole = 'ADMIN') {
  return api.get(
    `/adoption-requests/${requestId}?currentUserId=${encodeURIComponent(
      currentUserId,
    )}&currentUserRole=${encodeURIComponent(currentUserRole)}`,
  )
}

// Retrieve adoption requests with optional filters (HU82, HU83)
export function getAllAdoptionRequests({
  adopterId,
  petId,
  status,
  currentUserId = 1,
  currentUserRole = 'ADMIN',
} = {}) {
  const params = new URLSearchParams()
  if (adopterId) params.set('adopterId', adopterId)
  if (petId) params.set('petId', petId)
  if (status) params.set('status', status)
  params.set('currentUserId', currentUserId)
  params.set('currentUserRole', currentUserRole)

  return api.get(`/adoption-requests?${params.toString()}`)
}

// Update adoption request (e.g. approve or reject) (HU83)
export function updateAdoptionRequest(requestId, requestData) {
  return api.put(`/adoption-requests/${requestId}`, requestData)
}

// Cancel or delete pending adoption request (HU84)
export function deleteAdoptionRequest(requestId) {
  return api.delete(`/adoption-requests/${requestId}`)
}
