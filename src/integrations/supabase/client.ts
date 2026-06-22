// Browser-side InsForge client.
//
// Kept under the historical `supabase/` path so existing imports
// (`import { supabase } from "@/integrations/supabase/client"`) keep working
// without touching every route. The exported `supabase` variable is actually
// an InsForge client instance wrapped in a Supabase-style compatibility layer.
//
// Compatibility shim: InsForge exposes the database as `client.database.from(...)`
// whereas Supabase exposed it at the top level (`client.from(...)`). To avoid
// updating 20+ call sites we re-expose the top-level Supabase-style methods
// (`from`, `auth`, `storage`, `functions`, `realtime`, `ai`, `emails`) on a
// `SupabaseLikeClient` that wraps the InsForge client.

import { createClient, type InsForgeClient } from "@insforge/sdk";
import {
  cacheAuthSession,
  loadCachedAuthSession,
  clearCachedAuthSession,
  type CachedAuthSession,
} from "./auth-token";

// What the rest of the app actually expects: a Supabase-style facade.
export type SupabaseLikeClient = InsForgeClient & {
  from: InsForgeClient["database"]["from"];
  auth: InsForgeClient["auth"];
  storage: InsForgeClient["storage"];
  functions: InsForgeClient["functions"];
  realtime: InsForgeClient["realtime"];
  ai: InsForgeClient["ai"];
  emails: InsForgeClient["emails"];
  database: InsForgeClient["database"];
  payments: InsForgeClient["payments"];
};

let _insforge: InsForgeClient | undefined;

function createInsForgeClient(): InsForgeClient {
  const baseUrl =
    (import.meta as any).env?.VITE_INSFORGE_URL || process.env.INSFORGE_URL;
  const anonKey =
    (import.meta as any).env?.VITE_INSFORGE_ANON_KEY ||
    process.env.INSFORGE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    const missing = [
      ...(!baseUrl ? ["VITE_INSFORGE_URL"] : []),
      ...(!anonKey ? ["VITE_INSFORGE_ANON_KEY"] : []),
    ];
    const message = `Missing InsForge environment variable(s): ${missing.join(
      ", ",
    )}. Set them in .env (see .env.example).`;
    console.error(`[InsForge] ${message}`);
    throw new Error(message);
  }

  const cached = loadCachedAuthSession();
  return createClient({
    baseUrl,
    anonKey,
    accessToken: cached?.accessToken ?? undefined,
  });
}

const SHIM_KEYS = [
  "from",
  "auth",
  "storage",
  "functions",
  "realtime",
  "ai",
  "emails",
  "database",
  "payments",
] as const;

function buildShims(c: InsForgeClient): SupabaseLikeClient {
  const shim = {
    from: c.database.from.bind(c.database),
    auth: c.auth,
    storage: c.storage,
    functions: c.functions,
    realtime: c.realtime,
    ai: c.ai,
    emails: c.emails,
    database: c.database,
    payments: c.payments,
    getHttpClient: c.getHttpClient.bind(c),
    setAccessToken: c.setAccessToken.bind(c),
  };
  return shim as unknown as SupabaseLikeClient;
}

function makeProxy(): SupabaseLikeClient {
  return new Proxy({} as SupabaseLikeClient, {
    get(_target, prop, _receiver) {
      if (!_insforge) _insforge = createInsForgeClient();
      const shims = buildShims(_insforge) as unknown as Record<
        string | symbol,
        unknown
      >;
      if (typeof prop === "string" && SHIM_KEYS.includes(prop as (typeof SHIM_KEYS)[number])) {
        return shims[prop];
      }
      const value = (_insforge as unknown as Record<string | symbol, unknown>)[
        prop
      ];
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(_insforge)
        : value;
    },
  });
}

export const supabase: SupabaseLikeClient = makeProxy();
export { supabase as insforge };
export {
  cacheAuthSession,
  loadCachedAuthSession,
  clearCachedAuthSession,
  type CachedAuthSession,
};
export type { InsForgeClient };