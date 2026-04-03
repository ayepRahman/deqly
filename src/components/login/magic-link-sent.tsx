import { Button } from '~/components/ui/button'
import { PageFooter } from './page-footer'

interface MagicLinkSentProps {
  email: string
  onReset: () => void
}

export function MagicLinkSent({ email, onReset }: MagicLinkSentProps) {
  return (
    <div className="min-h-dvh bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="text-6xl mb-6">&#9993;</div>
        <h2 className="text-2xl font-bold mb-3 text-center">
          Check your email
        </h2>
        <p className="text-gray-400 text-sm text-center leading-relaxed max-w-xs">
          We sent a magic link to{' '}
          <span className="font-semibold text-gray-900">{email}</span>. Click
          the link in the email to sign in.
        </p>
        <Button
          variant="link"
          onClick={onReset}
          className="mt-8 text-sm text-gray-400"
        >
          Use a different email
        </Button>
      </div>
      <PageFooter />
    </div>
  )
}
