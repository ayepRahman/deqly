import { usePaginatedQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '~/components/ui/button'
import { ConnectionRow } from './connection-row'
import { ConnectionsEmptyState } from './connections-empty-state'
import type { ConnectionTab } from './types'

interface ConnectionListProps {
  tab: ConnectionTab
}

const PAGE_SIZE = 20

const EMPTY_MESSAGE: Record<ConnectionTab, string> = {
  recentlyViewed: 'Deqlys you view will show up here',
  collection: 'Deqlys you save will show up here',
}

// Renders the paginated list of connections for the active tab. Each tab is
// backed by its own Convex paginated query; mounting per-tab keeps the cursor
// state isolated and avoids fetching the inactive tab.
export function ConnectionList({ tab }: ConnectionListProps) {
  const query =
    tab === 'recentlyViewed'
      ? api.connections.listRecentlyViewed
      : api.connections.listCollection

  const { results, status, loadMore } = usePaginatedQuery(
    query,
    {},
    { initialNumItems: PAGE_SIZE },
  )

  if (status === 'LoadingFirstPage') {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-44 w-full animate-pulse rounded-[20px] bg-neutral-100" />
        <div className="h-44 w-full animate-pulse rounded-[20px] bg-neutral-100" />
      </div>
    )
  }

  if (results.length === 0) {
    return <ConnectionsEmptyState message={EMPTY_MESSAGE[tab]} />
  }

  return (
    <div className="flex flex-col gap-4">
      {results.map((profile) => (
        <ConnectionRow key={profile._id} profile={profile} />
      ))}
      {status === 'CanLoadMore' && (
        <Button
          variant="outline"
          size="lg"
          className="self-center"
          onClick={() => loadMore(PAGE_SIZE)}
        >
          Load more
        </Button>
      )}
      {status === 'LoadingMore' && (
        <div className="h-44 w-full animate-pulse rounded-[20px] bg-neutral-100" />
      )}
    </div>
  )
}
