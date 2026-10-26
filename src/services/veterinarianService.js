import { api } from './apiClient'

// Lists the veterinarians, optionally filtered by specialization and/or availability.
// The backend compares both filters ignoring case. Each item also carries its
// followUps and medicalEvents.
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
