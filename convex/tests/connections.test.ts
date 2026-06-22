import type { GenericMutationCtx, GenericQueryCtx } from 'convex/server'
import { convexTest } from 'convex-test'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { api } from '../_generated/api'
import type { DataModel, Id } from '../_generated/dataModel'
import schema from '../schema'

// Shared, mutable identity holder. `vi.hoisted` so both the mock factory
// (hoisted above imports) and the tests reference the same object.
const authState = vi.hoisted(() => ({
  userId: null as string | null,
}))

// Stand up the real Convex backend logic but swap identity resolution: instead
// of the better-auth component, getUser/safeGetUser resolve whichever seeded
// user the test is "acting as". Everything else in ./auth stays real so other
// modules (e.g. http.ts) still load.
vi.mock('../auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../auth')>()
  const { ConvexError } = await import('convex/values')

  const resolve = async (
    ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
  ) => {
    if (!authState.userId) {
      return null
    }
    const user = await ctx.db.get(authState.userId as Id<'users'>)
    if (!user) {
      return null
    }
    return { ...user, authId: 'test-auth-id', name: user.name ?? 'Tester' }
  }

  return {
    ...actual,
    safeGetUser: resolve,
    getUser: async (
      ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>,
    ) => {
      const user = await resolve(ctx)
      if (!user) {
        throw new ConvexError('Unauthenticated')
      }
      return user
    },
  }
})

