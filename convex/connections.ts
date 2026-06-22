import { ConvexError, v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { mutation, query } from './_generated/server'
import { getUser, safeGetUser } from './auth'
import { toPublicProfile } from './users'

// Client may use this as a sensible default page size; the server clamps to MAX.
export const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50
// Recently Viewed is bounded per viewer; oldest entries are pruned past this.
const MAX_RECENTLY_VIEWED = 50

// Clamp a client-supplied page size into a safe range so a caller can't request
// an unbounded page.
function clampPageSize(numItems: number): number {
  return Math.min(Math.max(numItems, 1), MAX_PAGE_SIZE)
}

// ----------------------------------------------------------------------------
// Recently Viewed
// ----------------------------------------------------------------------------

// Records that the current (logged-in) user viewed another user's Deqly.
// Deduped per (viewer, viewed) pair; self-views and views of missing users are
// no-ops.
export const recordView = mutation({
  args: { viewedUserId: v.id('users') },
  handler: async (ctx, args) => {
    const viewer = await getUser(ctx)

    // Never track viewing your own Deqly.
    if (args.viewedUserId === viewer._id) {
      return null
    }

    // Don't create a dangling reference to a user that no longer exists.
    const viewed = await ctx.db.get(args.viewedUserId)
    if (!viewed) {
      return null
    }

    const now = Date.now()
    const existing = await ctx.db
      .query('recentlyViewed')
      .withIndex('by_viewer_and_viewed', (q) =>
        q.eq('viewerId', viewer._id).eq('viewedUserId', args.viewedUserId),
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { lastViewedAt: now })
      return existing._id
    }

    const id = await ctx.db.insert('recentlyViewed', {
      viewerId: viewer._id,
      viewedUserId: args.viewedUserId,
      lastViewedAt: now,
    })

    // Keep the list bounded: prune the oldest rows past the cap.
    const all = await ctx.db
      .query('recentlyViewed')
      .withIndex('by_viewer_and_lastViewedAt', (q) =>
        q.eq('viewerId', viewer._id),
      )
      .order('asc')
      .collect()
    const overflow = all.length - MAX_RECENTLY_VIEWED
    for (let i = 0; i < overflow; i++) {
      await ctx.db.delete(all[i]._id)
    }

    return id
  },
})

// Paginated list of the current user's recently-viewed Deqlys, newest first.
// Each entry is a public profile projection plus an isCollected flag so the FE
// can render save-button state. Full cards are not resolved here (lightweight);
// the full Deqly loads via the public profile route when opened.
export const listRecentlyViewed = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const viewer = await getUser(ctx)

    const result = await ctx.db
      .query('recentlyViewed')
      .withIndex('by_viewer_and_lastViewedAt', (q) =>
        q.eq('viewerId', viewer._id),
      )
      .order('desc')
      .paginate({
        ...args.paginationOpts,
        numItems: clampPageSize(args.paginationOpts.numItems),
      })

    // Build the caller's collected set once to flag rows cheaply.
    const collected = await ctx.db
      .query('collectedConnections')
      .withIndex('by_collector', (q) => q.eq('collectorId', viewer._id))
      .collect()
    const collectedIds = new Set(collected.map((c) => c.savedUserId))

    const page = (
      await Promise.all(
        result.page.map(async (row) => {
          const user = await ctx.db.get(row.viewedUserId)
          if (!user) {
            return null
          }
          return {
            ...(await toPublicProfile(ctx, user)),
            lastViewedAt: row.lastViewedAt,
            isCollected: collectedIds.has(row.viewedUserId),
          }
        }),
      )
    ).filter((row): row is NonNullable<typeof row> => row !== null)

    return { ...result, page }
  },
})

// Total recently-viewed count for the current user (for tab headers).
export const countRecentlyViewed = query({
  args: {},
  handler: async (ctx) => {
    const viewer = await getUser(ctx)
    const rows = await ctx.db
      .query('recentlyViewed')
      .withIndex('by_viewer_and_lastViewedAt', (q) =>
        q.eq('viewerId', viewer._id),
      )
      .collect()
    return rows.length
  },
})

// ----------------------------------------------------------------------------
// Collection
// ----------------------------------------------------------------------------

// Saves another user's Deqly to the current user's collection. Idempotent and
// rejects saving yourself.
export const saveConnection = mutation({
  args: { savedUserId: v.id('users') },
  handler: async (ctx, args) => {
    const collector = await getUser(ctx)

    if (args.savedUserId === collector._id) {
      return null
    }

    const target = await ctx.db.get(args.savedUserId)
    if (!target) {
      throw new ConvexError('User not found')
    }

    const existing = await ctx.db
      .query('collectedConnections')
      .withIndex('by_collector_and_saved', (q) =>
        q.eq('collectorId', collector._id).eq('savedUserId', args.savedUserId),
      )
      .first()
    if (existing) {
      return existing._id
    }

    return ctx.db.insert('collectedConnections', {
      collectorId: collector._id,
      savedUserId: args.savedUserId,
    })
  },
})

// Removes a saved connection from the current user's collection.
export const unsaveConnection = mutation({
  args: { savedUserId: v.id('users') },
  handler: async (ctx, args) => {
    const collector = await getUser(ctx)

    const existing = await ctx.db
      .query('collectedConnections')
      .withIndex('by_collector_and_saved', (q) =>
        q.eq('collectorId', collector._id).eq('savedUserId', args.savedUserId),
      )
      .first()

    if (existing) {
      await ctx.db.delete(existing._id)
    }
  },
})

// Paginated list of the current user's collected connections, newest first.
export const listCollection = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const collector = await getUser(ctx)

    const result = await ctx.db
      .query('collectedConnections')
      .withIndex('by_collector', (q) => q.eq('collectorId', collector._id))
      .order('desc')
      .paginate({
        ...args.paginationOpts,
        numItems: clampPageSize(args.paginationOpts.numItems),
      })

    const page = (
      await Promise.all(
        result.page.map(async (row) => {
          const user = await ctx.db.get(row.savedUserId)
          if (!user) {
            return null
          }
          return {
            ...(await toPublicProfile(ctx, user)),
            savedAt: row._creationTime,
          }
        }),
      )
    ).filter((row): row is NonNullable<typeof row> => row !== null)

    return { ...result, page }
  },
})

// Total collected count for the current user (for tab headers).
export const countCollection = query({
  args: {},
  handler: async (ctx) => {
    const collector = await getUser(ctx)
    const rows = await ctx.db
      .query('collectedConnections')
      .withIndex('by_collector', (q) => q.eq('collectorId', collector._id))
      .collect()
    return rows.length
  },
})

// Whether the current user has saved the given user. Returns false when
// unauthenticated so the public profile route can call it without throwing.
export const isConnectionSaved = query({
  args: { savedUserId: v.id('users') },
  handler: async (ctx, args) => {
    const collector = await safeGetUser(ctx)
    if (!collector) {
      return false
    }

    const existing = await ctx.db
      .query('collectedConnections')
      .withIndex('by_collector_and_saved', (q) =>
        q.eq('collectorId', collector._id).eq('savedUserId', args.savedUserId),
      )
      .first()

    return existing !== null
  },
})
