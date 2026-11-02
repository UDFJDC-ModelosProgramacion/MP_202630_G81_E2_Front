// Extiende la sesión compartida con un override de rol para pruebas manuales
// (VITE_ROLE) sin modificar src/config/session.js, que pertenece a otro compañero.
import { ROLES, getSession as getSharedSession } from './session'

export { ROLES }

export function getSession() {
  const session = getSharedSession()
  return {
    ...session,
    role: import.meta.env.VITE_ROLE || session.role,
  }
}
