import { Button } from '../ui/button'
import { ImagePlaceholderIcon } from './card-icons'
import { MAX_CARDS } from './types'

interface EmptyCardPlaceholderProps {
  total?: number
  onGetStarted?: () => void
}

export function EmptyCardPlaceholder({
  total = MAX_CARDS,
  onGetStarted,
}: EmptyCardPlaceholderProps) {
  return (
    <div className="w-80 rounded-[20px] outline outline-2 outline-neutral-200 overflow-hidden">
      <div className="bg-white pt-5 px-4 pb-4">
        <div className="text-right text-neutral-200 text-sm font-medium mb-3">
          0/{total}
        </div>
        <div className="w-72 h-64 rounded-2xl border-2 border-stone-300 flex flex-col items-center justify-center gap-3 mx-auto">
          <ImagePlaceholderIcon />
          <div className="flex flex-col items-center gap-3">
            <p className="text-neutral-400 text-xl font-bold text-center">
              Build your first card
            </p>
            <p className="text-neutral-400 text-base text-center leading-tight px-4">
              Showcase your work, story, or brand in a single shareable deck
            </p>
            <Button
              onClick={onGetStarted}
              variant="outline"
              className="px-5 py-1 h-auto text-sm text-neutral-400"
            >
              Get started
            </Button>
          </div>
        </div>
      </div>
      <div className="bg-neutral-700 px-4 pt-3 pb-5">
        <p className="text-white text-xl font-bold">Your Card Title</p>
        <div className="outline outline-1 outline-white rounded-[10px] p-[5px] opacity-60 mt-2.5 h-20" />
      </div>
    </div>
  )
}
