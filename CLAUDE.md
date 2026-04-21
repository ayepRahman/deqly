# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs Convex sync once then starts both web + Convex watch)
npm run dev

# Web only
npm run dev:web

# Convex backend watch only
npm run dev:convex

# Build
npm run build

# Lint (TypeScript check + ESLint, zero warnings)
npm run lint

# Format
npm run format
```

> Package manager is **pnpm** (v10). Use `pnpm` instead of `npm` when adding/removing packages.

## Environment Variables

Required in `.env.local`:

| Variable | Purpose |
|---|---|
| `VITE_CONVEX_URL` | Convex deployment URL |
| `BETTER_AUTH_SECRET` | Secret for Better Auth |
| `SITE_URL` | Base URL for magic link emails |
| `RESEND_API_KEY` | Transactional email via Resend |
| `EMAIL_FROM` | Sender address (default: `Deqly <noreply@deqly.com>`) |

Images are served from Convex file storage — no image-specific env vars required.

## Architecture

### Stack

- **Frontend**: React 19 + TanStack Router (SSR via TanStack Start) + TanStack Query
- **Backend**: Convex (real-time database + serverless functions)
- **Auth**: Better Auth + `@convex-dev/better-auth` — magic link only (email/password disabled)
- **Email**: Resend
- **Image storage**: Convex file storage (`ctx.storage`) with direct client upload
- **Styling**: Tailwind CSS v4 + `class-variance-authority`
- **Icons**: lucide-react (use this everywhere, no other icon libraries)

### Routing

TanStack Router with file-based routing under `src/routes/`. Auto-generated route tree lives in `src/routeTree.gen.ts` — do not edit manually.

- `__root.tsx` — wraps everything in `ConvexBetterAuthProvider`, fetches the auth token server-side, passes it as `initialToken`
- `_app.tsx` — authenticated layout; route group for logged-in pages
- `_app/index.tsx` — main card editor page
- `$username.tsx` — public profile view
- `login.tsx` — magic link login/signup flow
- `api/auth/$.ts` — Better Auth HTTP handler (catch-all)
- `api/upload/image.ts` — server route to get a Cloudflare Images direct-upload URL

### Convex Backend (`convex/`)

| File | Purpose |
|---|---|
| `schema.ts` | Database schema: `users`, `cards`, `numbers` tables |
| `auth.ts` | `authComponent` (Better Auth adapter), `getUser`/`safeGetUser` helpers, `getCurrentUser` query |
| `auth.config.ts` | JWT config for Convex auth verification |
| `cards.ts` | CRUD for cards (`listMyCards`, `createCard`, `updateCard`, `deleteCard`, `updateCardImage`) |
| `http.ts` | HTTP router — registers Better Auth routes |
| `convex.config.ts` | Convex component config |
| `_generated/` | Auto-generated — never edit |

### Auth Flow

1. User submits email → Better Auth sends magic link via Resend
2. User clicks link → session created, stored in Better Auth component tables
3. `__root.tsx` `beforeLoad` calls `getToken()` server-side to get the JWT
4. Token is injected into `ConvexQueryClient` for authenticated Convex queries
5. On the Convex side, `getUser(ctx)` / `safeGetUser(ctx)` retrieves the app `users` row via `authComponent`

### Data Model

**`users`** — app user profile, created via `auth.ts` `onCreate` trigger. Indexed by `email` and `username`.

**`cards`** — up to 3 cards per user, each with `type: "showcase" | "story"`.
- `showcase` cards: image (Cloudflare ID), name, description (max 220 chars)
- `story` cards: up to 2 `storyBlocks` (title, subheader, description)
- `order` field maintained after deletes

### Image Upload Flow

1. Client calls the `api.upload.generateUploadUrl` mutation (requires session) — it wraps `ctx.storage.generateUploadUrl()`.
2. Client POSTs the raw file body to that URL with `Content-Type: file.type`. Convex responds with `{ storageId }`.
3. Client calls `updateCardImage` / `updateAvatar` / `updateBanner` with the `storageId`. The mutation deletes any previous storage file before patching.
4. List/get queries (`listMyCards`, `listByUserId`, `getByUsername`, `getCurrentUser`) resolve storage IDs to URLs on the server via `ctx.storage.getUrl()` and return `imageUrl` / `avatarImageUrl` / `bannerImageUrl` fields alongside the data.

### Component Structure

**Flat, feature-grouped components** — keep files small and focused. Extract any component that grows beyond ~100 lines or is reusable into its own file.

Components live under `src/components/<feature>/`:

```
src/components/
  cards/
    types.ts              # Shared types, interfaces, constants, helpers (CardData, MAX_CARDS, …)
    card-icons.tsx        # Pure SVG/icon components (ImagePlaceholderIcon, AddCardIcon, AddBlockIcon)
    showcase-card.tsx     # ShowcaseCard component
    story-card.tsx        # StoryCard component
    empty-card-placeholder.tsx
  forms/
    select-card-type-dialog.tsx
    …
  login/
    …
  ui/
    …
```

Route files (`src/routes/`) must only contain the route definition and page-level orchestration (state, handlers, data fetching). Visual/presentational logic belongs in `src/components/`.

### Key Conventions

- Convex queries/mutations are accessed via the auto-generated `api` object: `import { api } from "../convex/_generated/api"`
- Auth helpers `getUser` (throws if unauthenticated) and `safeGetUser` (returns null) are used at the start of every protected mutation/query
- Business limits are defined as constants in `convex/cards.ts` and `src/components/cards/types.ts` — keep them in sync: `MAX_CARDS=3`, `MAX_DESCRIPTION=220`, `MAX_STORY_BLOCKS=2`
