# playWheel.CONIQ — Project Context

A "Spin the Wheel" prize experience platform for internal workplace events,
under the CONIQ brand. Participants scan a QR code on their own device to
register, get a unique dial-entry code back, then enter that code on a
shared host tablet to spin a prize wheel and win.

## The constraint that shapes everything

The host (Conor) builds and runs this entire project from an **Android
tablet (Honor Tab 9) with no terminal and no local dev environment** —
browser only. Every architectural choice below exists because of this.
Before proposing a build tool, a CLI step, or anything that assumes a
terminal, stop and find the browser-only equivalent instead.

## Stack

- **Frontend**: plain HTML/CSS/JS, ES modules, **zero build step**. No
  npm, no bundler, no framework. Tailwind is loaded via the Play CDN
  (`<script src="https://cdn.tailwindcss.com">`) with an inline
  `tailwind.config` script per page — there is no shared config file, so
  the design tokens below must be kept in sync by hand across every HTML
  file's `<head>`.
- **Editing**: github.dev (browser-based VS Code), reached by changing
  `github.com` → `github.dev` in the repo URL.
- **Deployment**: Netlify, auto-deploys on every commit to the connected
  repo. Site: `coniqspinner.netlify.app`.
- **Backend**: Supabase — Postgres + RLS, Auth, Storage, Edge Functions.
  Project: `https://nhvpmhyvismtpanwdhde.supabase.co`. Uses the **newer
  publishable/secret key system**, not legacy anon/service_role JWTs.

## Repo layout

```
index.html              Host sign-in (Supabase Auth, email/password)
host.html                Host console — 5 tiles, fetches/creates the host's experience
setup.html                Setup tile — title/subtitle, registration link+toggle, spins, wheels
style.html                Style tile — colours, spoke, fonts, ambient animation, live preview
particle-system.js       Standalone floating-particle physics engine (see below)
supabase-client.js        Shared Supabase client (publishable key — safe client-side)
_headers                   Netlify cache-control (Cache-Control: no-cache) — see Gotchas
```

## Database schema (Postgres, RLS on everywhere, scoped via `host_id = auth.uid()`)

- **experiences** — one row per host. `id, host_id, title, subtitle, slug,
  status, registration_enabled, spins_awarded, style_config jsonb,
  created_at, updated_at`
- **wheels** — one or more per experience. `id, experience_id, name,
  display_order, prize_window_n, grand_prize_enabled,
  grand_prize_spin_number, extra_spin_enabled, created_at`
- **inventory_items** — *not built yet*. `id, wheel_id, name, item_type
  (physical|consolation), quantity, image_url, description, display_order`
- **registrations** — `id, experience_id, name, email_masked,
  email_fingerprint, guest_number, code, spins_total, spins_used,
  is_practice, status, created_at, expires_at, consent_at`
- **spins** — *not used yet*. `id, registration_id, wheel_id,
  inventory_item_id, is_consolation, is_grand_prize, is_practice,
  collected_at, created_at`
- **storage bucket** `wheel-assets` — public read, host-scoped write via
  RLS matching the first path segment to an owned experience id.

**Privacy design**: real emails are never stored. `register-participant`
(Supabase Edge Function, Deno) masks the email (`abcdef@google.com` →
`abxxx@xxle.com`) and computes an HMAC-SHA256 fingerprint using an
`EMAIL_PEPPER` secret that lives only in the function's environment, never
in the database. The fingerprint is what blocks duplicate registrations;
it's irreversible even with full DB access.

**Known TODO on that function**: once the registration page is built,
turn OFF "Verify JWT with legacy secret" in the function's settings — the
new publishable key isn't a JWT, so that platform-level check will
otherwise reject every real call from an anonymous participant.

## Design system — CONIQ Studio brand identity

Dark theme (chose Ink as background over Paper/light — revisit if asked).

