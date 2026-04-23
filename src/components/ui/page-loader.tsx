import { LogoMask } from '~/components/cards/card-icons'

interface PageLoaderProps {
  label?: string
  fullscreen?: boolean
}

export function PageLoader({
  label = 'Loading',
  fullscreen = true,
}: PageLoaderProps) {
  return (
    <div
      className={`${fullscreen ? 'min-h-dvh' : 'h-full'} flex items-center justify-center bg-white`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center w-20 h-20">
          <span className="absolute inset-0 rounded-full border-2 border-neutral-200" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-teal animate-spin" />
          <LogoMask className="w-8 h-auto text-black animate-pulse" />
        </div>
        <p className="text-sm tracking-wide text-neutral-500">
          {label}
          <span className="inline-block ml-0.5 animate-pulse">…</span>
        </p>
      </div>
    </div>
  )
}
