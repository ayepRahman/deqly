import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    username: v.optional(v.string()),
    occupation: v.optional(v.string()),
    mobileNumber: v.optional(v.string()),
    websiteLink: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  numbers: defineTable({
    value: v.number(),
  }),
});
