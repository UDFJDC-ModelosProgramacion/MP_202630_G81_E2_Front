// The backend has no login yet, so the user and their role are simulated here
export const ROLES = {
  SHELTER_ADMIN: 'SHELTER_ADMIN',
  VETERINARIAN: 'VETERINARIAN',
  ADOPTER: 'ADOPTER',
  VISITOR: 'VISITOR',
}

export function getSession() {
  return {
    userId: Number(import.meta.env.VITE_USER_ID) || 1,
    name: 'AdminUser',
    role: ROLES.SHELTER_ADMIN,
    shelterId: Number(import.meta.env.VITE_SHELTER_ID) || 1,
  }
}