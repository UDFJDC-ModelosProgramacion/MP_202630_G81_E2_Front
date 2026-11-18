// Filter users by search term (name, email) and role
export function filterUsers(users = [], { search = '', role = '' } = {}) {
  const query = search.trim().toLowerCase()
  const roleFilter = role.trim().toUpperCase()

  return users.filter((user) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()
    const email = (user.email || '').toLowerCase()
    const matchesSearch = !query || fullName.includes(query) || email.includes(query)

    const userRole = (user.role || (user.shelter ? 'SHELTER_ADMIN' : 'ADOPTER')).toUpperCase()
    const matchesRole = !roleFilter || userRole === roleFilter

    return matchesSearch && matchesRole
  })
}
