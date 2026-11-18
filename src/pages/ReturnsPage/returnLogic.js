// Validate return justification (HU85, HU88)
export function validateReturnReason(reason, petId) {
  const errors = {}

  if (!petId) {
    errors.petId = 'Debe seleccionar una mascota para la devolución'
  }

  if (!reason || !reason.trim()) {
    errors.reason = 'El motivo de la devolución es obligatorio'
  } else if (reason.trim().length < 10) {
    errors.reason = 'El motivo debe tener al menos 10 caracteres'
  }

  return errors
}

// Filter pet returns list (HU86)
export function filterReturns(returns = [], { petName = '', adopterName = '' } = {}) {
  const petQuery = petName.trim().toLowerCase()
  const adopterQuery = adopterName.trim().toLowerCase()

  return returns.filter((item) => {
    const petTitle = (item.pet?.name || item.adoption?.pet?.name || '').toLowerCase()
    const adopterTitle = `${item.adopter?.firstName || item.adoption?.adopter?.firstName || ''} ${
      item.adopter?.lastName || item.adoption?.adopter?.lastName || ''
    }`.toLowerCase()

    const matchesPet = !petQuery || petTitle.includes(petQuery)
    const matchesAdopter = !adopterQuery || adopterTitle.includes(adopterQuery)

    return matchesPet && matchesAdopter
  })
}
