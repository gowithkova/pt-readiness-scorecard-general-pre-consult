# Family Wizard

A co-parenting coordination app — a shared workspace for two co-parents (or guardians) to manage:

- **Shared calendar & custody schedule** — events categorized as custody, school, medical, activity, or general, with a responsible-parent assignment.
- **Messaging** — a single kept-on-record thread between the household's members, updating live.
- **Expense tracking & reimbursement** — log a shared expense, it's split evenly across household members, and each person can mark their share paid.
- **Info bank** — emergency/medical/school contacts, children's profiles, and uploaded documents (legal, medical, school).
- **Planning** — longer-term parenting-plan items and decisions, tracked open → in progress → resolved.

Built with Next.js 16 (App Router) and [Supabase](https://supabase.com) (Postgres, Auth, Storage, Realtime).

## Project structure

```
src/
  app/
    login/, signup/, onboarding/      — auth & workspace setup
    (app)/                            — protected app shell (nav + pages)
      dashboard/ calendar/ messages/ expenses/ info-bank/ planning/ settings/
  lib/
    supabase/                         — browser/server/middleware Supabase clients
    household.ts                      — loads the signed-in user's household + membership
    types.ts, money.ts
  proxy.ts                            — Next.js 16 "proxy" (formerly middleware): session refresh + route protection
supabase/
  schema.sql                          — full database schema, RLS policies, and helper function
legacy/
  — the previous PT-readiness-scorecard static pages, kept for reference
```

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the schema**: open the SQL editor in your Supabase project and run the contents of `supabase/schema.sql`. This creates all tables, enables Row Level Security, and scopes every table to the signed-in user's household.
3. **Enable Realtime** for the `messages` table: Database → Replication → toggle `messages` on (or run `alter publication supabase_realtime add table messages;`).
4. **Create a Storage bucket** named `documents` (Storage → New bucket). It can be private — the app reads files through short-lived signed URLs, never a public link.
5. **Copy environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase → Project Settings → API.
6. **Install & run**:
   ```bash
   npm install
   npm run dev
   ```

## How it works

- **Sign up** creates a Supabase Auth user, then **Onboarding** either creates a new household (you get an invite code) or joins one with a co-parent's invite code.
- Every table is scoped to `household_id` and protected by RLS (`is_household_member()`), so one household's data is never visible to another.
- Expenses are split evenly across current household members when logged; each resulting share can be marked paid individually.
- Messages use Supabase Realtime (`postgres_changes` on `messages`) so both parents see new messages without refreshing.
- Documents are stored in the `documents` Storage bucket under `{household_id}/...` and served via 10-minute signed URLs.

## Deploying

Any Next.js host works (e.g. Vercel). Set the same two `NEXT_PUBLIC_SUPABASE_*` environment variables in your hosting provider's dashboard.
