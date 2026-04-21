import { internalMutation } from './_generated/server'

/**
 * One-time migration: clear legacy Cloudflare Images IDs from cards/users.
 * Run once via `npx convex run migrations:clearLegacyImageIds` before
 * deploying the schema change that tightens imageId fields to v.id('_storage').
 * Safe to delete after it has been run in every environment.
 */
export const clearLegacyImageIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    let clearedCards = 0
    for (const card of await ctx.db.query('cards').collect()) {
      if (card.imageId) {
        await ctx.db.patch(card._id, { imageId: undefined })
        clearedCards += 1
      }
    }

    let clearedUsers = 0
    for (const user of await ctx.db.query('users').collect()) {
      const patch: { avatarImageId?: undefined; bannerImageId?: undefined } = {}
      if (user.avatarImageId) patch.avatarImageId = undefined
      if (user.bannerImageId) patch.bannerImageId = undefined
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch)
        clearedUsers += 1
      }
    }

    return { clearedCards, clearedUsers }
  },
})
