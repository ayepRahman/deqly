import { LogoMask } from '~/components/cards/card-icons'

interface ConnectionsEmptyStateProps {
  message: string
}

// Placeholder shown when a tab has no connections yet — the faint Deqly logo
// watermark cards from the design.
export function ConnectionsEmptyState({ message }: ConnectionsEmptyStateProps) {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex h-44 w-full items-center justify-center rounded-[20px] bg-neutral-50 ring-1 ring-neutral-100"
        >
          <LogoMask className="h-16 w-16 text-neutral-200" />
        </div>
      ))}
      <p className="text-center text-sm text-neutral-400">{message}</p>
    </div>
  )
}
