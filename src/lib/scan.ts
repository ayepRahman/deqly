// Resolve a scanned QR payload to a Deqly profile path ("/username").
//
// The Deqly QR encodes a vCard (for contact import) whose URL property is the
// public profile link only when the user hasn't opted to show their own
// website. A scanned code may therefore be a vCard or a raw URL. We extract a
// candidate URL, and only resolve it when it belongs to this app's origin —
// scanning an arbitrary website QR must not navigate us somewhere bogus.

// Path segments that are app routes, not usernames.
const RESERVED_SEGMENTS = new Set(['', 'login', 'onboarding', 'api', 'edit'])

// Pull every URL property value from a vCard body. The property may carry type
// params, e.g. "URL;TYPE=PROFILE:https://...". A card can hold more than one URL
// (the user's website plus the Deqly profile link), so we collect them all and
// let the caller pick the one that belongs to this app.
function extractVCardUrls(vcard: string): string[] {
  const urls: string[] = []
  for (const rawLine of vcard.split(/\r\n|\r|\n/)) {
    const match = /^URL(?:;[^:]*)?:(.*)$/i.exec(rawLine.trim())
    if (match) {
      const value = match[1].trim()
      if (value) urls.push(value)
    }
  }
  return urls
}

export function parseDeqlyTarget(text: string, origin: string): string | null {
  if (!text) return null
  const trimmed = text.trim()
  if (!trimmed) return null

  const candidates = trimmed.toUpperCase().startsWith('BEGIN:VCARD')
    ? extractVCardUrls(trimmed)
    : [trimmed]
  if (candidates.length === 0) return null

  let appOrigin: string
  try {
    appOrigin = new URL(origin).origin
  } catch {
    return null
  }

  for (const candidate of candidates) {
    let url: URL
    try {
      url = new URL(candidate)
    } catch {
      continue
    }
    if (url.origin !== appOrigin) continue

    const segment = url.pathname.split('/').filter(Boolean)[0] ?? ''
    if (RESERVED_SEGMENTS.has(segment)) continue
    return `/${segment}`
  }
  return null
}
