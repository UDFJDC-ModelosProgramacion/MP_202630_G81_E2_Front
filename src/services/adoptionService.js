import { api } from './apiClient'

export function createAdoption(adoption) {
  return api.post('/adoptions', adoption)
}
