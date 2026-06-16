# Deqly

Deqly reimagines the traditional name card as a dynamic digital experience. Instead of being limited to two sides, users create a personalised deck — each card expressing a different facet of their professional and personal identity. Because no individual can be defined by a single title, but by a collection of experiences, skills, and passions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [TanStack Start](https://tanstack.com/start) |
| Routing | [TanStack Router](https://tanstack.com/router) |
| Backend | [Convex](https://convex.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| UI Components | [shadcn/ui](https://ui.shadcn.com) |
| Language | TypeScript |

## Documentation

| Doc | What's inside |
|-----|----------------|
| [Business Domain](./docs/business-domain.md) | What Deqly is, core concepts (decks, cards, card types), and business rules & limits. |
| [Onboarding & Auth Journey](./docs/onboarding.md) | The end-to-end flow from sign-in → magic link → onboarding → building a deck, and the route guards in between. |

> Developer setup (commands, environment variables, architecture) lives in
> [CLAUDE.md](./CLAUDE.md).

## Getting Started

```bash
pnpm install      # install dependencies (pnpm v10)
npm run dev       # sync Convex once, then run web + Convex watch
```

Set the required environment variables in `.env.local` first — see the
**Environment Variables** section of [CLAUDE.md](./CLAUDE.md).
