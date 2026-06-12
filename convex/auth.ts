import {
  type AuthFunctions,
  createClient,
  type GenericCtx,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import { magicLink } from "better-auth/plugins/magic-link";
import { ConvexError } from "convex/values";
import { Resend } from "resend";
import { components, internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { type MutationCtx, type QueryCtx, query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL;

const buildMagicLinkText = (verifyUrl: string) =>
  [
    "Sign in to Deqly",
    "",
    "Click the link below to sign in. This link expires in 10 minutes and can only be used once.",
    "",
    verifyUrl,
    "",
    "If you didn't request this email, you can safely ignore it.",
  ].join("\n");

const buildMagicLinkHtml = (verifyUrl: string) => `<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#ffffff;">
    <div style="max-width:480px;margin:0 auto;padding:40px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111111;">
      <h1 style="font-size:20px;font-weight:700;margin:0 0 16px;">Sign in to Deqly</h1>
      <p style="font-size:14px;line-height:1.6;margin:0 0 24px;color:#444444;">
        Click the button below to sign in. This link expires in 10 minutes and can only be used once.
      </p>
      <p style="margin:0 0 24px;">
        <a href="${verifyUrl}" style="display:inline-block;background-color:#8b5cf6;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:9999px;">Sign in to Deqly</a>
      </p>
      <p style="font-size:13px;line-height:1.6;margin:0 0 24px;color:#666666;">
        Or copy and paste this link into your browser:<br />
        <a href="${verifyUrl}" style="color:#8b5cf6;word-break:break-all;">${verifyUrl}</a>
      </p>
      <p style="font-size:12px;line-height:1.6;margin:0;color:#999999;">
        If you didn't request this email, you can safely ignore it.
      </p>
    </div>
  </body>
</html>`;

const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  verbose: false,
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        const userId = await ctx.db.insert("users", {
          email: authUser.email,
        });
        await authComponent.setUserId(ctx, authUser._id, userId);
      },
      onUpdate: async (ctx, newUser, oldUser) => {
        if (oldUser.email === newUser.email) {
          return;
        }
        await ctx.db.patch(newUser.userId as Id<"users">, {
          email: newUser.email,
        });
      },
      onDelete: async (ctx, authUser) => {
        const user = await ctx.db.get(authUser.userId as Id<"users">);
        if (!user) {
          return;
        }
        await ctx.db.delete(user._id);
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export const { getAuthUser } = authComponent.clientApi();

export const createAuthOptions = (ctx: GenericCtx<DataModel>) =>
  ({
    baseURL: siteUrl,
    trustedOrigins: [
      siteUrl,
      "http://localhost:3000",
      "http://localhost:5173",
    ].filter((origin): origin is string => Boolean(origin)),
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: false,
    },
    user: {
      additionalFields: {
        username: {
          type: "string",
          required: false,
          input: true,
        },
        occupation: {
          type: "string",
          required: false,
          input: true,
        },
        mobileNumber: {
          type: "string",
          required: false,
          input: true,
        },
        websiteLink: {
          type: "string",
          required: false,
          input: true,
        },
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, token }) => {
          // Email a link to our interstitial page instead of the raw verify
          // endpoint — the one-time token is only consumed on an explicit
          // button click, so inbox link scanners can't burn it.
          const verifyUrl = `${siteUrl}/auth/verify?token=${encodeURIComponent(token)}`;
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: process.env.EMAIL_FROM ?? "Deqly <noreply@deqly.com>",
            to: email,
            subject: "Sign in to Deqly",
            html: buildMagicLinkHtml(verifyUrl),
            text: buildMagicLinkText(verifyUrl),
          });
        },
        expiresIn: 600,
      }),
      convex({
        authConfig,
      }),
    ],
  }) satisfies BetterAuthOptions;

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth(createAuthOptions(ctx));

export const safeGetUser = async (ctx: QueryCtx | MutationCtx) => {
  const authUser = await authComponent.safeGetAuthUser(ctx);
  if (!authUser) {
    return null;
  }
  const user = await ctx.db.get(authUser.userId as Id<"users">);
  if (!user) {
    return null;
  }
  return { ...user, authId: authUser._id, name: user.name ?? authUser.name };
};

export const getUser = async (ctx: QueryCtx | MutationCtx) => {
  const user = await safeGetUser(ctx);
  if (!user) {
    throw new ConvexError("Unauthenticated");
  }
  return user;
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await safeGetUser(ctx);
    if (!user) {
      return null;
    }
    const avatarImageUrl = user.avatarImageId
      ? await ctx.storage.getUrl(user.avatarImageId)
      : null;
    const bannerImageUrl = user.bannerImageId
      ? await ctx.storage.getUrl(user.bannerImageId)
      : null;
    return { ...user, avatarImageUrl, bannerImageUrl };
  },
});
