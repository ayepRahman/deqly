import { X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '../ui/button'
import { LogoMask } from './card-icons'

interface CardQrBackProps {
  vCardData: string
  cardColor: string
  onClose: () => void
  name?: string
  occupation?: string
}

export function CardQrBack({
  vCardData,
  cardColor,
  onClose,
  name,
  occupation,
}: CardQrBackProps) {
  return (
    <div
      className="relative w-full h-full rounded-[20px] flex flex-col items-center overflow-hidden px-6 pt-12 pb-8 outline outline-2 outline-neutral-200"
      style={{ backgroundColor: cardColor }}
    >
      <LogoMask className="absolute -bottom-6 left-1/2 -translate-x-1/2 -rotate-90 w-64 h-auto text-white/10 pointer-events-none z-0" />

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

      <div className="relative z-[1] flex flex-col items-center justify-center flex-1 w-full gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMask className="w-12 h-auto text-white" />
          {name && (
            <p className="text-white text-2xl font-bold leading-tight">
              {name}
            </p>
          )}
          {occupation && (
            <p className="text-white/90 text-base font-normal">{occupation}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5">
          <QRCodeSVG
            value={vCardData}
            size={140}
            fgColor={cardColor}
            bgColor="#ffffff"
            level="M"
          />
        </div>

        <span className="text-white text-sm font-normal tracking-widest text-center uppercase">
          Scan to view my Deqly
        </span>
      </div>
    </div>
  )
}
