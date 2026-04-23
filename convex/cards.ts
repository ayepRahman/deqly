import { v } from 'convex/values'
import { type QueryCtx, mutation, query } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { getUser } from './auth'

const MAX_CARDS = 3
const MAX_TITLE = 30
const MAX_SUBTITLE = 35
const MAX_SHOWCASE_DESCRIPTION = 155
const MAX_STORY_DESCRIPTION = 220
const MAX_STORY_BLOCKS = 2

const storyBlockValidator = v.object({
  title: v.string(),
  subheader: v.optional(v.string()),
  description: v.optional(v.string()),
})

async function withImageUrls(
  ctx: QueryCtx,
  cards: Array<Doc<'cards'>>,
) {
  return Promise.all(
    cards.map(async (card) => ({
      ...card,
      imageUrl: card.imageId ? await ctx.storage.getUrl(card.imageId) : null,
    })),
  )
}

export const listMyCards = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx)
    const cards = await ctx.db
      .query('cards')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    const sorted = cards.sort((a, b) => a.order - b.order)
    return withImageUrls(ctx, sorted)
  },
})

export const listByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query('cards')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect()
    const sorted = cards.sort((a, b) => a.order - b.order)
    return withImageUrls(ctx, sorted)
  },
})

export const createCard = mutation({
  args: {
    type: v.union(v.literal('showcase'), v.literal('story')),
    name: v.optional(v.string()),
    occupation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)

    const existing = await ctx.db
      .query('cards')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    if (existing.length >= MAX_CARDS) {
      throw new Error(`You can create up to ${MAX_CARDS} cards`)
    }

    if (args.name && args.name.length > MAX_TITLE) {
      throw new Error(`Name must be ${MAX_TITLE} characters or less`)
    }

    if (args.occupation && args.occupation.length > MAX_SUBTITLE) {
      throw new Error(`Occupation must be ${MAX_SUBTITLE} characters or less`)
    }

    const type = args.type

    const cardId = await ctx.db.insert('cards', {
      userId: user._id,
      type,
      name: args.name,
      occupation: args.occupation,
      storyBlocks:
        type === 'story'
          ? [{ title: '', subheader: '', description: '' }]
          : undefined,
      order: existing.length,
    })

    return cardId
  },
})

export const updateCard = mutation({
  args: {
    cardId: v.id('cards'),
    name: v.optional(v.string()),
    occupation: v.optional(v.string()),
    description: v.optional(v.string()),
    storyBlocks: v.optional(v.array(storyBlockValidator)),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)
    const card = await ctx.db.get(args.cardId)

    if (!card || card.userId !== user._id) {
      throw new Error('Card not found')
    }

    if (args.name && args.name.length > MAX_TITLE) {
      throw new Error(`Name must be ${MAX_TITLE} characters or less`)
    }

    if (args.occupation && args.occupation.length > MAX_SUBTITLE) {
      throw new Error(`Occupation must be ${MAX_SUBTITLE} characters or less`)
    }

    if (args.description !== undefined) {
      const maxDescription =
        card.type === 'story' ? MAX_STORY_DESCRIPTION : MAX_SHOWCASE_DESCRIPTION
      if (args.description.length > maxDescription) {
        throw new Error(
          `Description must be ${maxDescription} characters or less`,
        )
      }
    }

    if (args.storyBlocks) {
      if (args.storyBlocks.length > MAX_STORY_BLOCKS) {
        throw new Error(`Story cards can have up to ${MAX_STORY_BLOCKS} blocks`)
      }
      for (const block of args.storyBlocks) {
        if (block.title.length > MAX_TITLE) {
          throw new Error(`Title must be ${MAX_TITLE} characters or less`)
        }
        if (block.subheader && block.subheader.length > MAX_SUBTITLE) {
          throw new Error(
            `Subheader must be ${MAX_SUBTITLE} characters or less`,
          )
        }
        if (
          block.description &&
          block.description.length > MAX_STORY_DESCRIPTION
        ) {
          throw new Error(
            `Description must be ${MAX_STORY_DESCRIPTION} characters or less`,
          )
        }
      }
    }

    const { cardId, ...updates } = args
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    )

    await ctx.db.patch(cardId, filtered)
  },
})

export const deleteCard = mutation({
  args: { cardId: v.id('cards') },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)
    const card = await ctx.db.get(args.cardId)

    if (!card || card.userId !== user._id) {
      throw new Error('Card not found')
    }

    if (card.imageId) {
      await ctx.storage.delete(card.imageId)
    }

    await ctx.db.delete(args.cardId)

    const remaining = await ctx.db
      .query('cards')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()

    const sorted = remaining.sort((a, b) => a.order - b.order)
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await ctx.db.patch(sorted[i]._id, { order: i })
      }
    }
  },
})

export const updateCardImage = mutation({
  args: {
    cardId: v.id('cards'),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx)
    const card = await ctx.db.get(args.cardId)

    if (!card || card.userId !== user._id) {
      throw new Error('Card not found')
    }

    if (card.imageId && card.imageId !== args.storageId) {
      await ctx.storage.delete(card.imageId)
    }

    await ctx.db.patch(args.cardId, { imageId: args.storageId })
  },
})
