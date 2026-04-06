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

export function generateVCard(input: VCardInput): string {
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0']

  if (input.name) {
    lines.push(`FN:${input.name}`)
  }

  lines.push(`EMAIL:${input.email}`)

  if (input.occupation) {
    lines.push(`TITLE:${input.occupation}`)
  }

  if (input.mobileNumber && input.addMobileToCard) {
    lines.push(`TEL;TYPE=CELL:${input.mobileNumber}`)
  }

  if (input.websiteLink && input.addWebsiteToCard) {
    lines.push(`URL:${input.websiteLink}`)
  }

  if (input.username && typeof window !== 'undefined') {
    lines.push(`URL:${window.location.origin}/${input.username}`)
  }

  lines.push('END:VCARD')
  return lines.join('\n')
}
