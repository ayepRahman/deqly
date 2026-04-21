import { mutation } from './_generated/server'
import { getUser } from './auth'

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})
