<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# wanginfo — Campus Event/Seminar Info App

## Stack
- **Next.js 16.2.6** (App Router), **React 19.2.4**, **TypeScript 5**
- **Tailwind CSS v4** (uses `@import "tailwindcss"` — NOT `@tailwind` directives)
- **Supabase** backend (`.env` supplies `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`) — flags `setState` in effects
- **ESLint** with `eslint-config-next` (core-web-vitals + typescript)

## Commands
| Command | Action |
|---------|--------|
| `npm run dev` | Dev server on localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check (no script in package.json) |

No test framework is configured.

## Conventions
- Path alias: `@/*` → `./src/*`
- Client components use `"use client"` directive
- Dark mode via `ThemeContext` + `localStorage("theme")` + `dark` class on `<html>`
- Custom utility classes in `src/app/globals.css`: `.glass`, `.primary-btn`, `.card-shadow`, `.navbar-shadow`, `.hover-card`, `.sidebar`, `.input-modern`, `.textarea-modern`
- Auth state via `AuthContext` wrapping `supabase.auth`

## Routes & Pages
| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Homepage with Navbar, Hero, event cards from Supabase |
| `/login` | Public | Email/password login, redirects to `/dashboard_admin` if admin |
| `/register` | Public | Registers with role=student via `supabase.auth.signUp()` |
| `/forgot-password` | Public | Sends reset link via `supabase.auth.resetPasswordForEmail()` |
| `/detail/[id]` | Public | Full event: all images, description, countdown, embed map, set/remove reminder |
| `/dashboard_admin` | Admin only | CRUD events: create/edit with images upload to Supabase Storage, delete |

## Supabase Tables
- `profiles` — `id` (FK auth.users), `username`, `role` (admin/student)
- `events` — `id`, `title`, `description`, `short_description`, `category`, `event_date`, `event_end_date` (nullable), `images` (text[]), `embed_map`, `created_by`
- `reminders` — `id`, `user_id`, `event_id` (unique per user+event)
- Trigger `on_auth_user_created` auto-creates profile on signup
- Storage bucket `event-images` (public, admin-only write)

## Notable
- `src/app/lib/supabase.ts` — single `createClient` call (no SSR package)
- `.env` is gitignored by default; the committed `.env` is non-standard
- `SUPABASE_SERVICE_ROLE_KEY` must be in `.env` for `/api/create-profile` to work (profile creation after signup)
- Login page auto-creates profile from `user_metadata` if missing (no service key needed)
- Supabase Auth must have `http://localhost:3000` as Site URL + Redirect URL for email confirmation to work locally
- No typecheck, test, or format scripts exist in package.json
- Build warning about multiple lockfiles is expected (nested workspace)