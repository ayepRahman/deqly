export interface VCardInput {
  name?: string
  email: string
  username?: string
  occupation?: string
  mobileNumber?: string
  websiteLink?: string
  addMobileToCard?: boolean
  addWebsiteToCard?: boolean
  // Base URL used to build the public-profile link (e.g. "https://deqly.com").
  // Passed in explicitly so the card is identical under SSR and in tests, where
  // `window` is unavailable. Falls back to the browser origin when omitted.
  origin?: string
}

// vCard 3.0 (RFC 2426) requires CRLF line breaks. Apple Contacts (iPhone)
// enforces this; Android/Google Contacts is lenient. Use CRLF so the same
// payload imports on both platforms.
const CRLF = '\r\n'

// Escape text-value fields per RFC 2426 §5: backslash, comma, semicolon and
// newline are field separators and must be escaped. Do NOT run this on URI
// (URL) or TEL/EMAIL values — escaping commas there would corrupt them.
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

// Build the structured name (N) from a single display name. N is mandatory in
// vCard 3.0 — without it iPhone imports a "No Name" contact. Convention: the
// last whitespace-separated token is the family name, the rest is the given
// name. Components are escaped and emitted as N:Family;Given;;;
function buildStructuredName(name: string): string {
  const parts = name.trim().split(/\s+/)
  const family = parts.length > 1 ? parts[parts.length - 1] : ''
  const given = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0]
  return `${escapeText(family)};${escapeText(given)};;;`
}

// A stored website link may omit the scheme (e.g. "selene.example.com"). A
// vCard URL value must be an absolute URI, and contact apps won't make it
// tappable otherwise — so default a missing scheme to https.
export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function resolveOrigin(input: VCardInput): string | undefined {
  if (input.origin) return input.origin
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return undefined
}

export function generateVCard(input: VCardInput): string {
  const displayName = input.name?.trim() || input.username?.trim() || ''
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0']

  // N (structured) must come before/with FN and is required by the spec.
  lines.push(`N:${displayName ? buildStructuredName(displayName) : ';;;;'}`)
  if (displayName) {
    lines.push(`FN:${escapeText(displayName)}`)
  }

  if (input.occupation) {
    lines.push(`TITLE:${escapeText(input.occupation)}`)
  }

  lines.push(`EMAIL;TYPE=INTERNET:${input.email}`)

  if (input.mobileNumber && input.addMobileToCard) {
    lines.push(`TEL;TYPE=CELL:${input.mobileNumber}`)
  }

  // Emit both links the contact may want: the user's own website (plain URL)
  // and the Deqly public profile (tagged TYPE=PROFILE so scanners and contact
  // apps can tell them apart). Both iOS and Android import multiple URL
  // properties fine; the earlier single-URL limitation dropped whichever link
  // wasn't chosen, so a card with a website never carried the profile link.
  if (input.websiteLink && input.addWebsiteToCard) {
    lines.push(`URL:${normalizeWebsiteUrl(input.websiteLink)}`)
  }

  const origin = resolveOrigin(input)
  if (input.username && origin) {
    lines.push(`URL;TYPE=PROFILE:${origin}/${input.username}`)
  }

  lines.push('END:VCARD')
  return lines.join(CRLF)
}
