# Morning Task — Playful Sunlight Routine Mobile App

Welcome to **Morning Task**, a gamified mobile app built with **React Native (TypeScript) + Expo** and **Supabase (PostgreSQL)**, following a vibrant, energetic "Playful Sunlight" theme.

---

## 📂 Project Structure
This folder contains the complete core code files for the mobile application:
- [App.tsx](file:///Users/visualsbyshiv/games/App.tsx) — Main Expo application with screen routing, states, Reanimated animations, and modal overlays.
- [database.sql](file:///Users/visualsbyshiv/games/database.sql) — Complete PostgreSQL schema, indices, leaderboard procedures, and cron trigger simulation.
- [package.json](file:///Users/visualsbyshiv/games/package.json) — Core app dependency manifests.
- [app.json](file:///Users/visualsbyshiv/games/app.json) — Expo configuration details.
- [tsconfig.json](file:///Users/visualsbyshiv/games/tsconfig.json) — TypeScript compiler preferences.

---

## 🎨 Visual Features & Animations (Reanimated)
The app incorporates premium mobile interactions using **React Native Reanimated**:
1. **The 8:00 PM Trigger**: Twilight Mode shifts the background to deep blue gradients and displays the locked solar egg capsule with an overlay lock icon.
2. **Sunrise Crack Breakout**: Tapping the capsule in the morning triggers a physical shake animation, a full-screen white/yellow flash transition, and spreads into warm sunrise gradients.
3. **Task Completion Timer**: Tracks completion duration (seconds elapsed) in real-time until the completion button is pressed.
4. **Hero Celebration Overlay**: Tapping "Quest Complete" scales down the button spring-style, then triggers a full-screen modal showing points earned, streaks updated, and large energetic typography: *"You are the Hero of the Day!"*.

---

## 🛠️ Step-by-Step Installation

### Prerequisites
- Node.js (v18 or higher recommended for modern React Native CLIs)
- Expo Go app installed on your physical mobile device (iOS/Android)

### 1. Local Development Setup
Run the following commands in your terminal to install dependencies and boot up the Metro bundler:

```bash
# 1. Install Node modules
npm install

# 2. Start the Expo development server
npx expo start
```

Once running, scan the QR code in your terminal using the **Expo Go** app or iOS Camera to open the app live on your phone.

---

## 🗄️ Backend Setup (Supabase / Postgres)
The tables and functions are designed to keep database queries optimized for high concurrency. 

### 1. Database Creation
Go to your **Supabase Dashboard**, open the **SQL Editor**, and copy-paste the contents of [database.sql](file:///Users/visualsbyshiv/games/database.sql). Run the script to initialize:
- Tables: `users`, `daily_tasks`, `user_progress`, `friendships`
- Fast composite indexing on completion dates and dates active.
- Functions: `get_global_leaderboard()` and `get_friend_recap_feed()`.
- Procedural scheduler: `generate_next_day_task()`.

### 2. Live Node.js API / Edge Function Call
To support the live 8:00 PM cron task generation, set up a Supabase Edge Function or an external cron scheduler (e.g., Vercel Cron, pg_cron) to execute:

```javascript
// Supabase Edge Function: supabase/functions/generate-daily-task/index.ts
import { serve } from "https://deno.land/std@0.168/0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Call the Postgres RPC database procedure
  const { error } = await supabase.rpc('generate_next_day_task')

  if (error) {
    return new Response(JSON.stringify({ success: false, error }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```
Make sure to trigger this endpoint daily at **20:00 (8:00 PM)** UTC/Local.
