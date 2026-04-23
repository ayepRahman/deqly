import { Link } from '@tanstack/react-router'
import { Globe, Mail, Phone } from 'lucide-react'
import type { UserData } from './types'

interface PublicCtaProps {
  user: UserData
  showCreateDeck: boolean
}

function buildVCard(user: UserData): string {
  const displayName = user.name || user.username || ''
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(displayName)}`,
  ]
  if (user.occupation) {
    lines.push(`TITLE:${escapeVCardValue(user.occupation)}`)
  }
  if (user.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(user.email)}`)
  }
  if (user.mobileNumber) {
    lines.push(`TEL;TYPE=CELL:${escapeVCardValue(user.mobileNumber)}`)
  }
  if (user.websiteLink) {
    lines.push(`URL:${escapeVCardValue(user.websiteLink)}`)
  }
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

function escapeVCardValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function downloadVCard(user: UserData) {
  if (typeof window === 'undefined') return
  const vcard = buildVCard(user)
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const fileName = (user.username || user.name || 'contact').replace(/[^a-z0-9_-]/gi, '_')
  anchor.href = url
  anchor.download = `${fileName}.vcf`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function normalizeWebsite(url: string): string {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

export function PublicCta({ user, showCreateDeck }: PublicCtaProps) {
  const hasPhone = Boolean(user.mobileNumber)
  const hasEmail = Boolean(user.email)
  const hasWebsite = Boolean(user.websiteLink)

  const iconButtonClass =
    'flex items-center justify-center w-12 h-12 rounded-full text-black hover:bg-neutral-100 transition-colors'

  return (
    <div className="flex flex-col items-center mt-8 gap-4">
      {(hasPhone || hasEmail || hasWebsite) && (
        <div className="flex items-center justify-center gap-4">
          {hasPhone && (
            <a
              href={`tel:${user.mobileNumber}`}
              aria-label={`Call ${user.name || user.username}`}
              className={iconButtonClass}
            >
              <Phone className="w-6 h-6" strokeWidth={1.75} />
            </a>
          )}
          {hasEmail && (
            <a
              href={`mailto:${user.email}`}
              aria-label={`Email ${user.name || user.username}`}
              className={iconButtonClass}
            >
              <Mail className="w-6 h-6" strokeWidth={1.75} />
            </a>
          )}
          {hasWebsite && user.websiteLink && (
            <a
              href={normalizeWebsite(user.websiteLink)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${user.name || user.username}'s website`}
              className={iconButtonClass}
            >
              <Globe className="w-6 h-6" strokeWidth={1.75} />
            </a>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => downloadVCard(user)}
        className="h-12 px-10 rounded-full bg-[#33D9B2] text-white text-lg font-semibold shadow-sm hover:bg-[#2AC6A1] active:translate-y-px transition-colors"
      >
        Save Contact
      </button>

      {showCreateDeck && (
        <Link
          to="/login"
          className="text-black text-base font-semibold underline underline-offset-4 decoration-2"
        >
          Create my own deck
        </Link>
      )}
    </div>
  )
}
