import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUser } from './auth'

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .first()

    if (!user) {
      return null
    }

    return {
      name: user.name,
      username: user.username,
      email: user.email,
      occupation: user.occupation,
      mobileNumber: user.mobileNumber,
      websiteLink: user.websiteLink,
      avatarImageId: user.avatarImageId,
      bannerImageId: user.bannerImageId,
    }
  },
})

export const updateAvatar = mutation({
  args: { imageId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getUser(ctx)
    await ctx.db.patch(currentUser._id, { avatarImageId: args.imageId })
  },
})

export const updateBanner = mutation({
  args: { imageId: v.string() },
  handler: async (ctx, args) => {
    const currentUser = await getUser(ctx)
    await ctx.db.patch(currentUser._id, { bannerImageId: args.imageId })
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

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    username: v.string(),
    occupation: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    websiteLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUser(ctx)

    const normalized = args.username.toLowerCase().trim()
    if (normalized.length < 3) {
      throw new Error('Username must be at least 3 characters')
    }
    if (!/^[a-z0-9_]+$/.test(normalized)) {
      throw new Error(
        'Username can only contain lowercase letters, numbers, and underscores',
      )
    }

    const existing = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', normalized))
      .first()

    if (existing && existing._id !== currentUser._id) {
      throw new Error('Username is already taken')
    }

    await ctx.db.patch(currentUser._id, {
      name: args.name,
      username: normalized,
      occupation: args.occupation,
      mobileNumber: args.mobileNumber,
      websiteLink: args.websiteLink,
    })
  },
})
