// Server-side InsForge client (privileged, bypasses RLS).
//
// SECURITY: Use only inside server functions / API routes. Never expose to
// the browser. Configure via INSFORGE_URL + INSFORGE_API_KEY (admin key).
import { createAdminClient, type InsForgeClient } from "@insforge/sdk";
import type { SupabaseLikeClient } from "./client";

let _insforgeAdmin: InsForgeClient | undefined;

function createInsForgeAdminClient(): InsForgeClient {
  const baseUrl = process.env.INSFORGE_URL;
  const apiKey = process.env.INSFORGE_API_KEY;

  if (!baseUrl || !apiKey) {
    const missing = [
      ...(!baseUrl ? ["INSFORGE_URL"] : []),
      ...(!apiKey ? ["INSFORGE_API_KEY"] : []),
    ];
    const message = `Missing InsForge server environment variable(s): ${missing.join(
      ", ",
    )}. Set them in .env or your Railway service variables.`;
    console.error(`[InsForge Admin] ${message}`);
    throw new Error(message);
  }

  return createAdminClient({ baseUrl, apiKey });
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

export const supabaseAdmin: SupabaseLikeClient = new Proxy(
  {} as SupabaseLikeClient,
  {
    get(_target, prop, _receiver) {
      if (!_insforgeAdmin) _insforgeAdmin = createInsForgeAdminClient();
      const shims = buildShims(_insforgeAdmin) as unknown as Record<
        string | symbol,
        unknown
      >;
      if (typeof prop === "string" && SHIM_KEYS.includes(prop as (typeof SHIM_KEYS)[number])) {
        return shims[prop];
      }
      const value = (
        _insforgeAdmin as unknown as Record<string | symbol, unknown>
      )[prop];
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(_insforgeAdmin)
        : value;
    },
  },
);

export { supabaseAdmin as insforgeAdmin };
export type { InsForgeClient };