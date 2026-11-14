// Statuses of an adoption. The values are the ones the back-end stores and filters by; the
// labels are the ones shown to the user.
export const ADOPTION_STATUSES = [
  { value: 'IN_PROGRESS', label: 'En curso' },
  { value: 'FINALIZED', label: 'Finalizada' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

// Role name the back-end uses for the shelter administrator when it filters the adoption requests.
export const BACK_ADMIN_ROLE = 'ADMIN'
