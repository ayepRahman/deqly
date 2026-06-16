# Business Domain

> What Deqly is, the problem it solves, and the core concepts the product is built around.
> For the step-by-step user journey, see [onboarding.md](./onboarding.md).

## The idea

A paper name card has two sides and one title. But no person is a single title — they are a
collection of roles, projects, stories, and ways to be reached.

**Deqly turns the name card into a deck.** Each user builds a small set of cards, where every
card expresses a different facet of who they are, and shares the whole deck through a single
public link.

## Who it's for

Anyone who wants a richer, shareable digital identity than a one-line bio or a single business
card — freelancers, founders, creatives, and professionals who wear more than one hat.

## Core concepts

| Concept | What it is |
|---|---|
| **Deck** | A user's full set of cards, shown together and shared as one public profile. |
| **Profile card** | The first, always-present card built from the user's own profile (name, subtitle, photo, description, contact). It is not a separate row — it is derived from the `users` record. |
| **Cards** | Additional cards the user adds to the deck, stored in the `cards` table. |
| **Card type** | Each added card is either a **Showcase** or a **Story** card (see below). |
| **Public profile** | The read-only deck shown to anyone at `/<username>`. |
| **vCard / QR** | The back of a card offers a contact (vCard) export and a QR code so a viewer can save the person to their phone. |

## Card types

**Showcase card** — a single visual statement.
- A cropped image (full-bleed), plus a name, an occupation/subtitle, and a short description.

**Story card** — a short narrative.
- Up to two **story blocks**, each with a title, an optional subheader, and a description.

Both card types carry an accent **colour** chosen by the user for theming.

## Business rules & limits

These are enforced in `convex/cards.ts` and mirrored in `src/components/cards/types.ts`
(keep the two in sync).

| Rule | Value |
|---|---|
| Additional cards per user | up to **2** (so a deck shows **3** including the profile card) |
| Card name / title | ≤ **30** characters |
| Occupation / subtitle | ≤ **35** characters |
| Showcase description | ≤ **155** characters |
| Story description | ≤ **220** characters |
| Story blocks per story card | up to **2** |
| Card order | maintained as a contiguous `order` sequence after adds/deletes |

### Username rules

Set during onboarding and editable later; enforced in `convex/users.ts`.
- Lowercased and trimmed, must be **unique**.
- At least **3** characters.
- Only lowercase letters, numbers, and underscores (`^[a-z0-9_]+$`).
- The username is the public handle: the deck lives at `/<username>`.

## Images

Avatar, banner, and card images are uploaded directly to **Convex file storage**.

- Images are **cropped** before saving (`react-easy-crop`), to a card-portrait ratio for
  avatars/cards and a wide ratio for banners.
- The **uncropped original is retained** alongside the cropped result, so a user can re-frame
  (re-crop) an image later without quality loss. Originals are owner-only and never exposed on
  the public profile.

## Where this lives in the code

| Area | Location |
|---|---|
| Data schema (`users`, `cards`) | `convex/schema.ts` |
| Card CRUD + limits | `convex/cards.ts` |
| Profile / username / images | `convex/users.ts` |
| Auth (magic link) | `convex/auth.ts`, `src/lib/auth-*` |
| Card UI (showcase / story / profile) | `src/components/cards/` |
| Public profile view | `src/routes/$username.tsx` |
| Card editor (authenticated home) | `src/routes/_app/index.tsx` |
