# Contract Muse — End-to-End Rebuild Goal

> **Source repo:** https://github.com/animvsh/contract-muse-04.git
> **Status:** ✅ Complete and self-hostable on Railway
> **Generated:** 2026-06-22

---

## The Goal

Take the Lovable-hosted contract-muse prototype (TanStack Start + Supabase + Lovable AI Gateway) and rebuild it so it can be:

1. **Self-hosted on Railway** with a real backend (no Lovable lock-in).
2. **Powered by InsForge** for auth, database, storage, and server functions — replacing Supabase.
3. **Powered by MiniMax** for AI (chat, build router, agent generator) — replacing the Lovable AI Gateway.
4. **Fully functional as a demo** with no remaining Lovable-native features (no Lovable cloud auth, no Lovable OAuth, no Lovable headers).
5. **Locally runnable** end-to-end so the user can `npm install && npm run dev` and see the demo working.

---

## What Was Rebuilt

### 1. Backend swap (Supabase → InsForge)

| Concern | Before | After |
| --- | --- | --- |
| Client | `@supabase/supabase-js` | `@insforge/sdk` (wrapped in a `SupabaseLikeClient` proxy for backward compatibility) |
| Auth | Supabase email/password + OAuth | InsForge email/password + OTP-based password reset |
| DB | Supabase Postgres + RLS | InsForge Postgres + JWT-based RLS (same `auth.uid()` / `auth.jwt()` conventions) |
| Storage | Supabase buckets (`storage.objects`) | InsForge buckets via CLI |
| Server admin | `supabaseAdmin` service-role | `insforgeAdmin` (renamed alias `supabaseAdmin` for compat) |

### 2. AI swap (Lovable AI Gateway → MiniMax)

| Concern | Before | After |
| --- | --- | --- |
| Provider | `@ai-sdk/openai-compatible` → `https://ai.gateway.lovable.dev/v1` | `@ai-sdk/openai-compatible` → `https://api.MiniMax.io/v1` |
| Auth header | `Lovable-API-Key: …` + `X-Lovable-AIG-SDK` | `Authorization: Bearer …` (standard OpenAI-compat) |
| Chat model | `google/gemini-3-flash-preview` | `MiniMax-M3` (configurable via `MINIMAX_MODEL`) |
| Build router model | `google/gemini-2.5-flash` | `MiniMax-M3` (configurable via `MINIMAX_FAST_MODEL`) |
| Env var | `LOVABLE_API_KEY` | `MINIMAX_API_KEY` |

### 3. Removed Lovable-native features

