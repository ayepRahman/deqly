// Resolve a scanned QR payload to a Deqly profile path ("/username").
//
// The Deqly QR encodes a vCard (for contact import) whose URL property is the
// public profile link only when the user hasn't opted to show their own
// website. A scanned code may therefore be a vCard or a raw URL. We extract a
// candidate URL, and only resolve it when it belongs to this app's origin —
// scanning an arbitrary website QR must not navigate us somewhere bogus.

// Path segments that are app routes, not usernames.
const RESERVED_SEGMENTS = new Set(['', 'login', 'onboarding', 'api', 'edit'])

// Pull the value of the first URL property from a vCard body. The property may
// carry type params, e.g. "URL;TYPE=PROFILE:https://...".
function extractVCardUrl(vcard: string): string | null {
  for (const rawLine of vcard.split(/\r\n|\r|\n/)) {
    const match = /^URL(?:;[^:]*)?:(.*)$/i.exec(rawLine.trim())
    if (match) {
      const value = match[1].trim()
      if (value) return value
    }
  }
  return null
}

export function parseDeqlyTarget(text: string, origin: string): string | null {
  if (!text) return null
  const trimmed = text.trim()
  if (!trimmed) return null

  const candidate = trimmed.toUpperCase().startsWith('BEGIN:VCARD')
    ? extractVCardUrl(trimmed)
    : trimmed
  if (!candidate) return null

  let url: URL
  let appOrigin: string
  try {
    url = new URL(candidate)
    appOrigin = new URL(origin).origin
  } catch {
    return null
  }

  if (url.origin !== appOrigin) return null

  const segment = url.pathname.split('/').filter(Boolean)[0] ?? ''
  if (RESERVED_SEGMENTS.has(segment)) return null
  return `/${segment}`
}
