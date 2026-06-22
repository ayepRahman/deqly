import { Link } from '@tanstack/react-router'
import { Globe, Mail, Phone } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { generateVCard } from '~/lib/vcard'
import type { UserData } from './types'

interface PublicCtaProps {
  user: UserData
  showCreateDeck: boolean
}

function downloadVCard(user: UserData) {
  if (typeof window === 'undefined') return
  const vcard = generateVCard({
    name: user.name,
    email: user.email,
    username: user.username,
    occupation: user.occupation,
    mobileNumber: user.mobileNumber,
    websiteLink: user.websiteLink,
    addMobileToCard: user.addMobileToCard,
    addWebsiteToCard: user.addWebsiteToCard,
  })
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const fileName = (user.username || user.name || 'contact').replace(
    /[^a-z0-9_-]/gi,
    '_',
  )
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
    <div className="flex flex-col items-center mt-2">
      {(hasPhone || hasEmail || hasWebsite) && (
        <div className="flex items-center justify-center">
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

      <Button
        type="button"
        variant="teal"
        size="2xl"
        className="mb-2"
        onClick={() => downloadVCard(user)}
      >
        Save Contact
      </Button>

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
