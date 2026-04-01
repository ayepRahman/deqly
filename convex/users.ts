import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUser } from "./auth";

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      return null;
    }

    return {
      username: user.username,
      email: user.email,
      occupation: user.occupation,
      mobileNumber: user.mobileNumber,
      websiteLink: user.websiteLink,
    };
  },
});

export const updateProfile = mutation({
  args: {
    username: v.string(),
    occupation: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    websiteLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUser(ctx);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existing && existing._id !== currentUser._id) {
      throw new Error("Username is already taken");
    }

    await ctx.db.patch(currentUser._id, {
      username: args.username,
      occupation: args.occupation,
      mobileNumber: args.mobileNumber,
      websiteLink: args.websiteLink,
    });
  },
});
