# Onboarding & Auth Journey

> How a new user goes from never-heard-of-Deqly to a live, shareable deck.
> For product concepts and rules, see [business-domain.md](./business-domain.md).

## At a glance

```
/login  ──submit email──▶  magic link email (Resend)
   │                                │
   │                          click link
   ▼                                ▼
            /api/auth verify ──▶ session created
                                     │
                       authenticated, no username?
                                     │ yes
                                     ▼
                               /onboarding  ──complete profile──▶  /  (deck editor)
                                     │ no (username already set)
                                     ▼
                                     /  (deck editor)
```

## Step 1 — Sign in (`/login`)

Magic-link only — there are no passwords.

1. The user enters their email (`src/routes/login.tsx`, `src/components/login/`).
2. `authClient.signIn.magicLink` triggers Better Auth, which sends a sign-in link via **Resend**.
3. The UI shows a "magic link sent" confirmation (`MagicLinkSent`).

If the user is already authenticated, `/login` redirects to `/` — **except** when the page is
opened with `?error=...` (a reused/expired link), so the "link expired" message can render
instead of bouncing the user onward.

## Step 2 — Verify the link

Clicking the email link hits the Better Auth handler (`/api/auth/$`) which verifies the token
and creates a session. `src/routes/auth.verify.tsx` handles the post-verification landing.
Expired or already-used links route back to `/login?error=...` with a friendly message.

## Step 3 — Auth gating (route guards)

- `src/routes/__root.tsx` fetches the auth token server-side in `beforeLoad` and exposes
  `isAuthenticated` to the router context.
- The `_app` route group (`src/routes/_app.tsx`) requires auth: unauthenticated visits
  `redirect` to `/login`.
- Inside `_app`, if the user is authenticated **but has no `username`**, they are sent to
  `/onboarding`. This is the gate that forces profile completion before using the app.

## Step 4 — Complete your profile (`/onboarding`)

`src/routes/onboarding.tsx` — "Complete Your Profile". Collected fields:

| Field | Required | Notes |
|---|---|---|
| Name | ✅ | Display name. |
| Username | ✅ | Unique handle; lowercase/numbers/underscore, ≥3 chars. Becomes `/<username>`. |
| Subtitle (occupation) | — | Optional one-liner. |
| Mobile number | — | Optional; a "Add to Card" toggle controls whether it appears on the deck. |
| External link | — | Optional; also has an "Add to Card" toggle. |

On submit, `api.users.updateProfile` saves the profile and the user is navigated to `/`.
If the username is taken or invalid, a `ConvexError` message is surfaced inline.

> Guard: if a user with a username somehow lands on `/onboarding`, they are redirected to `/`.

## Step 5 — Build the deck (`/_app`, home)

`src/routes/_app/index.tsx` is the authenticated editor:
- The **profile card** is shown first (built from the onboarding data).
- The user can **add** up to two more cards (Showcase or Story), edit text, pick an accent
  colour, and upload/crop images (avatar, card image, banner).
- The deck can be shared via the public link, native share, or copy-link.

## Editing later (`/profile`)

`src/routes/_app/profile.tsx` renders `ProfileForm` for editing profile details plus the
**avatar** and **banner** images (with the same crop / re-crop flow as the rest of the app).

## Key files

| Concern | File |
|---|---|
| Login UI + magic link | `src/routes/login.tsx`, `src/components/login/` |
| Link verification | `src/routes/auth.verify.tsx`, `src/routes/api/auth/$.ts` |
| Auth context / token | `src/routes/__root.tsx`, `src/lib/auth-server.ts`, `src/lib/auth-client.ts` |
| Auth gate + onboarding redirect | `src/routes/_app.tsx` |
| Onboarding form | `src/routes/onboarding.tsx` |
| Profile + username mutation | `convex/users.ts`, `convex/auth.ts` |
| Deck editor | `src/routes/_app/index.tsx` |
