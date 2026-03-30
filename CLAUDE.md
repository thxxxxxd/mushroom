# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Next.js Version

This project uses Next.js 16 which has breaking changes from older versions. Read `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Commands

Node.js v20+ is required. Load it via nvm before running any commands:

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
```

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type check
```

## Architecture

**魔法使公會菇菇看板** — A no-auth mushroom battle signup board for Pikmin Bloom friend groups.

### Data flow

- All data lives in **Supabase** (PostgreSQL). Credentials are in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- The Supabase client is a singleton in `lib/supabase.ts`, which also exports the `Event` and `Registration` types.
- RLS is enabled on both tables with public read/insert/delete policies. See `supabase-schema.sql` for the full schema.
- Realtime subscriptions (`supabase.channel`) are used on both pages to auto-refresh when data changes.

### Pages

- `app/page.tsx` — Board listing all events, ordered by `created_at` desc. Fetches registration counts separately and merges them client-side.
- `app/event/[id]/page.tsx` — Event detail: shows registrations with battle power, registration form, copy-link button, and delete button.

### Components

- `components/CreateEventModal.tsx` — Modal form to create an event (mushroom name, spots needed, optional coordinates).
- `components/EventCard.tsx` — Card on the board showing remaining spots or full status.

### Schema

```
events: id, mushroom_name, spots_needed (int), coordinates (nullable text), created_at
registrations: id, event_id (fk→events), nickname, battle_power (int), created_at
```

`spots_needed` is the number of additional players needed at creation time. An event is considered full when `registrations.length >= spots_needed`.
