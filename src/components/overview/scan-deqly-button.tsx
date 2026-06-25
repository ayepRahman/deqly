import { ScanLine } from 'lucide-react'
import { useState } from 'react'
import { ScanDeqlyDialog } from '~/components/scan/scan-deqly-dialog'
import { Button } from '~/components/ui/button'

// The bottom "Scan Deqly" pill. Owns the scanner dialog's open state so the
// overview route stays focused on its data.
export function ScanDeqlyButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="violet"
        size="2xl"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        Scan Deqly
        <ScanLine className="size-7" />
      </Button>
      <ScanDeqlyDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
