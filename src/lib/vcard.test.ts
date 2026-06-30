import { describe, expect, it } from 'vitest'
import { generateVCard, normalizeWebsiteUrl } from './vcard'

const ORIGIN = 'https://deqly.com'

function urlLines(vcard: string): string[] {
  return vcard.split('\r\n').filter((line) => /^URL(?:;[^:]*)?:/i.test(line))
}

describe('generateVCard', () => {
  it('emits a spec-compliant card with name and email', () => {
    const vcard = generateVCard({
      name: 'Selene Juliana',
      email: 'selene@example.com',
      username: 'selene',
      origin: ORIGIN,
    })

    expect(vcard.startsWith('BEGIN:VCARD\r\nVERSION:3.0')).toBe(true)
    expect(vcard).toContain('N:Juliana;Selene;;;')
    expect(vcard).toContain('FN:Selene Juliana')
    expect(vcard).toContain('EMAIL;TYPE=INTERNET:selene@example.com')
    expect(vcard.endsWith('END:VCARD')).toBe(true)
  })

  it('includes BOTH the external website link and the profile link', () => {
    const vcard = generateVCard({
      name: 'Selene Juliana',
      email: 'selene@example.com',
      username: 'selene',
      websiteLink: 'https://selene.example.com',
      addWebsiteToCard: true,
      origin: ORIGIN,
    })

    const urls = urlLines(vcard)
    expect(urls).toContain('URL:https://selene.example.com')
    expect(urls).toContain('URL;TYPE=PROFILE:https://deqly.com/selene')
    expect(urls).toHaveLength(2)
  })

  it('normalizes a scheme-less website link to an absolute https URL', () => {
    const vcard = generateVCard({
      email: 'selene@example.com',
      username: 'selene',
      websiteLink: 'selene.example.com',
      addWebsiteToCard: true,
      origin: ORIGIN,
    })

    expect(urlLines(vcard)).toContain('URL:https://selene.example.com')
  })

  it('still includes the profile link when the user opts out of their website', () => {
    const vcard = generateVCard({
      email: 'selene@example.com',
      username: 'selene',
      websiteLink: 'https://selene.example.com',
      addWebsiteToCard: false,
      origin: ORIGIN,
    })

    const urls = urlLines(vcard)
    expect(urls).toEqual(['URL;TYPE=PROFILE:https://deqly.com/selene'])
  })

  it('includes only the profile link when there is no website', () => {
    const vcard = generateVCard({
      email: 'selene@example.com',
      username: 'selene',
      origin: ORIGIN,
    })

    expect(urlLines(vcard)).toEqual([
      'URL;TYPE=PROFILE:https://deqly.com/selene',
    ])
  })

  it('omits the profile link when no origin is resolvable', () => {
    const vcard = generateVCard({
      email: 'selene@example.com',
      username: 'selene',
    })

    expect(urlLines(vcard)).toEqual([])
  })
})

describe('normalizeWebsiteUrl', () => {
  it('leaves absolute http(s) URLs untouched', () => {
    expect(normalizeWebsiteUrl('http://a.com')).toBe('http://a.com')
    expect(normalizeWebsiteUrl('https://a.com')).toBe('https://a.com')
  })

  it('prefixes https:// for scheme-less input', () => {
    expect(normalizeWebsiteUrl('a.com')).toBe('https://a.com')
    expect(normalizeWebsiteUrl('  a.com  ')).toBe('https://a.com')
  })
})
