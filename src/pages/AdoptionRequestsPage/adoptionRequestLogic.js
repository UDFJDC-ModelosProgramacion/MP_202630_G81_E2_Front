// Validate adoption request submission (HU81)
export function validateAdoptionRequest(justification, petId) {
  const errors = {}

  if (!petId) {
    errors.petId = 'Debe seleccionar una mascota'
  }

  if (!justification || !justification.trim()) {
    errors.justification = 'La justificación es obligatoria'
  } else if (justification.trim().length < 10) {
    errors.justification = 'La justificación debe tener al menos 10 caracteres'
  }

  return errors
}

// Filter adoption requests list (HU82, HU83)
export function filterAdoptionRequests(requests = [], { petName = '', status = '' } = {}) {
  const query = petName.trim().toLowerCase()
  const statusFilter = status.trim().toUpperCase()

  return requests.filter((r) => {
    const petTitle = (r.pet?.name || '').toLowerCase()
    const matchesPet = !query || petTitle.includes(query)
    const matchesStatus = !statusFilter || (r.status || '').toUpperCase() === statusFilter

    return matchesPet && matchesStatus
  })
}
