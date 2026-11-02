import { api } from './apiClient'

export function createShelter(shelter) {
  return api.post('/shelters', shelter)
}