import { X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '../ui/button'
import { LogoMask } from './card-icons'

interface CardQrBackProps {
  vCardData: string
  cardColor: string
  onClose: () => void
}

export function CardQrBack({ vCardData, cardColor, onClose }: CardQrBackProps) {
  return (
    <div
      className="relative w-full h-full rounded-[20px] flex flex-col items-center justify-center outline outline-2 outline-neutral-200"
      style={{ backgroundColor: cardColor }}
    >
      <div className="absolute top-3 right-3 z-10">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon-sm"
          className="text-white/60 hover:text-white hover:bg-transparent"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-6">
        <QRCodeSVG
          value={vCardData}
          size={140}
          fgColor={cardColor}
          bgColor="#ffffff"
          level="M"
        />
      </div>

      <span className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-white text-sm font-normal whitespace-nowrap tracking-widest">
        SCAN MY DECK
      </span>
      <span className="absolute -right-2 top-1/2 -translate-y-1/2 rotate-90 text-white text-sm font-normal whitespace-nowrap tracking-widest">
        SCAN MY DECK
      </span>
      <LogoMask className="absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-90 w-64 h-auto text-white/10 pointer-events-none" />
    </div>
  )
}
