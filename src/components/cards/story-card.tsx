import { Pencil, X } from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '../ui/button'
import { AddBlockIcon } from './card-icons'
import { ColorPicker } from './color-picker'
import {
  type CardData,
  DEFAULT_CARD_COLOR,
  MAX_DESCRIPTION,
  MAX_STORY_BLOCKS,
  type StoryEditForm,
} from './types'

interface StoryCardProps {
  card: CardData
  index: number
  total: number
  editingCardId: Id<'cards'> | null
  storyEditForm: StoryEditForm
  onStartEdit: (card: CardData) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDeleteCard: (id: Id<'cards'>) => void
  onStoryFormChange: (form: StoryEditForm) => void
  onAddBlock: (card: CardData) => void
}

export function StoryCard({
  card,
  index,
  total,
  editingCardId,
  storyEditForm,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteCard,
  onStoryFormChange,
  onAddBlock,
}: StoryCardProps) {
  const isEditing = editingCardId === card._id
  const blocks = card.storyBlocks ?? []
  const canAddBlock = blocks.length < MAX_STORY_BLOCKS
  const accentColor = isEditing
    ? storyEditForm.color
    : (card.color ?? DEFAULT_CARD_COLOR.hex)

  const updateBlock = (
    i: number,
    field: keyof StoryEditForm['storyBlocks'][number],
    value: string,
  ) => {
    const updated = storyEditForm.storyBlocks.map((b, idx) =>
      idx === i ? { ...b, [field]: value } : b,
    )
    onStoryFormChange({ ...storyEditForm, storyBlocks: updated })
  }

  const removeBlock = (i: number) => {
    onStoryFormChange({
      ...storyEditForm,
      storyBlocks: storyEditForm.storyBlocks.filter((_, idx) => idx !== i),
    })
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-80 rounded-[20px] outline outline-2 outline-neutral-200 overflow-hidden"
        style={{ backgroundColor: accentColor }}
      >
        <div className="px-4 pt-5 pb-6 flex flex-col gap-4 min-h-[576px]">
          {/* Counter + edit controls */}
          <div className="flex items-center justify-between">
            <div className="w-4" />
            <span className="text-neutral-200 text-sm font-medium">
              {index + 1}/{total}
            </span>
            {isEditing ? (
              <Button
                onClick={onCancelEdit}
                variant="ghost"
                size="icon-sm"
                className="text-white/60 hover:text-white hover:bg-transparent"
              >
                <X className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => onStartEdit(card)}
                variant="ghost"
                size="icon-sm"
                className="text-white/80 hover:text-white hover:bg-transparent"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Blocks */}
          {isEditing ? (
            <div className="flex flex-col gap-5">
              {storyEditForm.storyBlocks.map((block, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no stable id
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <input
                      value={block.title}
                      onChange={(e) => updateBlock(i, 'title', e.target.value)}
                      placeholder="Title"
                      className="bg-transparent text-white text-xl font-bold border-b border-white/40 focus:border-white outline-none pb-0.5 flex-1"
                    />
                    {storyEditForm.storyBlocks.length > 1 && (
                      <Button
                        onClick={() => removeBlock(i)}
                        variant="ghost"
                        size="icon-sm"
                        className="ml-2 text-white/40 hover:text-red-400 hover:bg-transparent"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <input
                    value={block.subheader}
                    onChange={(e) => updateBlock(i, 'subheader', e.target.value)}
                    placeholder="Subheader"
                    className="bg-transparent text-white text-base border-b border-white/40 focus:border-white outline-none pb-0.5"
                  />
                  <textarea
                    value={block.description}
                    onChange={(e) => {
                      if (e.target.value.length <= MAX_DESCRIPTION) {
                        updateBlock(i, 'description', e.target.value)
                      }
                    }}
                    placeholder="Add a description of your card here. Explain your project as best as you can within 220 characters thats leaves a good impact"
                    rows={3}
                    className="w-full bg-transparent text-white text-sm outline outline-1 outline-white rounded-[10px] p-2.5 focus:outline-white/80 resize-none opacity-60 focus:opacity-100"
                  />
                </div>
              ))}
              {storyEditForm.storyBlocks.length < MAX_STORY_BLOCKS && (
                <Button
                  onClick={() =>
                    onStoryFormChange({
                      ...storyEditForm,
                      storyBlocks: [
                        ...storyEditForm.storyBlocks,
                        { title: '', subheader: '', description: '' },
                      ],
                    })
                  }
                  variant="ghost"
                  className="flex flex-col items-center gap-1 py-2 h-auto opacity-60 hover:opacity-100 hover:bg-transparent"
                >
                  <AddBlockIcon />
                  <span className="text-neutral-400 text-sm">Add Text Box</span>
                </Button>
              )}
              <ColorPicker
                value={storyEditForm.color}
                onChange={(hex) =>
                  onStoryFormChange({ ...storyEditForm, color: hex })
                }
              />
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {blocks.map((block, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: blocks have no stable id
                <div key={i} className="flex flex-col gap-2">
                  <p className="text-white text-xl font-bold">
                    {block.title || 'Title'}
                  </p>
                  <p className="text-white text-base">
                    {block.subheader || 'Subheader'}
                  </p>
                  <div className="outline outline-1 outline-white rounded-[10px] p-2.5 opacity-60">
                    <p className="text-white text-sm">
                      {block.description ||
                        'Add a description of your card here. Explain your project as best as you can within 220 characters thats leaves a good impact'}
                    </p>
                  </div>
                </div>
              ))}

              {canAddBlock && (
                <Button
                  onClick={() => onAddBlock(card)}
                  variant="ghost"
                  className="flex flex-col items-center gap-1 py-2 h-auto opacity-60 hover:opacity-100 hover:bg-transparent"
                >
                  <AddBlockIcon />
                  <span className="text-neutral-400 text-sm">Add Text Box</span>
                </Button>
              )}

              <Button
                onClick={() => onDeleteCard(card._id)}
                variant="ghost"
                className="text-xs text-white/40 hover:text-red-400 hover:bg-transparent self-end h-auto py-0 mt-auto"
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
