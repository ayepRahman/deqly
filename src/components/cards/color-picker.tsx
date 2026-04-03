import { Button } from '../ui/button'
import { CARD_COLORS } from './types'

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-white/60 text-xs">Choose Card Colour</span>
      <div className="flex items-center gap-2.5 flex-wrap">
        {CARD_COLORS.map((color) => (
          <Button
            key={color.id}
            onClick={() => onChange(color.hex)}
            title={color.label}
            style={{ backgroundColor: color.hex }}
            variant="ghost"
            className={`w-10 h-10 rounded-[10px] p-0 hover:opacity-100 hover:bg-transparent ${
              value === color.hex
                ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent opacity-100'
                : 'opacity-70'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
