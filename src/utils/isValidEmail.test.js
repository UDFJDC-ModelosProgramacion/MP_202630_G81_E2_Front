import { describe, expect, it } from 'vitest'
import { isValidEmail } from './isValidEmail'

describe('isValidEmail', () => {
  it.each(['user@example.com', 'user+tag@sub.example.com'])('accepts %s', (value) => {
    expect(isValidEmail(value)).toBe(true)
  })

  it.each(['', 'user', 'user@example', '@example.com', 'user@@example.com', 'user @example.com'])(
    'rejects %s',
    (value) => {
      expect(isValidEmail(value)).toBe(false)
    },
  )

  it('handles a long malformed address', () => {
    expect(isValidEmail(`${'a'.repeat(10000)}@invalid`)).toBe(false)
  })
})
