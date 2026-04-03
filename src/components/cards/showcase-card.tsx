import { Pencil, X } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '../ui/button'
import { ImagePlaceholderIcon } from './card-icons'
import { ColorPicker } from './color-picker'
import {
  type CardData,
  DEFAULT_CARD_COLOR,
  getImageUrl,
  MAX_DESCRIPTION,
  type ShowcaseEditForm,
} from './types'

interface ShowcaseCardProps {
  card: CardData
  index: number
  total: number
  isUploading: boolean
  editingCardId: Id<'cards'> | null
  showcaseEditForm: ShowcaseEditForm
  onImageClick: () => void
  onStartEdit: (card: CardData) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDeleteCard: (id: Id<'cards'>) => void
  onShowcaseFormChange: (form: ShowcaseEditForm) => void
}

export function ShowcaseCard({
  card,
  index,
  total,
  isUploading,
  editingCardId,
  showcaseEditForm,
  onImageClick,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteCard,
  onShowcaseFormChange,
}: ShowcaseCardProps) {
  const isEditing = editingCardId === card._id
  const accentColor = isEditing
    ? showcaseEditForm.color
    : (card.color ?? DEFAULT_CARD_COLOR.hex)

  return (
    <div className="flex flex-col items-center">
      <div className="w-80 rounded-[20px] outline outline-2 outline-neutral-200 overflow-hidden">
        {/* White top area */}
        <div className="bg-white pt-5 px-4 pb-4">
          <div className="text-right text-neutral-200 text-sm font-medium mb-3">
            {index + 1}/{total}
          </div>

          {card.imageId ? (
            <Button
              onClick={onImageClick}
              disabled={isUploading}
              variant="ghost"
              className="w-72 h-64 rounded-2xl border-2 border-stone-300 overflow-hidden relative group mx-auto block p-0"
            >
              <img
                src={getImageUrl(card.imageId) ?? ''}
                alt="Card showcase"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm">
                {isUploading ? 'Uploading...' : 'Change image'}
              </div>
            </Button>
          ) : (
            <Button
              onClick={onImageClick}
              disabled={isUploading}
              variant="ghost"
              className="w-72 h-64 rounded-2xl border-2 border-stone-300 flex flex-col items-center justify-center gap-3 mx-auto hover:border-neutral-400"
            >
              <ImagePlaceholderIcon />
              <div className="flex flex-col items-center gap-3">
                <p className="text-neutral-400 text-xl font-bold text-center">
                  {isUploading ? 'Uploading...' : 'Add showcase Images'}
                </p>
                <p className="text-neutral-400 text-base text-center leading-tight px-4">
                  Drop an image or browse it from your computer
                </p>
                <span className="px-5 py-1 rounded-3xl outline outline-1 outline-neutral-400 text-neutral-400 text-sm">
                  Open
                </span>
              </div>
            </Button>
          )}
        </div>

        {/* Accent bottom section */}
        <div className="px-4 pt-3 pb-5" style={{ backgroundColor: accentColor }}>
          {isEditing ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <input
                  value={showcaseEditForm.name}
                  onChange={(e) =>
                    onShowcaseFormChange({
                      ...showcaseEditForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Project Title"
                  className="bg-transparent text-white font-bold text-xl border-b border-white/40 focus:border-white outline-none pb-0.5 flex-1"
                />
                <Button
                  onClick={onCancelEdit}
                  variant="ghost"
                  size="icon-sm"
                  className="text-white/60 hover:text-white hover:bg-transparent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <textarea
                  value={showcaseEditForm.description}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESCRIPTION) {
                      onShowcaseFormChange({
                        ...showcaseEditForm,
                        description: e.target.value,
                      })
                    }
                  }}
                  placeholder="Add a description of your card here. Explain your project as best as you can within 220 characters thats leaves a good impact"
                  rows={4}
                  className="w-full bg-transparent text-white text-sm outline outline-1 outline-white rounded-[10px] p-[5px] focus:outline-white/80 resize-none opacity-60 focus:opacity-100"
                />
                <span className="absolute bottom-2 right-2 text-xs text-white/50">
                  {showcaseEditForm.description.length}/{MAX_DESCRIPTION}
                </span>
              </div>
              <ColorPicker
                value={showcaseEditForm.color}
                onChange={(hex) =>
                  onShowcaseFormChange({ ...showcaseEditForm, color: hex })
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                <p className="text-white text-xl font-bold pr-8">
                  {card.name || 'Project Title'}
                </p>
                <Button
                  onClick={() => onStartEdit(card)}
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-0.5 right-0 text-white/80 hover:text-white hover:bg-transparent"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <div className="outline outline-1 outline-white rounded-[10px] p-[5px] opacity-60 h-20 overflow-hidden">
                <p className="text-white text-sm">
                  {card.description ||
                    'Add a description of your card here. Explain your project as best as you can within 220 characters thats leaves a good impact'}
                </p>
              </div>
              <Button
                onClick={() => onDeleteCard(card._id)}
                variant="ghost"
                className="text-xs text-white/40 hover:text-red-400 hover:bg-transparent self-end h-auto py-0"
              >
                Remove card
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <Button onClick={onSaveEdit} className="mt-4 w-80" size="lg">
          Save Changes
        </Button>
      )}
    </div>
  )
}
