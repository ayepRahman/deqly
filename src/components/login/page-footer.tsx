import { LogoMask } from '~/components/cards/card-icons'

export function PageFooter() {
  return (
    <div className="absolute bottom-0 left-0 right-0 -z-10 overflow-hidden pointer-events-none mask-[linear-gradient(to_top,black,transparent)]">
      <LogoMask className="w-[100vw] h-auto text-gray-200 -rotate-90  translate-y-[20vh] md:translate-y-[120vh]" />
    </div>
  )
}
