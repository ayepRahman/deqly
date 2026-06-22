import { ConvexError, v } from 'convex/values'
import { type QueryCtx, mutation, query } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { getUser } from './auth'

const cropDataValidator = v.object({
  crop: v.object({ x: v.number(), y: v.number() }),
  zoom: v.number(),
})

// Curated, URL-resolved public view of a user's profile (their Deqly name card).
// Never exposes auth-sensitive or uncropped-original fields. Shared by the public
// profile route and the connections feature so they return an identical shape.
export async function toPublicProfile(ctx: QueryCtx, user: Doc<'users'>) {
  const avatarImageUrl = user.avatarImageId
    ? await ctx.storage.getUrl(user.avatarImageId)
    : null
  const bannerImageUrl = user.bannerImageId
    ? await ctx.storage.getUrl(user.bannerImageId)
    : null

  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    occupation: user.occupation,
    mobileNumber: user.mobileNumber,
    websiteLink: user.websiteLink,
    addMobileToCard: user.addMobileToCard,
    addWebsiteToCard: user.addWebsiteToCard,
    avatarImageUrl,
    bannerImageUrl,
    description: user.description,
    cardColor: user.cardColor,
  }
}

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.username.toLowerCase().trim()
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first()

    if (!user) {
      return null
    }

    return toPublicProfile(ctx, user)
  },
})

export const updateAvatar = mutation({
  args: {
    storageId: v.id('_storage'),
    originalStorageId: v.optional(v.id('_storage')),
    cropData: v.optional(cropDataValidator),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUser(ctx)
    if (
      currentUser.avatarImageId &&
      currentUser.avatarImageId !== args.storageId
    ) {
      await ctx.storage.delete(currentUser.avatarImageId)
    }

    const patch: {
      avatarImageId: Id<'_storage'>
      originalAvatarImageId?: Id<'_storage'>
      avatarCropData?: typeof args.cropData
    } = { avatarImageId: args.storageId, avatarCropData: args.cropData }

    if (args.originalStorageId) {
      if (
        currentUser.originalAvatarImageId &&
        currentUser.originalAvatarImageId !== args.originalStorageId
      ) {
        await ctx.storage.delete(currentUser.originalAvatarImageId)
      }
      patch.originalAvatarImageId = args.originalStorageId
    }

    await ctx.db.patch(currentUser._id, patch)
  },
})

export const updateBanner = mutation({
  args: {
    storageId: v.id('_storage'),
    originalStorageId: v.optional(v.id('_storage')),
    cropData: v.optional(cropDataValidator),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUser(ctx)
    if (
      currentUser.bannerImageId &&
      currentUser.bannerImageId !== args.storageId
    ) {
      await ctx.storage.delete(currentUser.bannerImageId)
    }

    const patch: {
      bannerImageId: Id<'_storage'>
      originalBannerImageId?: Id<'_storage'>
      bannerCropData?: typeof args.cropData
    } = { bannerImageId: args.storageId, bannerCropData: args.cropData }

    if (args.originalStorageId) {
      if (
        currentUser.originalBannerImageId &&
        currentUser.originalBannerImageId !== args.originalStorageId
      ) {
        await ctx.storage.delete(currentUser.originalBannerImageId)
      }
      patch.originalBannerImageId = args.originalStorageId
    }

    await ctx.db.patch(currentUser._id, patch)
  },
})

export const checkUsernameAvailability = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const normalized = args.username.toLowerCase().trim()
    if (normalized.length < 3) {
      return {
        available: false,
        reason: 'Username must be at least 3 characters',
      }
    }
    if (!/^[a-z0-9_]+$/.test(normalized)) {
      return {
        available: false,
        reason: 'Only lowercase letters, numbers, and underscores',
      }
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first()

    if (existing) {
      return { available: false, reason: 'Username is already taken' }
    }

    return { available: true, reason: null }
  },
})

export const updateProfileCard = mutation({
  args: {
    name: v.optional(v.string()),
    occupation: v.optional(v.string()),
    description: v.optional(v.string()),
    cardColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUser(ctx)
    if (args.description && args.description.length > 220) {
      throw new ConvexError('Description must be 220 characters or less')
    }
    await ctx.db.patch(currentUser._id, {
      name: args.name,
      occupation: args.occupation,
      description: args.description,
      cardColor: args.cardColor,
    })
  },
})

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    username: v.string(),
    occupation: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    websiteLink: v.optional(v.string()),
    addMobileToCard: v.optional(v.boolean()),
    addWebsiteToCard: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUser(ctx)

    const normalized = args.username.toLowerCase().trim()
    if (normalized.length < 3) {
      throw new ConvexError('Username must be at least 3 characters')
    }
    if (!/^[a-z0-9_]+$/.test(normalized)) {
      throw new ConvexError(
        'Username can only contain lowercase letters, numbers, and underscores',
      )
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first()

    if (existing && existing._id !== currentUser._id) {
      throw new ConvexError('Username is already taken')
    }

    await ctx.db.patch(currentUser._id, {
      name: args.name,
      username: normalized,
      occupation: args.occupation,
      mobileNumber: args.mobileNumber,
      websiteLink: args.websiteLink,
      addMobileToCard: args.addMobileToCard,
      addWebsiteToCard: args.addWebsiteToCard,
    })
  },
})
