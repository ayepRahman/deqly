export interface VCardInput {
  name?: string
  email: string
  username?: string
  occupation?: string
  mobileNumber?: string
  websiteLink?: string
  addMobileToCard?: boolean
  addWebsiteToCard?: boolean
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

  // Emit a single URL. Prefer the user's own website; fall back to the public
  // profile. Multiple URL properties are parsed inconsistently across devices.
  if (input.websiteLink && input.addWebsiteToCard) {
    lines.push(`URL:${input.websiteLink}`)
  } else if (input.username && typeof window !== 'undefined') {
    lines.push(`URL:${window.location.origin}/${input.username}`)
  }

  lines.push('END:VCARD')
  return lines.join(CRLF)
}
