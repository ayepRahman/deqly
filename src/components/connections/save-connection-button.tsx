import { useMutation, useQuery } from 'convex/react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useState } from 'react'
import { Button } from '~/components/ui/button'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface SaveConnectionButtonProps {
  savedUserId: Id<'users'>
}

// Toggles whether the current user has saved this profile to their collection.
// Rendered only for authenticated non-owners on a public profile.
export function SaveConnectionButton({ savedUserId }: SaveConnectionButtonProps) {
  const isSaved = useQuery(api.connections.isConnectionSaved, { savedUserId })
  const saveConnection = useMutation(api.connections.saveConnection)
  const unsaveConnection = useMutation(api.connections.unsaveConnection)
  const [pending, setPending] = useState(false)

  const handleToggle = async () => {
    setPending(true)
    try {
      if (isSaved) {
        await unsaveConnection({ savedUserId })
      } else {
        await saveConnection({ savedUserId })
      }
    } catch {
      // Toggle failed — the query stays the source of truth on next render.
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant={isSaved ? 'secondary' : 'outline'}
      size="2xl"
      className="mb-2 gap-2"
      isLoading={pending || isSaved === undefined}
      onClick={handleToggle}
    >
      {isSaved ? (
        <>
          <BookmarkCheck className="size-5" />
          Saved
        </>
      ) : (
        <>
          <Bookmark className="size-5" />
          Save to Collection
        </>
      )}
    </Button>
  )
}
