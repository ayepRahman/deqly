import { convexBetterAuthReactStart } from '@convex-dev/better-auth/react-start'

export const {
  handler,
  getToken,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
} = convexBetterAuthReactStart({
  // biome-ignore lint/style/noNonNullAssertion: env vars asserted at runtime
  convexUrl: process.env.VITE_CONVEX_URL!,
  // biome-ignore lint/style/noNonNullAssertion: env vars asserted at runtime
  convexSiteUrl: process.env.VITE_CONVEX_SITE_URL!,
})
