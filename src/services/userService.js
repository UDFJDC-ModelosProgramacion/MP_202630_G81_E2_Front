import { api } from './apiClient'

// Create a new user in the platform (HU73)
export function createUser(userData) {
  return api.post('/users', userData)
}

// Retrieve user details by ID (HU74)
export function getUser(userId) {
  return api.get(`/users/${userId}`)
}

// Update user details by ID (HU74)
export function updateUser(userId, userData) {
  return api.put(`/users/${userId}`, userData)
}

// Retrieve all registered users for administrators (HU75)
export function getAllUsers(role = 'ADMIN') {
  return api.get(`/users?role=${encodeURIComponent(role)}`)
}

// Delete user account by ID (HU76)
export function deleteUser(userId) {
  return api.delete(`/users/${userId}`)
}
