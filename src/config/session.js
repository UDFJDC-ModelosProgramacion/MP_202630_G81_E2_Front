export const ROLES = {
  ADMIN: 'ADMIN',
  SHELTER_ADMIN: 'SHELTER_ADMIN',
  VETERINARIAN: 'VETERINARIAN',
  ADOPTER: 'ADOPTER',
  VISITOR: 'VISITOR',
}

const SIGNED_OUT_SESSION = Object.freeze({
  userId: null,
  email: '',
  name: '',
  role: ROLES.VISITOR,
  shelterId: null,
})

let currentSession = SIGNED_OUT_SESSION

export function getSession() {
  return currentSession
}

export function setSession(user) {
  if (!user) {
    currentSession = SIGNED_OUT_SESSION
    return currentSession
  }

  const email = user.email ?? ''
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || email
  currentSession = {
    userId: user.id ?? user.userId ?? null,
    email,
    name,
    role: user.role ?? ROLES.VISITOR,
    shelterId: user.shelterId ?? user.shelter?.id ?? null,
  }
  return currentSession
}
