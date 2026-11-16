const WHITESPACE = /\s/

export function isValidEmail(value) {
  if (typeof value !== 'string' || WHITESPACE.test(value)) return false

  const atIndex = value.indexOf('@')
  if (atIndex <= 0 || atIndex !== value.lastIndexOf('@')) return false

  const dotIndex = value.indexOf('.', atIndex + 2)
  return dotIndex > atIndex + 1 && dotIndex < value.length - 1
}
