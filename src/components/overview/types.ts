import type { FunctionReturnType } from 'convex/server'
import type { api } from '../../../convex/_generated/api'

type RecentlyViewedElement = FunctionReturnType<
  typeof api.connections.listRecentlyViewed
>['page'][number]

// The fields a connection row renders. Both listRecentlyViewed and
// listCollection return the same public-profile projection (plus their own
// timestamp), so the displayed subset is common to both — results from either
// query are assignable to this type.
export type ConnectionProfile = Pick<
  RecentlyViewedElement,
  '_id' | 'name' | 'username' | 'occupation' | 'avatarImageUrl' | 'bannerImageUrl'
>

export type ConnectionTab = 'recentlyViewed' | 'collection'

// The logged-in home shows the "Welcome back" overview once the user has built
// at least one card; until then it shows the "Create A Deqly" editor. Onboarding
// already sets name/username, so card count — not profile fields — is the signal
// for whether the user has started building their deck.
export function hasBuiltDeck(
  cards: { length: number } | null | undefined,
): boolean {
  return Boolean(cards && cards.length > 0)
}
