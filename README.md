# Contract Muse

TanStack Start (React 19 + Vite) contract-drafting copilot. Self-hosted on Railway,
powered by **InsForge** for auth + database + storage + functions and **MiniMax**
for the AI (chat + build router + agent generator).

This is a rebuilt version of the original Lovable-hosted prototype — Supabase
backend swapped for InsForge, Lovable AI Gateway swapped for MiniMax, all
Lovable-specific wrappers removed.

## Local development

```bash
npm install
cp .env.example .env       # then fill in real values
npm run dev                # http://localhost:5173
```

Required env vars (see `.env.example`):

| Var | Purpose |
| --- | --- |
| `VITE_INSFORGE_URL` | Browser InsForge base URL |
| `VITE_INSFORGE_ANON_KEY` | Browser-safe anon key |
| `INSFORGE_URL` | Server InsForge base URL (usually same as VITE) |
| `INSFORGE_ANON_KEY` | Server anon key for JWT verification |
| `INSFORGE_API_KEY` | Server admin key (privileged, never expose) |
| `MINIMAX_API_KEY` | MiniMax API key for chat + router |
| `MINIMAX_BASE_URL` | Defaults to `https://api.MiniMax.io/v1` |
| `MINIMAX_MODEL` | Defaults to `MiniMax-M3` |

## InsForge schema

Apply the SQL in `insforge/migrations/0001_init.sql` to your InsForge project:

```bash
npx @insforge/cli link         # link to your project (writes .insforge/project.json)
npx @insforge/cli db push      # apply migrations
```

Then create the storage bucket:

```bash
npx @insforge/cli storage create-bucket user-uploads --private
```

## Deploy to Railway

1. Push this repo to GitHub.
2. Create a new Railway project → "Deploy from GitHub repo".
3. Railway auto-detects the Dockerfile. The build runs `npm install && npm run build`,
   the runtime executes `node .output/server/index.mjs` on port `8080`.
4. Add the env vars listed above to your Railway service.
5. After first deploy, point your InsForge auth settings at the Railway URL so
   password-reset links resolve correctly:
   ```bash
   npx @insforge/cli config set auth.redirectUrl "https://your-app.up.railway.app"
   ```

## Project layout

```
src/
  integrations/
    supabase/                 # compat layer over InsForge (kept named so 20+ imports still work)
      client.ts               # browser client (SupabaseLikeClient proxy)
      client.server.ts        # admin client (privileged)
      auth-middleware.ts      # verifies Bearer JWT on serverFn RPCs
      auth-attacher.ts        # attaches Bearer from localStorage mirror
      auth-client-middleware.ts
      auth-token.ts           # localStorage cache of the access token
  lib/
    ai-gateway.ts             # MiniMax (OpenAI-compatible) provider
    build-router.functions.ts # MiniMax call that picks the demo app
    agents.functions.ts       # MiniMax-powered agent generator
  routes/
    api.chat.ts               # streaming chat (MiniMax + tool calling)
    app.build.tsx             # demo: phone / leaderboard / bugs (hardcoded)
    auth.tsx                  # InsForge email/password sign-in
    reset-password.tsx        # InsForge OTP-based reset flow
    ...
insforge/
  migrations/0001_init.sql    # full schema in one file
Dockerfile                    # Railway / Docker deployment
railway.json                  # Railway service metadata
```

## Architecture notes

- The `supabase/` folder is a compatibility shim. The exported `supabase`
  variable is actually an InsForge client wrapped in a `SupabaseLikeClient`
  proxy that exposes Supabase-style top-level methods (`from`, `auth`,
  `storage`, `functions`, `realtime`, `ai`, `emails`) on top of InsForge's
  restructured modules (`database.from`, `auth`, etc.). This avoids touching
  20+ route files that call `supabase.from('agents').select()`.
- InsForge does not expose `auth.updateUser({ password })`. The settings
  page triggers a one-time code email via `auth.sendResetPasswordEmail()`.
- The build-router and chat endpoints share the `createOpenAICompatible`
  factory from `@ai-sdk/openai-compatible`, pointed at MiniMax's base URL.
- Sessions are mirrored into `localStorage` (`insforge.auth.session.v1`)
  because the InsForge SDK does not expose `getSession()` publicly. This
  cache is cleared on sign-out and refreshed on every successful
  sign-in / sign-up.

## License

Private — internal contract-muse demo.