| Token | Hex | Use |
|---|---|---|
| `ink` | `#121214` | page background |
| `paper` | `#F6F3EC` | primary text |
| `ember` | `#D9491A` | accent — CTAs, focus rings, *and* error states (no separate error colour in the brand palette, reused deliberately) |
| `slate` | `#2F4A45` | panel/card surfaces |
| `sand` | `#C9BFAE` | muted text, borders |
| `success` | `#55857C` | ready/positive status only — a tint of Slate, not an official brand colour, added to cover a gap |

Fonts: **General Sans** (Fontshare CDN) for display (bold) and body
(regular) — same family, two weights. **IBM Plex Mono** (Google Fonts)
for kickers/labels/functional text, uppercase + tracked.

Type scale applied **by hierarchy tier**, not literally on every heading:
H1 64px (host console title only — the one true "home" moment), H2 40px
(sub-page titles, login), H3 28px (card titles), Body 16px, Caption 12px.

Spacing: Tailwind's 4px-multiple utilities only (8pt-grid discipline) —
avoid off-grid values like `p-2.5`/`gap-3.5`.

## particle-system.js

A standalone, reusable `FloatingParticleSystem` class — DOM-based (no
canvas/WebGL), real elastic-collision physics, pure-CSS categories (no
external images except soccer ball, which deliberately uses the real ⚽
emoji after a custom CSS sphere had unfixable contrast problems in
testing). Built for the Style tile's live preview; designed to be reused
as-is for Play's actual wheel screen later.

Categories: `ice`, `golf`, `soccer` (emoji), `leaves` (3 species,
gradient + veins), `planets` (6), `coffee` (3 roasts × 2 crease styles),
`emoji3d` (6 CSS-built expressions), `custom` (PNG upload, up to 8,
weighted-random per spawn), `none`.

Physics: ambient drift, friction, wall **wraparound** (not bounce —
drifts off-frame, reappears from a random point on the opposite edge),
particle-particle elastic collision. The wheel is **not** a physics
obstacle — particles float freely behind it via a CSS `mask-image` (a
radial-gradient hole cut in the whole particle container, set by
`setWheelBounds()`), which clips them continuously and naturally as they
cross that boundary. An earlier per-frame z-index toggle approach caused
particles to visibly pop instead of sliding under — don't reintroduce it.

Public API: `setCategory()`, `setUploadedIcons()`, `setCount()`,
`setWheelBounds({cx,cy,r})`, `applySpinForce(strength)` (the hook Play
should call when a spin starts — pushes nearby particles outward +
tangentially), `start()`/`stop()`. Full extension guide is written as
comments at the bottom of the file itself.

## Gotchas learned the hard way

- **Deploys that don't seem to take effect**: check, in this order,
  (1) was the change actually *committed* in github.dev, not just typed
  (search the repo for a known string from the new code to confirm),
  (2) test in an Incognito tab to rule out local browser cache,
  (3) check Netlify's deploy log/timestamp. A `_headers` file
  (`Cache-Control: no-cache`) is already in place to prevent most of this.
- `particle-system.js` is imported from `style.html` with a cache-busting
  query string (`?v=N`) — bump the number when this file changes.
- Claude cannot visually render or screenshot pages in the environment
  this project has been built in — exotic/untested CSS for visual fidelity
  is risky. Prefer well-established techniques, or fall back to a real
  emoji/simple approach when precise visual correctness actually matters
  (see the soccer ball).
- The Supabase **secret** key must never appear in any client-side file —
  only the **publishable** key belongs in `supabase-client.js`.

## Status

**Done**: schema + RLS, `register-participant` edge function, host auth,
host console (5-tile home), Setup tile, Style tile (incl. particle
system), CONIQ brand redesign across all pages.

**Not built yet**: Inventory tile, Play tile (live spin screen — QR/dial
code entry, the actual wheel using `particle-system.js` +
`applySpinForce()`, the prize-window random-selection algorithm using
`wheels.prize_window_n`, fullscreen + 90° rotation with chrome
repositioning, practice mode, prize-collection confirmation), Report
tile, the participant registration page itself, and the guest-mode flow
(`registration_enabled = false` → immediate tap-to-spin, `guest_number`,
no dedup).
