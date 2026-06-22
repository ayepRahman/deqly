import { defineConfig } from 'vitest/config'

// Convex functions run in an edge-like runtime, so tests use convex-test under
// the edge-runtime environment. We don't reuse vite.config.ts here — the
// Cloudflare/TanStack Start plugins aren't relevant to backend unit tests.
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    include: ['convex/tests/**/*.test.ts'],
    server: {
      deps: {
        inline: ['convex-test'],
      },
    },
  },
})
