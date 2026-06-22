import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from '../_generated/api'
import schema from '../schema'

// getByUsername is a public query (no auth), so no auth mock is needed here.
const rawModules = import.meta.glob('../**/!(*.*.*)*.*s')
const modules = Object.fromEntries(
  Object.entries(rawModules).map(([key, loader]) => [
    key.replace(/^\.\.\//, './'),
    loader,
  ]),
)

function setup() {
  return convexTest(schema, modules)
}

describe('getByUsername / toPublicProfile', () => {
  test('returns null when no user matches', async () => {
    const t = setup()
    const result = await t.query(api.users.getByUsername, {
      username: 'nobody',
    })
    expect(result).toBeNull()
  })

  test('normalizes the username before lookup', async () => {
    const t = setup()
    await t.run(async (ctx) =>
      ctx.db.insert('users', { email: 'a@example.com', username: 'alice' }),
    )

    // Mixed case + surrounding whitespace should still resolve.
    const result = await t.query(api.users.getByUsername, {
      username: '  ALICE  ',
    })
    expect(result?.username).toBe('alice')
  })

  test('returns the curated public projection', async () => {
    const t = setup()
    await t.run(async (ctx) =>
      ctx.db.insert('users', {
        email: 'bob@example.com',
        name: 'Bob',
        username: 'bob',
        occupation: 'Builder',
        mobileNumber: '12345',
        websiteLink: 'https://bob.example',
        addMobileToCard: true,
        addWebsiteToCard: false,
        description: 'Can we fix it?',
        cardColor: '#8b5cf6',
      }),
    )

    const result = await t.query(api.users.getByUsername, { username: 'bob' })

    expect(result).toMatchObject({
      name: 'Bob',
      username: 'bob',
      email: 'bob@example.com',
      occupation: 'Builder',
      mobileNumber: '12345',
      websiteLink: 'https://bob.example',
      addMobileToCard: true,
      addWebsiteToCard: false,
      description: 'Can we fix it?',
      cardColor: '#8b5cf6',
      avatarImageUrl: null,
      bannerImageUrl: null,
    })
  })

  test('never exposes storage IDs or uncropped originals', async () => {
    const t = setup()
    const storageId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob(['original'], { type: 'image/png' })),
    )
    await t.run(async (ctx) =>
      ctx.db.insert('users', {
        email: 'carol@example.com',
        username: 'carol',
        avatarImageId: storageId,
        originalAvatarImageId: storageId,
      }),
    )

    const result = await t.query(api.users.getByUsername, { username: 'carol' })

    // The projection resolves URLs but must not leak raw IDs or originals.
    expect(result).not.toHaveProperty('avatarImageId')
    expect(result).not.toHaveProperty('originalAvatarImageId')
    expect(result).not.toHaveProperty('avatarCropData')
  })

  test('resolves avatar and banner storage IDs to URLs', async () => {
    const t = setup()
    const avatarId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob(['avatar'], { type: 'image/png' })),
    )
    const bannerId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob(['banner'], { type: 'image/png' })),
    )
    await t.run(async (ctx) =>
      ctx.db.insert('users', {
        email: 'dave@example.com',
        username: 'dave',
        avatarImageId: avatarId,
        bannerImageId: bannerId,
      }),
    )

    const result = await t.query(api.users.getByUsername, { username: 'dave' })

    expect(typeof result?.avatarImageUrl).toBe('string')
    expect(typeof result?.bannerImageUrl).toBe('string')
  })
})
