import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    occupation: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    websiteLink: v.optional(v.string()),
    addMobileToCard: v.optional(v.boolean()),
    addWebsiteToCard: v.optional(v.boolean()),
    avatarImageId: v.optional(v.id('_storage')),
    bannerImageId: v.optional(v.id('_storage')),
    description: v.optional(v.string()),
    cardColor: v.optional(v.string()),
  })
    .index('by_email', ['email'])
    .index('by_username', ['username']),
  cards: defineTable({
    userId: v.id('users'),
    type: v.union(v.literal('showcase'), v.literal('story')),
    // showcase fields
    imageId: v.optional(v.id('_storage')),
    name: v.optional(v.string()),
    occupation: v.optional(v.string()),
    description: v.optional(v.string()),
    // story fields
    storyBlocks: v.optional(
      v.array(
        v.object({
          title: v.string(),
          subheader: v.optional(v.string()),
          description: v.optional(v.string()),
        }),
      ),
    ),
    color: v.optional(v.string()),
    order: v.number(),
  }).index('by_userId', ['userId']),
  numbers: defineTable({
    value: v.number(),
  }),
})
