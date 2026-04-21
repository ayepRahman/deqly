import {
  type AuthFunctions,
  createClient,
  type GenericCtx,
} from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { type BetterAuthOptions, betterAuth } from 'better-auth/minimal'
import { magicLink } from 'better-auth/plugins/magic-link'
import { ConvexError } from 'convex/values'
import { Resend } from 'resend'
import { components, internal } from './_generated/api'
import type { DataModel, Id } from './_generated/dataModel'
import { type MutationCtx, type QueryCtx, query } from './_generated/server'
import authConfig from './auth.config'

const siteUrl = process.env.SITE_URL

const authFunctions: AuthFunctions = internal.auth

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  verbose: false,
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        const userId = await ctx.db.insert('users', {
          email: authUser.email,
        })
        await authComponent.setUserId(ctx, authUser._id, userId)
      },
      onUpdate: async (ctx, newUser, oldUser) => {
        if (oldUser.email === newUser.email) {
          return
        }
        await ctx.db.patch(newUser.userId as Id<'users'>, {
          email: newUser.email,
        })
      },
      onDelete: async (ctx, authUser) => {
        const user = await ctx.db.get(authUser.userId as Id<'users'>)
        if (!user) {
          return
        }
        await ctx.db.delete(user._id)
      },
    },
  },
})

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi()

export const { getAuthUser } = authComponent.clientApi()

export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
  ({
    baseURL: siteUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: false,
    },
    user: {
      additionalFields: {
        username: {
          type: 'string',
          required: false,
          input: true,
        },
        occupation: {
          type: 'string',
          required: false,
          input: true,
        },
        mobileNumber: {
          type: 'string',
          required: false,
          input: true,
        },
        websiteLink: {
          type: 'string',
          required: false,
          input: true,
        },
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: process.env.EMAIL_FROM ?? 'Deqly <noreply@deqly.com>',
            to: email,
            subject: 'Sign in to Deqly',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Sign in to Deqly</h2>
                <p>Click the link below to sign in to your account:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px;">
                  Sign in to Deqly
                </a>
                <p style="color: #666; font-size: 14px; margin-top: 16px;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </div>
            `,
          })
        },
        expiresIn: 600,
      }),
      convex({
        authConfig,
      }),
    ],
  }) satisfies BetterAuthOptions

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx))

export const safeGetUser = async (ctx: QueryCtx | MutationCtx) => {
  const authUser = await authComponent.safeGetAuthUser(ctx)
  if (!authUser) {
    return null
  }
  const user = await ctx.db.get(authUser.userId as Id<'users'>)
  if (!user) {
    return null
  }
  return { ...user, authId: authUser._id, name: user.name ?? authUser.name }
}

export const getUser = async (ctx: QueryCtx | MutationCtx) => {
  const user = await safeGetUser(ctx)
  if (!user) {
    throw new ConvexError('Unauthenticated')
  }
  return user
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await safeGetUser(ctx)
    if (!user) {
      return null
    }
    const avatarImageUrl = user.avatarImageId
      ? await ctx.storage.getUrl(user.avatarImageId)
      : null
    const bannerImageUrl = user.bannerImageId
      ? await ctx.storage.getUrl(user.bannerImageId)
      : null
    return { ...user, avatarImageUrl, bannerImageUrl }
  },
})
