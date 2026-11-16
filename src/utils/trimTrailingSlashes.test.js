import { describe, expect, it } from 'vitest'
import { trimTrailingSlashes } from './trimTrailingSlashes'

describe('trimTrailingSlashes', () => {
  it.each([
    ['/api///', '/api'],
    ['/pets/42', '/pets/42'],
    ['///', ''],
    ['', ''],
  ])('normalizes %s to %s', (value, expected) => {
    expect(trimTrailingSlashes(value)).toBe(expected)
  })
})
