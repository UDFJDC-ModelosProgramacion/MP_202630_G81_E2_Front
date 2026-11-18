import { api } from './apiClient'

// Create a new return record (HU85)
export function createReturn(returnData) {
  return api.post('/returns', returnData)
}

// Retrieve return details by ID (HU87)
export function getReturn(returnId) {
  return api.get(`/returns/${returnId}`)
}

// Retrieve list of returns with optional filters (HU86)
export function getAllReturns({ shelterId, petId, userId } = {}) {
  const params = new URLSearchParams()
  if (shelterId) params.set('shelterId', shelterId)
  if (petId) params.set('petId', petId)
  if (userId) params.set('userId', userId)

  const query = params.toString()
  return api.get(query ? `/returns?${query}` : '/returns')
}

// Update return reason and details (HU88)
export function updateReturn(returnId, returnData) {
  return api.put(`/returns/${returnId}`, returnData)
}

// Delete return record (HU88 audit rule)
export function deleteReturn(returnId) {
  return api.delete(`/returns/${returnId}`)
}
