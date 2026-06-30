import { describe, expect, it } from 'vitest'
import { parseDeqlyTarget } from './scan'

const ORIGIN = 'https://deqly.com'

function vcard(lines: string[]): string {
  return ['BEGIN:VCARD', 'VERSION:3.0', ...lines, 'END:VCARD'].join('\r\n')
}

describe('parseDeqlyTarget', () => {
  it('resolves a plain Deqly profile URL to its username path', () => {
    expect(parseDeqlyTarget('https://deqly.com/alice', ORIGIN)).toBe('/alice')
  })

  it('resolves a vCard whose URL line points at a Deqly profile', () => {
    const text = vcard([
      'N:Juliana;Selene;;;',
      'FN:Selene Juliana',
      'EMAIL;TYPE=INTERNET:selene@example.com',
      'URL:https://deqly.com/selene',
    ])
    expect(parseDeqlyTarget(text, ORIGIN)).toBe('/selene')
  })

  it('handles a vCard URL property with type params', () => {
    const text = vcard(['URL;TYPE=PROFILE:https://deqly.com/bob'])
    expect(parseDeqlyTarget(text, ORIGIN)).toBe('/bob')
  })

  it('resolves the profile link in a vCard that also carries an external website', () => {
    const text = vcard([
      'FN:Selene Juliana',
      'URL:https://selene.example.com',
      'URL;TYPE=PROFILE:https://deqly.com/selene',
    ])
    expect(parseDeqlyTarget(text, ORIGIN)).toBe('/selene')
  })

  it('returns null for a vCard whose URL is an external website', () => {
    const text = vcard([
      'FN:Selene Juliana',
      'URL:https://selene.example.com',
    ])
    expect(parseDeqlyTarget(text, ORIGIN)).toBeNull()
  })

  it('returns null for a URL on a different origin', () => {
    expect(parseDeqlyTarget('https://evil.com/alice', ORIGIN)).toBeNull()
  })

  it('returns null for reserved app paths', () => {
    expect(parseDeqlyTarget('https://deqly.com/login', ORIGIN)).toBeNull()
    expect(parseDeqlyTarget('https://deqly.com/edit', ORIGIN)).toBeNull()
    expect(parseDeqlyTarget('https://deqly.com/', ORIGIN)).toBeNull()
  })

  it('ignores trailing path segments and query strings', () => {
    expect(parseDeqlyTarget('https://deqly.com/alice/cards?x=1', ORIGIN)).toBe(
      '/alice',
    )
  })

  it('returns null for junk or empty input', () => {
    expect(parseDeqlyTarget('not a url', ORIGIN)).toBeNull()
    expect(parseDeqlyTarget('', ORIGIN)).toBeNull()
    expect(parseDeqlyTarget('BEGIN:VCARD\r\nEND:VCARD', ORIGIN)).toBeNull()
  })
})
