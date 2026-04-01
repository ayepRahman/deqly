import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold tracking-tight">Home</h2>
      <p className="text-sm text-muted-foreground">Welcome to Deqly.</p>
    </div>
  )
}
