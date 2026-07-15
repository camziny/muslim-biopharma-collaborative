# Muslim Biopharma Collab — Member Directory

A Next.js member portal where authenticated members manage their own directory row in Google Sheets and access the WhatsApp invite after registration. Board members with the Clerk `admin` role can view, edit, and remove any member row.

## Stack

- Next.js 16 (App Router)
- Clerk (magic-link auth)
- Google Sheets API (data store)
- Tailwind CSS v4 + shadcn-style UI primitives
- react-hook-form + zod

## Local development

1. Copy environment variables:

```bash
cp .env.example .env.local
```

2. Fill in `.env.local`:

- Clerk keys from [clerk.com](https://clerk.com)
- Google service account credentials and sheet ID
- WhatsApp invite link

3. Install and run:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

If you see `missing required error components, refreshing...`, stop every `next dev` process, delete `.next`, and start again:

```bash
rm -rf .next && pnpm dev
```

## Clerk setup (magic link only)

In the Clerk dashboard:

1. Enable **Email address** as an identifier
2. Under Email, choose **Email verification link** (disable password sign-in)
3. Set allowed redirect URLs for local + production domains
4. Enable **Allow users to delete their accounts** (User & authentication → Restrictions / Account)
5. For board members, set user **Public metadata**:

```json
{ "role": "admin" }
```

6. Add a webhook endpoint pointing to `https://your-domain/api/webhooks/clerk` subscribed to `user.deleted`. Put the signing secret in `CLERK_WEBHOOK_SIGNING_SECRET`. (Needed if someone deletes via Clerk’s Manage account UI; the in-app UserButton delete clears the Sheet directly.)

Required env vars:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SIGNING_SECRET=
```

## Google Sheets setup

1. Create a Google Cloud project and enable **Google Sheets API**
2. Create a service account and download the JSON key
3. Share the target sheet with the service account email as **Editor**
4. Ensure the sheet header row matches exactly:

```
Name | Company | Title | Function | Disease Areas / Platform of Focus | Email (work) | Email (personal) | Phone (optional) | registered_at | whatsapp_sent | clerk_user_id
```

(`registered_at`, `whatsapp_sent`, and `clerk_user_id` are auto-added by the app if missing.)

5. Set env vars:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
```

For Vercel, store `GOOGLE_PRIVATE_KEY` as a single line with `\n` for newlines.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/` | Public | Landing page |
| `/sign-in`, `/sign-up` | Public | Clerk magic-link auth |
| `/onboarding` | Signed in | First-time profile creation |
| `/dashboard` | Signed in | Edit profile + WhatsApp invite |
| `/admin` | Admin | Full directory CRUD |

Members are matched to sheet rows by **Clerk primary email ↔ `Email (work)`**.

## WhatsApp invite

The invite link is read from `WHATSAPP_INVITE_LINK` and shown on `/dashboard` only after registration. Delivery logic lives in:

- `lib/whatsapp.ts` — link accessor
- `components/whatsapp-invite.tsx` — UI delivery component

Adding email delivery later should call the same link helper without changing registration flows.

## Migrating existing members

Run once to backfill `registered_at` for existing rows so members skip onboarding:

```bash
node --env-file=.env.local scripts/backfill-registered-at.mjs
```

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the project in Vercel
3. Add all env vars from `.env.example`
4. Deploy
5. Add the Vercel domain to Clerk allowed origins

## Scripts

```bash
pnpm dev         # local development
pnpm build       # production build
pnpm start       # run production build
pnpm lint        # eslint
pnpm test        # vitest (unit + component)
pnpm test:watch  # vitest watch mode
```
