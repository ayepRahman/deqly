import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Crop position/zoom persisted so the cropper can re-open at the last framing.
const cropDataValidator = v.object({
  crop: v.object({ x: v.number(), y: v.number() }),
  zoom: v.number(),
})

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
    // Uncropped sources + crop framing, kept so images can be re-cropped losslessly
    originalAvatarImageId: v.optional(v.id('_storage')),
    avatarCropData: v.optional(cropDataValidator),
    originalBannerImageId: v.optional(v.id('_storage')),
    bannerCropData: v.optional(cropDataValidator),
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
    // Uncropped source + crop framing for lossless re-cropping
    originalImageId: v.optional(v.id('_storage')),
    cropData: v.optional(cropDataValidator),
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
  // A logged-in viewer's recent views of other users' Deqlys. Deduped to one
  // row per (viewer, viewed) pair; lastViewedAt is bumped on re-view.
  recentlyViewed: defineTable({
    viewerId: v.id('users'), // who viewed
    viewedUserId: v.id('users'), // whose Deqly was viewed
    lastViewedAt: v.number(), // bumped on re-view; drives the paginated sort
  })
    // Compound index lets us paginate in lastViewedAt-desc order directly.
    .index('by_viewer_and_lastViewedAt', ['viewerId', 'lastViewedAt'])
    .index('by_viewer_and_viewed', ['viewerId', 'viewedUserId']),
  // Connections a user has saved to their collection. Live reference: only the
  // FK is stored; the saved Deqly is resolved at query time.
  collectedConnections: defineTable({
    collectorId: v.id('users'), // who saved
    savedUserId: v.id('users'), // the saved person
  })
    .index('by_collector', ['collectorId'])
    .index('by_collector_and_saved', ['collectorId', 'savedUserId']),
  numbers: defineTable({
    value: v.number(),
  }),
})
