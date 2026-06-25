import { describe, expect, it } from 'vitest'
import { hasBuiltDeck } from './types'

describe('hasBuiltDeck', () => {
  it('is true when the user has at least one card', () => {
    expect(hasBuiltDeck([{ _id: 'a' }])).toBe(true)
    expect(hasBuiltDeck([{ _id: 'a' }, { _id: 'b' }])).toBe(true)
  })

  it('is false for an empty card list', () => {
    expect(hasBuiltDeck([])).toBe(false)
  })

  it('is false while cards are still loading (null/undefined)', () => {
    expect(hasBuiltDeck(null)).toBe(false)
    expect(hasBuiltDeck(undefined)).toBe(false)
  })
})
