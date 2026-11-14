import { api } from './apiClient'

// Creates a new adopter. The backend rejects duplicated emails and national ids (412).
export function createAdopter(adopter) {
  return api.post('/adopters', adopter)
}

// Lists adopters. The backend only accepts the filters nationalId, housingType and
// occupation; sending all of them blank returns 412, so blank filters are omitted.
export function getAdopters({ nationalId = '', housingType = '', occupation = '' } = {}) {
  const params = new URLSearchParams()
  if (nationalId.trim()) params.set('nationalId', nationalId.trim())
  if (housingType.trim()) params.set('housingType', housingType.trim())
  if (occupation.trim()) params.set('occupation', occupation.trim())
  const query = params.toString()
  return api.get(query ? `/adopters?${query}` : '/adopters')
}

// Returns one adopter with its personal data and trial cohabitation history.
export function getAdopter(id) {
  return api.get(`/adopters/${id}`)
}

// Updates the editable fields of an adopter (address, occupation, earnings,
// housing type, allergies and household data). Identity data is kept intact.
export function updateAdopter(id, adopter) {
  return api.put(`/adopters/${id}`, adopter)
}

// Deletes an adopter. The backend answers 412 when it has active adoption requests.
export function deleteAdopter(id) {
  return api.delete(`/adopters/${id}`)
}
