# Wheel Experience â€” Host Console (v1: auth scaffold)

## Setup

1. Install dependencies
   ```
   npm install
   ```

2. Copy the env file and paste in your anon key
   (Supabase Dashboard â†’ Project Settings â†’ API â†’ "anon public" key)
   ```
   cp .env.local.example .env.local
   ```

3. Create a host account: Supabase Dashboard â†’ Authentication â†’ Users â†’
   Add user (email + password). There's no public sign-up on purpose â€”
   hosts are added manually by whoever runs the event.

4. Run it
   ```
   npm run dev
   ```

5. Visit http://localhost:3000/host/login and sign in.
   First sign-in automatically creates that host's `experiences` row.
   Signing back in later returns the same experience.

## What's here

- `app/host/login` â€” sign-in screen
- `app/host` â€” protected landing page: fetches-or-creates the host's
  experience, shows the five tile placeholders
- `middleware.ts` â€” redirects signed-out visitors away from `/host/*`
- `lib/supabase/` â€” browser + server Supabase clients

## Next

Setup / Style / Inventory / Play / Report are still placeholders â€”
Setup is the next one to build.