import { createAPIFileRoute } from '@tanstack/start/api'
import { getWebRequest } from '@tanstack/start/server'
import { auth } from '~/lib/auth-server'

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CLOUDFLARE_IMAGES_API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN

export const APIRoute = createAPIFileRoute('/api/upload/image')({
  GET: async () => {
    const request = getWebRequest()
    const session = await auth.api.getSession({ headers: request.headers })

    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_IMAGES_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'Cloudflare Images not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_IMAGES_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requireSignedURLs: false }),
      },
    )

    if (!response.ok) {
      const error = await response.text()
      return new Response(
        JSON.stringify({ error: 'Failed to get upload URL', detail: error }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    const data = (await response.json()) as {
      result: { uploadURL: string; id: string }
      success: boolean
    }

    if (!data.success) {
      return new Response(
        JSON.stringify({ error: 'Cloudflare returned failure' }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(
      JSON.stringify({ uploadURL: data.result.uploadURL, id: data.result.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  },
})
