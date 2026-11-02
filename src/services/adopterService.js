import { api } from './apiClient'

// Creates a new adopter. The backend rejects duplicated emails and national ids (412).
export function createAdopter(adopter) {
  return api.post('/adopters', adopter)
}
