import { ConvexError } from 'convex/values'
import { action } from './_generated/server'

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_IMAGES_API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN

export const getCardImageUploadUrl = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError('Unauthenticated')
    }

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_IMAGES_API_TOKEN) {
      throw new ConvexError('Cloudflare Images not configured')
    }

    const form = new FormData()
    form.append('requireSignedURLs', 'false')

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
        },
        body: form,
      },
    )

    if (!response.ok) {
      const error = await response.text()
      throw new ConvexError(`Failed to get upload URL: ${error}`)
    }

    const data = (await response.json()) as {
      result: { uploadURL: string; id: string }
      success: boolean
    }

    if (!data.success) {
      throw new ConvexError('Cloudflare returned failure')
    }

    return { uploadURL: data.result.uploadURL, id: data.result.id }
  },
})