| Lovable feature | Replaced with |
| --- | --- |
| `@lovable.dev/cloud-auth-js` (cloud OAuth) | Email/password via InsForge |
| `lovable.auth.signInWithOAuth("google", …)` button | Removed; users sign in with email/password |
| `@lovable.dev/vite-tanstack-config` (Lovable's wrapped Vite config) | Manual `@tanstack/react-start` + Tailwind v4 + React plugins |
| Cloudflare wrangler preset | Node.js server preset (Railway-compatible) |
| `Lovable-AIG-*` request headers | Standard `Authorization: Bearer` |

### 4. File-by-file changes

```
package.json                  # Removed @supabase, @lovable/*, @cloudflare/vite-plugin, nitro
                              # Added @insforge/sdk
vite.config.ts                # Replaced @lovable.dev/vite-tanstack-config with manual plugins
Dockerfile                    # NEW — multi-stage Node 22 build for Railway
railway.json                  # NEW — Railway service metadata
.dockerignore                 # NEW
.env.example                  # NEW — documents required vars
README.md                     # NEW — setup + deploy instructions
GOALS.md                      # NEW — this file

src/integrations/supabase/    # KEPT the folder name to avoid touching 20+ import sites
  client.ts                   # REWRITTEN — wraps @insforge/sdk with SupabaseLikeClient proxy
  client.server.ts            # REWRITTEN — admin client + SupabaseLikeClient proxy
  auth-middleware.ts          # REWRITTEN — verifies Bearer via getCurrentUser
  auth-attacher.ts            # REWRITTEN — attaches Bearer from localStorage mirror
  auth-client-middleware.ts   # REWRITTEN — same as auth-attacher (compat)
  auth-token.ts               # NEW — localStorage cache of the access token
  types.ts                    # DELETED — Supabase-specific, no longer needed

src/integrations/lovable/     # DELETED entirely

src/hooks/use-auth.tsx        # REWRITTEN — uses InsForge getCurrentUser + localStorage mirror
src/lib/ai-gateway.ts         # REWRITTEN — MiniMax (OpenAI-compatible) provider
src/lib/build-router.functions.ts
                              # REWRITTEN — calls MiniMax chat/completions
src/lib/agents.functions.ts   # UPDATED — same MiniMax call (was callLovableAI; kept name)
src/routes/api.chat.ts        # UPDATED — uses createMinimaxProvider + DEFAULT_MODEL
src/routes/auth.tsx           # REWRITTEN — plain email/password, no Google OAuth button
src/routes/reset-password.tsx # REWRITTEN — InsForge OTP-based flow
src/routes/app.settings.tsx   # UPDATED — "change password" now triggers an OTP email
src/routes/api/public/waitlist-confirm.ts
                              # UPDATED — uses insforgeAdmin.emails.send instead of Lovable email

supabase/                     # DELETED
insforge/migrations/0001_init.sql
                              # NEW — full schema in one idempotent migration
```

### 5. Codebase compatibility shim

The exported `supabase` variable is now actually an InsForge client wrapped in a
`SupabaseLikeClient` proxy. It exposes both the InsForge-native API
(`supabase.database.from(...)`) and the Supabase-style top-level methods
(`supabase.from(...)`, `supabase.auth.*`, `supabase.storage.*`) so that all 20+
existing route files compile without modification.

The proxy checks `from`, `auth`, `storage`, `functions`, `realtime`, `ai`,
`emails`, `database`, `payments` first, then falls through to the underlying
InsForge client for everything else (so any new InsForge API we add later
still works).

### 6. Auth token mirroring

InsForge's SDK keeps the JWT inside a private `TokenManager` and does not
expose `getSession()` publicly. To attach the bearer token to serverFn RPCs
we mirror it into `localStorage` under the key
`insforge.auth.session.v1` after every successful sign-in / sign-up. The
mirror is cleared on sign-out and refreshed on page reload via
`getCurrentUser()`.

---

## Verification

### TypeScript

```
$ npx tsc --noEmit
(no output — clean)
```

### Production build

```
$ npx vite build
✓ built in 3.45s
dist/server/server.js (67 KB)
dist/server/assets/... (47 chunks)
```

### Dev server

```
$ npm run dev
VITE v7.3.5 ready in 903 ms
GET /         → HTTP 200
GET /auth     → HTTP 200  (sign-in form renders)
GET /reset-password → HTTP 200  (OTP form renders)
GET /app/build → HTTP 200  (build demo renders, auth-gated client-side)
POST /api/chat → HTTP 200  (rejects empty messages correctly with AI_InvalidPromptError;
                            reaches the MiniMax network call with a valid key)
```

### Production server

```
$ node dist/server/server.js
GET /         → HTTP 200
GET /auth     → HTTP 200
```

---

## How to Run It

### Local

```bash
cd contract-muse
npm install
cp .env.example .env       # then fill in real values:
                           #   VITE_INSFORGE_URL, VITE_INSFORGE_ANON_KEY
                           #   INSFORGE_URL, INSFORGE_ANON_KEY, INSFORGE_API_KEY
                           #   MINIMAX_API_KEY, MINIMAX_BASE_URL, MINIMAX_MODEL

# Apply InsForge schema (one-time)
npx @insforge/cli link
npx @insforge/cli db push
npx @insforge/cli storage create-bucket user-uploads --private

npm run dev   # http://localhost:5173
```

### Railway

1. Push the repo to GitHub.
2. Create a new Railway project → "Deploy from GitHub repo".
3. Railway auto-detects the Dockerfile. The build runs `npm install && npm run build`,
   the runtime executes `node dist/server/server.js` on port `8080`.
4. Add env vars to your Railway service (see `.env.example`).
5. After first deploy, point your InsForge auth settings at the Railway URL so
   password-reset links resolve correctly:
   ```bash
   npx @insforge/cli config set auth.redirectUrl "https://your-app.up.railway.app"
   ```

---

## What's Required from the User

| Step | Who | What |
| --- | --- | --- |
| 1 | User | Create an InsForge project, get URL + anon key + admin API key, fill `.env` |
| 2 | User | Run `npx @insforge/cli db push` to apply the schema in `insforge/migrations/0001_init.sql` |
| 3 | User | Run `npx @insforge/cli storage create-bucket user-uploads --private` |
| 4 | User | (Optional) Configure InsForge SMTP so password-reset OTPs send successfully |
| 5 | User | Push to GitHub, connect Railway repo, add env vars in Railway dashboard |
| 6 | User | **Rotate the `sk-cp-…` MiniMax key** that was pasted in chat — it's now treated as a runtime-only env var |

---

## What Was Tested

✅ `npm install` succeeds
✅ `npx tsc --noEmit` passes (zero type errors)
✅ `npx vite build` succeeds (47 chunks emitted, server bundle ~67 KB)
✅ `npm run dev` boots in ~1 second, all routes return 200
✅ `node dist/server/server.js` boots and serves SSR HTML
✅ `/api/chat` correctly validates input and reaches the AI SDK
✅ All Supabase-style top-level methods (`supabase.from(...)`, `supabase.auth.signUp(...)`, etc.) compile and route to InsForge

## What Was NOT Tested (requires live InsForge project)

- ⏳ End-to-end sign-up + sign-in flow (needs real InsForge project)
- ⏳ Database queries (RLS policies will only fire with a live project)
- ⏳ Storage upload (`global-uploader.tsx` — needs the `user-uploads` bucket)
- ⏳ MiniMax response streaming (needs a valid `MINIMAX_API_KEY`)

---

## Security Notes

🔒 **The MiniMax key you pasted in chat is NOT in any committed file.** I wired it as the `MINIMAX_API_KEY` env var only. The `.env` file is git-ignored. **Please rotate the key** since it was exposed in plaintext over chat.

🔒 **All secrets live in environment variables** — none are hardcoded, none are in the repo.

🔒 **`INSFORGE_API_KEY` is admin-only and only used server-side** — never bundled to the browser.

🔒 **JWT verification** happens server-side via `auth-middleware.ts`, which calls
InsForge's `getCurrentUser()` with a per-request client bound to the caller's
bearer token. Invalid tokens get a 401.

---

## What's Pending / Future Work

- [ ] Brand rename Beevr → Contract Muse across all UI strings (currently only the auth page, AI prompts, and the email template are updated)
- [ ] OG image, social metadata (still references "Beevr")
- [ ] Tests (the original repo didn't ship with tests; we don't have any yet)
- [ ] CI pipeline (e.g. GitHub Actions running `tsc + vite build`)
- [ ] Optional: add `react-query` query/mutation hooks for the database tables to reduce boilerplate in route files

---

## Files Delivered

- `/Users/animesh/.mavis/sessions/mvs_a8f2e98d63f643bc9983baf7dac73c8d/workspace/contract-muse/` — the rebuilt project (full source tree, ~498 npm packages installed, builds clean, runs locally)
- `GOALS.md` (this file) — the end-to-end goal + status document
- `README.md` — quick-start + Railway deploy instructions
- `Dockerfile` + `railway.json` + `.dockerignore` — Railway deployment config

## Source Control

The repo has not been pushed to a new GitHub repo yet — the working tree at
`/Users/animesh/.mavis/sessions/mvs_a8f2e98d63f643bc9983baf7dac73c8d/workspace/contract-muse`
is a clean checkout of the original (without `.git`) so you can pick where to
host the new repo. Tell me the target GitHub org/name and I'll initialize git,
commit, and push it (assuming you have credentials set up locally).