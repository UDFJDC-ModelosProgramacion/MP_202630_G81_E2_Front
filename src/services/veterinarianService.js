import { api } from './apiClient'


export function getVeterinarians({ specialization = '', availability = '' } = {}) {
  const params = new URLSearchParams()
  if (specialization.trim()) params.set('specialization', specialization.trim())
  if (availability.trim()) params.set('availability', availability.trim())
  const query = params.toString()
  return api.get(query ? `/veterinarians?${query}` : '/veterinarians')
}

export function getVeterinarian(veterinarianId) {
  return api.get(`/veterinarians/${encodeURIComponent(veterinarianId)}`)
}


export function createVeterinarian(veterinarian) {
  return api.post('/veterinarians', veterinarian)
}
