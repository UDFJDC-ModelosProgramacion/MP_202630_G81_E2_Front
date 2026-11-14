import { api } from './apiClient'

export function createShelter(shelter) {
  return api.post('/shelters', shelter)
}

export function getShelters({ city = '', location = '' } = {}) {
  const params = new URLSearchParams()
  if (city.trim()) params.set('city', city.trim())
  if (location.trim()) params.set('location', location.trim())
  const query = params.toString()
  return api.get(query ? `/shelters?${query}` : '/shelters')
}