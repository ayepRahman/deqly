import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

type CardType = 'showcase' | 'story'

interface SelectCardTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (type: CardType) => void
}

function ShowcaseIcon({ selected }: { selected: boolean }) {
  const color = selected ? 'white' : '#a3a3a3'
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" role="img" aria-label="Showcase card">
      {/* Bottom card */}
      <rect x="10" y="22" width="40" height="32" rx="4" fill={color} opacity="0.4" />
      {/* Middle card */}
      <rect x="7" y="16" width="40" height="32" rx="4" fill={color} opacity="0.6" />
      {/* Top card with image icon */}
      <rect x="4" y="10" width="40" height="32" rx="4" fill={color} />
      <circle cx="13" cy="19" r="3" fill={selected ? '#7855FF' : '#d4d4d4'} />
      <path d="M4 34 L14 24 L22 31 L30 22 L44 34" stroke={selected ? '#7855FF' : '#d4d4d4'} strokeWidth="2" fill="none" strokeLinejoin="round" />
    </svg>
  )
}

function StoryIcon({ selected }: { selected: boolean }) {
  const color = selected ? 'white' : '#a3a3a3'
  return (
    <svg width="48" height="60" viewBox="0 0 48 60" fill="none" role="img" aria-label="Story card">
      <rect x="2" y="2" width="44" height="56" rx="6" fill={color} opacity={selected ? 1 : 0.6} />
      <rect x="10" y="16" width="28" height="3" rx="1.5" fill={selected ? '#7855FF' : '#d4d4d4'} />
      <rect x="10" y="24" width="28" height="3" rx="1.5" fill={selected ? '#7855FF' : '#d4d4d4'} />
      <rect x="10" y="32" width="20" height="3" rx="1.5" fill={selected ? '#7855FF' : '#d4d4d4'} />
    </svg>
  )
}

export function SelectCardTypeDialog({
  open,
  onOpenChange,
  onCreate,
}: SelectCardTypeDialogProps) {
  const [selected, setSelected] = useState<CardType>('showcase')

  const handleCreate = () => {
    onCreate(selected)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-sm p-6 rounded-2xl">
        <DialogTitle className="text-2xl font-bold text-black text-center mb-6 font-['Space_Grotesk']">
          Choose Card Type
        </DialogTitle>

        <div className="flex gap-4 justify-center mb-6">
          {/* Showcase Card */}
          <button
            type="button"
            onClick={() => setSelected('showcase')}
            className={`w-40 h-52 rounded-[20px] flex flex-col items-center justify-between px-3 pt-5 pb-4 cursor-pointer transition-colors ${
              selected === 'showcase'
                ? 'bg-violet-500'
                : 'bg-white border-[1.5px] border-neutral-400'
            }`}
          >
            <p
              className={`text-base font-bold leading-tight text-center font-['Space_Grotesk'] ${
                selected === 'showcase' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Showcase Card
            </p>
            <div className="flex-1 flex items-center justify-center w-full">
              <ShowcaseIcon selected={selected === 'showcase'} />
            </div>
            <p
              className={`text-xs font-medium leading-4 text-center font-['Space_Grotesk'] ${
                selected === 'showcase' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Showcase your projects and journey through images
            </p>
          </button>

          {/* Story Card */}
          <button
            type="button"
            onClick={() => setSelected('story')}
            className={`w-40 h-52 rounded-[20px] flex flex-col items-center justify-between px-3 pt-5 pb-4 cursor-pointer transition-colors ${
              selected === 'story'
                ? 'bg-violet-500'
                : 'bg-white border-[1.5px] border-neutral-400'
            }`}
          >
            <p
              className={`text-base font-bold leading-tight text-center font-['Space_Grotesk'] ${
                selected === 'story' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Story Card
            </p>
            <div className="flex-1 flex items-center justify-center w-full">
              <StoryIcon selected={selected === 'story'} />
            </div>
            <p
              className={`text-xs font-medium leading-4 text-center font-['Space_Grotesk'] ${
                selected === 'story' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Express your story, voice, and personality through words
            </p>
          </button>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleCreate}
            className="h-9 px-9 bg-teal-500 hover:bg-teal-600 text-base font-bold rounded-[10px]"
          >
            Create Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
