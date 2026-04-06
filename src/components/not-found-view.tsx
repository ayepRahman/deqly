import { Link } from '@tanstack/react-router'
import { PageFooter } from '~/components/login/page-footer'

interface NotFoundViewProps {
  title?: string
  message?: string
}

export function NotFoundView({
  title = 'No cards found in this deck!',
  message = 'Want this username for your cards?',
}: NotFoundViewProps) {
  return (
    <div className="relative isolate min-h-dvh bg-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Empty card placeholder */}
        <div className="w-60 h-48 rounded-xl bg-white border border-gray-200 shadow-sm mb-8" />

        <h2 className="text-xl font-medium text-black text-center">
          {title}
        </h2>
        <p className="text-base text-black text-center mt-1 max-w-72 leading-8">
          {message}{' '}
          <Link to="/login" className="font-medium underline">
            Create a deck now!
          </Link>
        </p>
      </div>

      <PageFooter />
    </div>
  )
}