// convex-test discovers function modules from a glob. Tests live in
// convex/tests, so normalize the `../` prefix to `./` (relative to the convex
// root) which is the layout convex-test expects.
const rawModules = import.meta.glob('../**/!(*.*.*)*.*s')
const modules = Object.fromEntries(
  Object.entries(rawModules).map(([key, loader]) => [
    key.replace(/^\.\.\//, './'),
    loader,
  ]),
)

type TestConvex = ReturnType<typeof convexTest>

function setup() {
  return convexTest(schema, modules)
}

async function createUser(
  t: TestConvex,
  fields: { name?: string; username?: string; email?: string } = {},
) {
  return t.run(async (ctx) =>
    ctx.db.insert('users', {
      email: fields.email ?? `${fields.username ?? 'user'}@example.com`,
      name: fields.name,
      username: fields.username,
    }),
  )
}

function actAs(userId: Id<'users'> | null) {
  authState.userId = userId
}

const firstPage = { numItems: 50, cursor: null }

beforeEach(() => {
  authState.userId = null
})

describe('recordView', () => {
  test('records a view of another user', async () => {
    const t = setup()
    const viewer = await createUser(t, { username: 'viewer' })
    const viewed = await createUser(t, { username: 'viewed' })

    actAs(viewer)
    await t.mutation(api.connections.recordView, { viewedUserId: viewed })

    const result = await t.query(api.connections.listRecentlyViewed, {
      paginationOpts: firstPage,
    })
    expect(result.page).toHaveLength(1)
    expect(result.page[0]._id).toBe(viewed)
    expect(result.page[0].username).toBe('viewed')
    expect(result.page[0].isCollected).toBe(false)
  })

  test('dedupes and bumps lastViewedAt on re-view', async () => {
    const t = setup()
    const viewer = await createUser(t, { username: 'viewer' })
    const viewed = await createUser(t, { username: 'viewed' })

    actAs(viewer)
    await t.mutation(api.connections.recordView, { viewedUserId: viewed })
    const firstCount = await t.query(api.connections.countRecentlyViewed, {})

    await t.mutation(api.connections.recordView, { viewedUserId: viewed })
    const secondCount = await t.query(api.connections.countRecentlyViewed, {})

    expect(firstCount).toBe(1)
    expect(secondCount).toBe(1)

    const rows = await t.run(async (ctx) =>
      ctx.db
        .query('recentlyViewed')
        .withIndex('by_viewer_and_viewed', (q) =>
          q.eq('viewerId', viewer).eq('viewedUserId', viewed),
        )
        .collect(),
    )
    expect(rows).toHaveLength(1)
  })

  test('ignores self-views', async () => {
    const t = setup()
    const viewer = await createUser(t, { username: 'viewer' })

    actAs(viewer)
    await t.mutation(api.connections.recordView, { viewedUserId: viewer })

    const count = await t.query(api.connections.countRecentlyViewed, {})
    expect(count).toBe(0)
  })

  test('is a no-op for a non-existent viewed user', async () => {
    const t = setup()
    const viewer = await createUser(t, { username: 'viewer' })
    const ghost = await createUser(t, { username: 'ghost' })
    await t.run(async (ctx) => ctx.db.delete(ghost))

    actAs(viewer)
    await t.mutation(api.connections.recordView, { viewedUserId: ghost })

    const count = await t.query(api.connections.countRecentlyViewed, {})
    expect(count).toBe(0)
  })

  test('prunes to the most-recent 50 entries', async () => {
    const t = setup()
    const viewer = await createUser(t, { username: 'viewer' })

    actAs(viewer)
    for (let i = 0; i < 52; i++) {
      const viewed = await createUser(t, { username: `viewed${i}` })
      await t.mutation(api.connections.recordView, { viewedUserId: viewed })
    }

    const count = await t.query(api.connections.countRecentlyViewed, {})
    expect(count).toBe(50)
  })

  test('requires authentication', async () => {
    const t = setup()
    const viewed = await createUser(t, { username: 'viewed' })

    actAs(null)
    await expect(
      t.mutation(api.connections.recordView, { viewedUserId: viewed }),
    ).rejects.toThrow(/Unauthenticated/)
  })
})

describe('listRecentlyViewed', () => {
  test('paginates newest-first and reports isDone/cursor', async () => {
    const t = setup()
    const viewer = await createUser(t, { username: 'viewer' })

    actAs(viewer)
    const viewedIds: Array<Id<'users'>> = []
    for (let i = 0; i < 25; i++) {
      const viewed = await createUser(t, { username: `viewed${i}` })
      viewedIds.push(viewed)
      await t.mutation(api.connections.recordView, { viewedUserId: viewed })
    }

    const page1 = await t.query(api.connections.listRecentlyViewed, {
      paginationOpts: { numItems: 10, cursor: null },
    })
    expect(page1.page).toHaveLength(10)
    expect(page1.isDone).toBe(false)
    // Newest view (last recorded) comes first.
    expect(page1.page[0]._id).toBe(viewedIds[24])

    const page2 = await t.query(api.connections.listRecentlyViewed, {
      paginationOpts: { numItems: 10, cursor: page1.continueCursor },
    })
    expect(page2.page).toHaveLength(10)
    expect(page2.isDone).toBe(false)

    const page3 = await t.query(api.connections.listRecentlyViewed, {
      paginationOpts: { numItems: 10, cursor: page2.continueCursor },
    })
    expect(page3.page).toHaveLength(5)
    expect(page3.isDone).toBe(true)
  })

  test('flags isCollected for saved connections', async () => {
    const t = setup()
    const viewer = await createUser(t, { username: 'viewer' })
    const a = await createUser(t, { username: 'a' })
    const b = await createUser(t, { username: 'b' })

    actAs(viewer)
    await t.mutation(api.connections.recordView, { viewedUserId: a })
    await t.mutation(api.connections.recordView, { viewedUserId: b })
    await t.mutation(api.connections.saveConnection, { savedUserId: a })

    const result = await t.query(api.connections.listRecentlyViewed, {
      paginationOpts: firstPage,
    })
    const byId = new Map(result.page.map((row) => [row._id, row.isCollected]))
    expect(byId.get(a)).toBe(true)
    expect(byId.get(b)).toBe(false)
  })

  test('requires authentication', async () => {
    const t = setup()
    actAs(null)
    await expect(
      t.query(api.connections.listRecentlyViewed, {
        paginationOpts: firstPage,
      }),
    ).rejects.toThrow(/Unauthenticated/)
  })
})

describe('saveConnection / unsaveConnection', () => {
  test('saves, then reports it as collected', async () => {
    const t = setup()
    const collector = await createUser(t, { username: 'collector' })
    const target = await createUser(t, { username: 'target' })

    actAs(collector)
    await t.mutation(api.connections.saveConnection, { savedUserId: target })

    const count = await t.query(api.connections.countCollection, {})
    const saved = await t.query(api.connections.isConnectionSaved, {
      savedUserId: target,
    })
    const list = await t.query(api.connections.listCollection, {
      paginationOpts: firstPage,
    })

    expect(count).toBe(1)
    expect(saved).toBe(true)
    expect(list.page).toHaveLength(1)
    expect(list.page[0]._id).toBe(target)
    expect(list.page[0].username).toBe('target')
  })

  test('is idempotent', async () => {
    const t = setup()
    const collector = await createUser(t, { username: 'collector' })
    const target = await createUser(t, { username: 'target' })

    actAs(collector)
    const first = await t.mutation(api.connections.saveConnection, {
      savedUserId: target,
    })
    const second = await t.mutation(api.connections.saveConnection, {
      savedUserId: target,
    })

    expect(first).toBe(second)
    const count = await t.query(api.connections.countCollection, {})
    expect(count).toBe(1)
  })

  test('rejects saving yourself', async () => {
    const t = setup()
    const collector = await createUser(t, { username: 'collector' })

    actAs(collector)
    const result = await t.mutation(api.connections.saveConnection, {
      savedUserId: collector,
    })

    expect(result).toBeNull()
    const count = await t.query(api.connections.countCollection, {})
    expect(count).toBe(0)
  })

  test('throws when saving a non-existent user', async () => {
    const t = setup()
    const collector = await createUser(t, { username: 'collector' })
    const ghost = await createUser(t, { username: 'ghost' })
    await t.run(async (ctx) => ctx.db.delete(ghost))

    actAs(collector)
    await expect(
      t.mutation(api.connections.saveConnection, { savedUserId: ghost }),
    ).rejects.toThrow(/User not found/)
  })

  test('unsave removes the connection', async () => {
    const t = setup()
    const collector = await createUser(t, { username: 'collector' })
    const target = await createUser(t, { username: 'target' })

    actAs(collector)
    await t.mutation(api.connections.saveConnection, { savedUserId: target })
    await t.mutation(api.connections.unsaveConnection, { savedUserId: target })

    const count = await t.query(api.connections.countCollection, {})
    const saved = await t.query(api.connections.isConnectionSaved, {
      savedUserId: target,
    })
    expect(count).toBe(0)
    expect(saved).toBe(false)
  })

  test('unsave is a no-op when nothing is saved', async () => {
    const t = setup()
    const collector = await createUser(t, { username: 'collector' })
    const target = await createUser(t, { username: 'target' })

    actAs(collector)
    // A void mutation return is serialized as null over the Convex wire.
    await expect(
      t.mutation(api.connections.unsaveConnection, { savedUserId: target }),
    ).resolves.toBeNull()
  })

  test('save and unsave require authentication', async () => {
    const t = setup()
    const target = await createUser(t, { username: 'target' })

    actAs(null)
    await expect(
      t.mutation(api.connections.saveConnection, { savedUserId: target }),
    ).rejects.toThrow(/Unauthenticated/)
    await expect(
      t.mutation(api.connections.unsaveConnection, { savedUserId: target }),
    ).rejects.toThrow(/Unauthenticated/)
  })
})

describe('listCollection', () => {
  test('clamps an over-large page size to the server max', async () => {
    const t = setup()
    const collector = await createUser(t, { username: 'collector' })

    actAs(collector)
    for (let i = 0; i < 60; i++) {
      const target = await createUser(t, { username: `target${i}` })
      await t.mutation(api.connections.saveConnection, { savedUserId: target })
    }

    const result = await t.query(api.connections.listCollection, {
      paginationOpts: { numItems: 1000, cursor: null },
    })
    // MAX_PAGE_SIZE is 50, so the page is capped even though 60 exist.
    expect(result.page).toHaveLength(50)
    expect(result.isDone).toBe(false)

    const count = await t.query(api.connections.countCollection, {})
    expect(count).toBe(60)
  })

  test('drops entries whose saved user was deleted (live reference)', async () => {
    const t = setup()
    const collector = await createUser(t, { username: 'collector' })
    const target = await createUser(t, { username: 'target' })

    actAs(collector)
    await t.mutation(api.connections.saveConnection, { savedUserId: target })
    await t.run(async (ctx) => ctx.db.delete(target))

    const list = await t.query(api.connections.listCollection, {
      paginationOpts: firstPage,
    })
    const count = await t.query(api.connections.countCollection, {})

    // The list filters out the dangling reference, but the raw count still
    // reflects the stored row.
    expect(list.page).toHaveLength(0)
    expect(count).toBe(1)
  })

  test('requires authentication', async () => {
    const t = setup()
    actAs(null)
    await expect(
      t.query(api.connections.listCollection, { paginationOpts: firstPage }),
    ).rejects.toThrow(/Unauthenticated/)
  })
})

describe('isConnectionSaved', () => {
  test('returns false when unauthenticated', async () => {
    const t = setup()
    const target = await createUser(t, { username: 'target' })

    actAs(null)
    const saved = await t.query(api.connections.isConnectionSaved, {
      savedUserId: target,
    })
    expect(saved).toBe(false)
  })
})

describe('listRecentlyViewed (extra)', () => {
  test('drops entries whose viewed user was deleted', async () => {
    const t = setup()
    const viewer = await createUser(t, { username: 'viewer' })
    const present = await createUser(t, { username: 'present' })
    const gone = await createUser(t, { username: 'gone' })

    actAs(viewer)
    await t.mutation(api.connections.recordView, { viewedUserId: present })
    await t.mutation(api.connections.recordView, { viewedUserId: gone })
    await t.run(async (ctx) => ctx.db.delete(gone))

    const list = await t.query(api.connections.listRecentlyViewed, {
      paginationOpts: firstPage,
    })
    const count = await t.query(api.connections.countRecentlyViewed, {})

    // Dangling reference is filtered from the page, but the raw count remains.
    expect(list.page).toHaveLength(1)
    expect(list.page[0]._id).toBe(present)
    expect(count).toBe(2)
  })
})

describe('listCollection (extra)', () => {
  test('orders newest-saved first', async () => {
    const t = setup()
    const collector = await createUser(t, { username: 'collector' })
    const first = await createUser(t, { username: 'first' })
    const second = await createUser(t, { username: 'second' })

    actAs(collector)
    await t.mutation(api.connections.saveConnection, { savedUserId: first })
    await t.mutation(api.connections.saveConnection, { savedUserId: second })

    const list = await t.query(api.connections.listCollection, {
      paginationOpts: firstPage,
    })
    expect(list.page.map((row) => row._id)).toEqual([second, first])
  })
})

describe('count queries require authentication', () => {
  test('countRecentlyViewed throws when unauthenticated', async () => {
    const t = setup()
    actAs(null)
    await expect(
      t.query(api.connections.countRecentlyViewed, {}),
    ).rejects.toThrow(/Unauthenticated/)
  })

  test('countCollection throws when unauthenticated', async () => {
    const t = setup()
    actAs(null)
    await expect(t.query(api.connections.countCollection, {})).rejects.toThrow(
      /Unauthenticated/,
    )
  })
})
